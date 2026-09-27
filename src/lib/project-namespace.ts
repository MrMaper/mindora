import type { LifeArea } from "@/types/db";
import { AREA_META, LIFE_AREAS } from "@/lib/life";
import {
  isAreaBucketId,
  allLegacyBucketIds,
  personalAreaProjectId,
  lifeAreaFromBucketId,
} from "@/lib/area-projects";

export type ProjectKind = "bucket" | "path" | "workspace";

export type ProjectListScope =
  | "workspace"
  | "life"
  | "research"
  | "language"
  | "assignable"
  | "all";

export const HUB_AREAS: LifeArea[] = ["PHD", "LANG"];
export const WORKSPACE_AREAS: LifeArea[] = ["WORK", "LIFE"];

export { isAreaBucketId, personalAreaProjectId, lifeAreaFromBucketId };

export function projectKind(project: {
  id: string;
  area: LifeArea | string | null | undefined;
}): ProjectKind {
  if (isAreaBucketId(project.id)) return "bucket";
  const area = project.area ?? "LIFE";
  if (area === "PHD" || area === "LANG") return "path";
  return "workspace";
}

export function isHubArea(area: LifeArea | string | null | undefined): boolean {
  return area === "PHD" || area === "LANG";
}

export function projectPickerLabel(
  project: { id: string; name: string; area?: LifeArea | string | null },
  language: "FA" | "EN" = "FA",
): string {
  if (isAreaBucketId(project.id)) {
    const trimmed = project.name?.trim();
    if (trimmed) return trimmed;
    const area = (project.area ?? "LIFE") as LifeArea;
    const meta = AREA_META[area];
    return language === "EN" ? meta.nameEn : meta.nameFa;
  }
  return project.name;
}

/** Prisma `where` fragment: projects visible for a list scope (membership applied by caller). */
export function projectWhereForScope(
  scope: ProjectListScope,
): Record<string, unknown> {
  if (scope === "all") return {};

  if (scope === "research") {
    return { area: "PHD" };
  }

  if (scope === "language") {
    return { area: "LANG" };
  }

  const legacy = allLegacyBucketIds();

  if (scope === "workspace") {
    return {
      area: { in: WORKSPACE_AREAS },
      AND: [
        { id: { notIn: legacy } },
        { NOT: { id: { startsWith: "area-work-" } } },
        { NOT: { id: { startsWith: "area-life-" } } },
        { NOT: { id: { startsWith: "area-phd-" } } },
        { NOT: { id: { startsWith: "area-lang-" } } },
      ],
    };
  }

  if (scope === "life") {
    return {
      OR: [
        { id: { in: legacy } },
        { id: { startsWith: "area-" } },
        { area: { in: WORKSPACE_AREAS } },
      ],
    };
  }

  if (scope === "assignable") {
    return {};
  }

  return {};
}

export function taskWhereExcludeHub(): Record<string, unknown> {
  return {
    NOT: {
      OR: [
        { area: { in: HUB_AREAS } },
        { project: { area: { in: HUB_AREAS } } },
      ],
    },
  };
}

export function isLifeAreaValue(value: string | null | undefined): value is LifeArea {
  return !!value && (LIFE_AREAS as string[]).includes(value);
}

/** Turn `?area=` and `?project=` into a real area plus a named path. Area buckets are not paths. */
export function scopeFromFilters(
  areaParam: string,
  projectParam: string,
  projects: { id: string; area?: string | null }[] = [],
): { area: LifeArea | ""; projectId: string } {
  const ids = projectParam.split(",").map(id => id.trim()).filter(Boolean);
  const pathId = ids.find(id => !isAreaBucketId(id)) ?? "";
  const bucketId = ids.find(id => isAreaBucketId(id));
  let area: LifeArea | "" = isLifeAreaValue(areaParam) ? areaParam : "";
  if (!area && !pathId && bucketId) {
    area = lifeAreaFromBucketId(bucketId) ?? "";
  }
  if (pathId) {
    const path = projects.find(item => item.id === pathId);
    const pathArea = isLifeAreaValue(path?.area) ? path.area : "";
    if (area && pathArea && pathArea !== area) return { area, projectId: "" };
    if (!area && pathArea) area = pathArea;
  }
  return { area, projectId: pathId };
}

function bucketForArea(
  projects: { id: string; name: string; area?: LifeArea | string | null }[],
  area: LifeArea,
) {
  const matches = projects.filter(
    item =>
      isAreaBucketId(item.id) &&
      (lifeAreaFromBucketId(item.id) === area || item.area === area),
  );
  return matches.find(item => !allLegacyBucketIds().includes(item.id)) ?? matches[0];
}

export function areaOptionLabel(
  projects: { id: string; name: string; area?: LifeArea | string | null }[],
  area: LifeArea,
  language: "FA" | "EN",
): string {
  const bucket = bucketForArea(projects, area);
  if (bucket) return projectPickerLabel(bucket, language);
  const meta = AREA_META[area];
  return language === "EN" ? meta.nameEn : meta.nameFa;
}

export function areaFilterOptions(
  projects: { id: string; name: string; area?: LifeArea | string | null }[],
  language: "FA" | "EN",
  allLabel: string,
): { value: string; label: string }[] {
  return [
    { value: "", label: allLabel },
    ...LIFE_AREAS.map(area => ({
      value: area,
      label: areaOptionLabel(projects, area, language),
    })),
  ];
}

export function pathFilterOptions(
  projects: { id: string; name: string; area?: LifeArea | string | null }[],
  language: "FA" | "EN",
  area: LifeArea | "",
): { value: string; label: string }[] {
  const paths = projects.filter(item => !isAreaBucketId(item.id));
  const visible = area ? paths.filter(item => item.area === area) : paths;
  return [...visible]
    .sort((a, b) => {
      const areaOrder =
        LIFE_AREAS.indexOf(isLifeAreaValue(a.area) ? a.area : "LIFE") -
        LIFE_AREAS.indexOf(isLifeAreaValue(b.area) ? b.area : "LIFE");
      if (!area && areaOrder !== 0) return areaOrder;
      return a.name.localeCompare(b.name, language === "EN" ? "en" : "fa");
    })
    .map(item => ({
      value: item.id,
      label:
        area || !isLifeAreaValue(item.area)
          ? item.name
          : `${areaOptionLabel(projects, item.area, language)} · ${item.name}`,
    }));
}

export function withCurrentProjectOption(
  options: { value: string; label: string }[],
  current?: { id: string; name: string } | null,
): { value: string; label: string }[] {
  if (!current?.id) return options;
  if (options.some(o => o.value === current.id)) return options;
  return [...options, { value: current.id, label: current.name }];
}
