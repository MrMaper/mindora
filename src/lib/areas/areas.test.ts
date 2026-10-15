import { describe, expect, it } from "vitest";
import {
  SEED_AREA_KEYS,
  SEED_AREA_TEMPLATES,
  areaBucketIdsToExclude,
  areaProjectIdsForUser,
  areaRefForGuess,
  areaRefForTemplate,
  areaWhere,
  hubContentWhere,
  hubKindForAreaId,
  hubTaskExclusion,
  isAreaBucketId,
  isAreaBucketOf,
  isHubAreaId,
  isHubTask,
  isLanguageTask,
  isResearchTask,
  personalAreaProjectId,
  seedKeyFromBucketId,
  taskAreaOrNull,
  templateKeyForGuess,
  templateKeyForSlug,
} from "./index";
import { buildMemberContextFromRows, type UserAreaRow } from "./member-context";
import { areaTagline } from "./display";
import { parseModuleFlags } from "@/lib/modules";

function seedRows(userId: string): UserAreaRow[] {
  return SEED_AREA_TEMPLATES.map(t => ({
    id: `ua-${t.templateKey}`,
    name: t.nameFa,
    nameIsDefault: true,
    templateKey: t.templateKey,
    color: null,
    icon: null,
    sortOrder: t.sortOrder,
    archived: false,
    isDefault: t.isDefault,
    hubFor:
      t.hubFor === "research"
        ? "RESEARCH"
        : t.hubFor === "language"
          ? "LANGUAGE"
          : null,
    bucketProjectId: personalAreaProjectId(
      userId,
      t.templateKey as (typeof SEED_AREA_KEYS)[number],
    ),
  }));
}

const flagsOn = parseModuleFlags({});
const flagsOff = { ...flagsOn, research: false, language: false };

describe("hub predicates", () => {
  const ctx = buildMemberContextFromRows("u1", flagsOn, seedRows("u1"));

  it("hub kind comes from hubFor, not from names", () => {
    expect(hubKindForAreaId("ua-research", ctx)).toBe("research");
    expect(hubKindForAreaId("ua-language", ctx)).toBe("language");
    expect(hubKindForAreaId("ua-work", ctx)).toBeNull();
    expect(isHubAreaId("ua-life", ctx)).toBe(false);
    expect(isHubAreaId(null, ctx)).toBe(false);
  });

  it("isHubTask resolves the task area, then its project's area", () => {
    const hubIds = ["ua-research", "ua-language"];
    expect(isHubTask({ areaId: "ua-research" }, hubIds)).toBe(true);
    expect(isHubTask({ areaId: null, project: { areaId: "ua-language" } }, hubIds)).toBe(true);
    expect(isHubTask({ areaId: "ua-work", project: { areaId: "ua-research" } }, hubIds)).toBe(false);
    expect(isHubTask({}, hubIds)).toBe(false);
    expect(isHubTask({ areaId: "ua-research" })).toBe(false);
  });

  it("hubTaskExclusion excludes only active hubs, by area id", () => {
    expect(hubTaskExclusion(ctx)).toEqual({
      NOT: {
        OR: [
          { areaId: { in: ["ua-research", "ua-language"] } },
          { project: { areaId: { in: ["ua-research", "ua-language"] } } },
        ],
      },
    });
  });

  it("hubTaskExclusion with modules off excludes nothing", () => {
    const off = buildMemberContextFromRows("u1", flagsOff, seedRows("u1"));
    expect(hubTaskExclusion(off)).toEqual({});
  });

  it("research/language task checks use the hub area id", () => {
    expect(isResearchTask({ areaId: "ua-research" }, "ua-research")).toBe(true);
    expect(isResearchTask({ project: { areaId: "ua-research" } }, "ua-research")).toBe(true);
    expect(isResearchTask({ areaId: "ua-language" }, "ua-research")).toBe(false);
    expect(isResearchTask({ areaId: "ua-research" }, null)).toBe(false);
    expect(isLanguageTask({ project: { areaId: "ua-language" } }, "ua-language")).toBe(true);
  });

  it("hubContentWhere never matches when there is no hub", () => {
    expect(hubContentWhere(null)).toEqual({ id: "__never__" });
    expect(hubContentWhere("h")).toEqual({
      OR: [{ areaId: "h" }, { project: { areaId: "h" } }],
    });
  });
});

describe("task area resolution", () => {
  it("prefers the task area, then the project area", () => {
    expect(taskAreaOrNull({ areaId: "a", project: { areaId: "b" } })).toBe("a");
    expect(taskAreaOrNull({ areaId: null, project: { areaId: "b" } })).toBe("b");
    expect(taskAreaOrNull({})).toBeNull();
  });

  it("areaWhere matches the task area or its project area", () => {
    expect(areaWhere("a")).toEqual({
      OR: [{ areaId: "a" }, { project: { areaId: "a" } }],
    });
  });
});

