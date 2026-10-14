import { describe, expect, it } from "vitest";
import {
  AREA_ORDER,
  DEFAULT_AREA,
  HUB_AREAS,
  LANGUAGE_AREA,
  LIFE_AREAS,
  RESEARCH_AREA,
  WORKSPACE_AREAS,
  areaBucketIdsToExclude,
  areaProjectIdsForUser,
  areaWhere,
  coerceLifeArea,
  emptyAreaCounts,
  hubTaskExclusion,
  isAreaBucketId,
  isHubArea,
  isHubTask,
  isLanguageTask,
  isLifeAreaValue,
  isResearchTask,
  isUserAreaBucket,
  lifeAreaFromBucketId,
  personalAreaProjectId,
  resolveTaskArea,
  taskAreaOrNull,
} from "./index";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { buildAreaRefs, buildMemberContext } from "./member-context";
import { parseModuleFlags } from "@/lib/modules";

type Task = {
  area?: string | null;
  project?: { area?: string | null } | null;
};

/** Tiny evaluator for the exact Prisma shape `hubTaskExclusion()` returns. */
function matchesExclusion(task: Task): boolean {
  const where = hubTaskExclusion() as {
    NOT: { OR: [{ area: { in: string[] } }, { project: { area: { in: string[] } } }] };
  };
  const [byTask, byProject] = where.NOT.OR;
  const hit =
    (task.area != null && byTask.area.in.includes(task.area)) ||
    (task.project?.area != null && byProject.project.area.in.includes(task.project.area));
  return !hit;
}

const SAMPLES: Task[] = [
  {},
  { area: null, project: null },
  { area: "LIFE" },
  { area: "WORK", project: { area: "PHD" } },
  { area: null, project: { area: "LANG" } },
  { area: "PHD", project: { area: "LIFE" } },
  { area: "LANG" },
  { project: { area: "WORK" } },
];

describe("hub predicates", () => {
  it("hub areas are research + language only", () => {
    expect(HUB_AREAS).toEqual([RESEARCH_AREA, LANGUAGE_AREA]);
    expect(isHubArea("PHD")).toBe(true);
    expect(isHubArea("LANG")).toBe(true);
    expect(isHubArea("WORK")).toBe(false);
    expect(isHubArea(null)).toBe(false);
    expect(WORKSPACE_AREAS.some(isHubArea)).toBe(false);
  });

  it("isHubTask agrees with the Prisma exclusion fragment on every sample", () => {
    for (const task of SAMPLES) {
      expect(isHubTask(task)).toBe(!matchesExclusion(task));
    }
  });

  it("taskWhereExcludeHub (legacy export) is the same fragment", () => {
    expect(taskWhereExcludeHub()).toEqual(hubTaskExclusion());
  });

  it("research/language task checks look at area and project area", () => {
    expect(isResearchTask({ area: "PHD" })).toBe(true);
    expect(isResearchTask({ project: { area: "PHD" } })).toBe(true);
    expect(isResearchTask({ area: "LANG" })).toBe(false);
    expect(isLanguageTask({ project: { area: "LANG" } })).toBe(true);
  });
});

describe("task area resolution", () => {
  it("prefers the task area, then the project area", () => {
    expect(resolveTaskArea({ area: "WORK", project: { area: "PHD" } })).toBe("WORK");
    expect(resolveTaskArea({ area: null, project: { area: "PHD" } })).toBe("PHD");
  });

  it("falls back to the default area, null variant stays null", () => {
    expect(resolveTaskArea({})).toBe(DEFAULT_AREA);
    expect(taskAreaOrNull({})).toBeNull();
    expect(taskAreaOrNull({ project: { area: "LANG" } })).toBe("LANG");
  });

  it("coerces junk to the default area", () => {
    expect(coerceLifeArea("nope")).toBe(DEFAULT_AREA);
    expect(isLifeAreaValue("PHD")).toBe(true);
    expect(isLifeAreaValue("phd")).toBe(false);
    expect(isLifeAreaValue("")).toBe(false);
  });

  it("areaWhere matches the task area or its project area", () => {
    expect(areaWhere("PHD")).toEqual({
      OR: [{ area: "PHD" }, { project: { area: "PHD" } }],
    });
  });
});

describe("area constants", () => {
  it("order and counters cover every area", () => {
    expect(Object.keys(AREA_ORDER).sort()).toEqual([...LIFE_AREAS].sort());
    expect(AREA_ORDER).toEqual({ PHD: 0, WORK: 1, LIFE: 2, LANG: 3 });
    expect(emptyAreaCounts()).toEqual({ PHD: 0, WORK: 0, LIFE: 0, LANG: 0 });
  });
});

describe("area buckets", () => {
  it("round-trips personal bucket ids", () => {
    for (const area of LIFE_AREAS) {
      const id = personalAreaProjectId("u1", area);
      expect(isAreaBucketId(id)).toBe(true);
      expect(lifeAreaFromBucketId(id)).toBe(area);
      expect(isUserAreaBucket(id, "u1", area)).toBe(true);
      expect(isUserAreaBucket(id, "u2", area)).toBe(false);
    }
    expect(areaProjectIdsForUser("u1").PHD).toBe("area-phd-u1");
  });

  it("recognises legacy shared ids and excludes both forms", () => {
    expect(isAreaBucketId("area-lang")).toBe(true);
    expect(lifeAreaFromBucketId("area-lang")).toBe("LANG");
    expect(areaBucketIdsToExclude("u1", "LANG")).toEqual(["area-lang-u1", "area-lang"]);
    expect(isAreaBucketId("some-project")).toBe(false);
  });
});

describe("member context (pure)", () => {
  const flags = parseModuleFlags({});

  it("defaults to the four enum areas with research/language hubs", () => {
    const ctx = buildMemberContext("u1", flags, []);
    expect(ctx.areas.map(a => a.id)).toEqual([...LIFE_AREAS]);
    expect(ctx.defaultArea.id).toBe(DEFAULT_AREA);
    expect(ctx.hubAreas.research?.id).toBe(RESEARCH_AREA);
    expect(ctx.hubAreas.language?.id).toBe(LANGUAGE_AREA);
    expect(ctx.areas.find(a => a.id === "WORK")?.hubFor).toBeNull();
    expect(ctx.areas.every(a => a.bucketProjectId.endsWith("-u1"))).toBe(true);
  });

  it("applies stored preferences (order, color, archived)", () => {
    const refs = buildAreaRefs("u1", [
      { area: "LIFE", color: "orange", icon: "home", sortOrder: -1, archived: false },
      { area: "WORK", color: null, icon: null, sortOrder: 9, archived: true },
    ]);
    expect(refs[0]!.id).toBe("LIFE");
    expect(refs[0]!.color).toBe("orange");
    expect(refs.at(-1)!.id).toBe("WORK");
    expect(refs.at(-1)!.archived).toBe(true);
  });
});