describe("capture guesses and legacy slugs map through templateKey", () => {
  it("guess → templateKey", () => {
    expect(templateKeyForGuess("PHD")).toBe("research");
    expect(templateKeyForGuess("LANG")).toBe("language");
    expect(templateKeyForGuess("WORK")).toBe("work");
    expect(templateKeyForGuess("LIFE")).toBe("life");
    expect(templateKeyForGuess("nope")).toBe("life");
    expect(templateKeyForGuess(null)).toBe("life");
  });

  it("URL slug → templateKey (phd→research, lang→language)", () => {
    expect(templateKeyForSlug("phd")).toBe("research");
    expect(templateKeyForSlug("research")).toBe("research");
    expect(templateKeyForSlug("LANG")).toBe("language");
    expect(templateKeyForSlug("language")).toBe("language");
    expect(templateKeyForSlug("life")).toBe("life");
    expect(templateKeyForSlug("work")).toBe("work");
    expect(templateKeyForSlug("some-cuid")).toBeNull();
  });

  const ctx = buildMemberContextFromRows("u1", flagsOn, seedRows("u1"));

  it("resolves a guess to the member's area, hubs by hubFor", () => {
    expect(areaRefForGuess(ctx.areas, "PHD")?.id).toBe("ua-research");
    expect(areaRefForGuess(ctx.areas, "LANG")?.id).toBe("ua-language");
    expect(areaRefForGuess(ctx.areas, "WORK")?.id).toBe("ua-work");
    expect(areaRefForGuess(ctx.areas, "LIFE")?.id).toBe("ua-life");
    expect(areaRefForTemplate(ctx.areas, "research")?.id).toBe("ua-research");
  });

  it("falls back to the default area when the guessed area is archived", () => {
    const rows = seedRows("u1").map(r =>
      r.templateKey === "work" ? { ...r, archived: true } : r,
    );
    const c = buildMemberContextFromRows("u1", flagsOn, rows);
    expect(areaRefForGuess(c.areas, "WORK")?.id).toBe("ua-life");
  });

  it("renamed hub areas still resolve (no name matching)", () => {
    const rows = seedRows("u1").map(r =>
      r.templateKey === "research" ? { ...r, name: "Thesis", nameIsDefault: false } : r,
    );
    const c = buildMemberContextFromRows("u1", flagsOn, rows);
    expect(areaRefForGuess(c.areas, "PHD")?.id).toBe("ua-research");
    expect(c.areas.find(a => a.id === "ua-research")?.nameFa).toBe("Thesis");
  });
});

describe("area buckets", () => {
  it("round-trips personal bucket ids for the seeded areas", () => {
    for (const key of SEED_AREA_KEYS) {
      const id = personalAreaProjectId("u1", key);
      expect(isAreaBucketId(id)).toBe(true);
      expect(seedKeyFromBucketId(id)).toBe(key);
    }
    expect(areaProjectIdsForUser("u1").research).toBe("area-phd-u1");
    expect(areaProjectIdsForUser("u1").language).toBe("area-lang-u1");
  });

  it("recognises legacy shared ids and custom inbox buckets", () => {
    expect(isAreaBucketId("area-lang")).toBe(true);
    expect(seedKeyFromBucketId("area-lang")).toBe("language");
    expect(isAreaBucketId("area-inbox-abc")).toBe(true);
    expect(isAreaBucketId("some-project")).toBe(false);
  });

  it("matches a bucket against its area, including the legacy shared id", () => {
    const area = { bucketProjectId: "area-lang-u1", templateKey: "language" };
    expect(isAreaBucketOf("area-lang-u1", area)).toBe(true);
    expect(isAreaBucketOf("area-lang", area)).toBe(true);
    expect(isAreaBucketOf("area-work-u1", area)).toBe(false);
    expect(areaBucketIdsToExclude(area)).toEqual(["area-lang-u1", "area-lang"]);
    const custom = { bucketProjectId: "area-inbox-x", templateKey: "custom" };
    expect(areaBucketIdsToExclude(custom)).toEqual(["area-inbox-x"]);
  });
});

describe("member context (pure)", () => {
  it("builds the four seeded areas with research/language hubs", () => {
    const ctx = buildMemberContextFromRows("u1", flagsOn, seedRows("u1"));
    expect(ctx.areas.map(a => a.templateKey)).toEqual([
      "life",
      "work",
      "research",
      "language",
    ]);
    expect(ctx.defaultArea.templateKey).toBe("life");
    expect(ctx.hubAreas.research?.id).toBe("ua-research");
    expect(ctx.hubAreas.language?.id).toBe("ua-language");
    expect(ctx.areas.find(a => a.templateKey === "work")?.hubFor).toBeNull();
    expect(ctx.areas.every(a => a.bucketProjectId.endsWith("-u1"))).toBe(true);
  });

  it("renders template names while nameIsDefault, typed names otherwise", () => {
    const rows = seedRows("u1");
    const ctx = buildMemberContextFromRows("u1", flagsOn, rows);
    const research = ctx.areas.find(a => a.templateKey === "research")!;
    expect(research.nameEn).toBe("PhD");
    const custom = buildMemberContextFromRows("u1", flagsOn, [
      { ...rows[0]!, name: "Home", nameIsDefault: false },
      ...rows.slice(1),
    ]);
    expect(custom.areas.find(a => a.id === "ua-life")?.nameFa).toBe("Home");
  });

  it("resolves area taglines for seed defaults and custom buckets", () => {
    expect(
      areaTagline(
        { templateKey: "language", nameIsDefault: true },
        "مهارت‌ها، واژگان و آمادگی آزمون",
        "EN",
      ),
    ).toBe("Skills, vocab and exam prep");
    expect(
      areaTagline(
        { templateKey: "custom", nameIsDefault: false },
        "تمرین روزانه و مسابقات",
        "FA",
      ),
    ).toBe("تمرین روزانه و مسابقات");
    expect(
      areaTagline({ templateKey: "custom", nameIsDefault: false }, null, "FA"),
    ).toBeNull();
  });

  it("applies stored order and archived flags", () => {
    const rows = seedRows("u1").map(r =>
      r.templateKey === "work" ? { ...r, sortOrder: 9, archived: true } : r,
    );
    const ctx = buildMemberContextFromRows("u1", flagsOn, rows);
    expect(ctx.areas.at(-1)!.templateKey).toBe("work");
    expect(ctx.areas.at(-1)!.archived).toBe(true);
  });
});
