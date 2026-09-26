import type { LifeArea } from "@/types/db";
import { AREA_META } from "@/lib/life";
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

export function withCurrentProjectOption(
  options: { value: string; label: string }[],
  current?: { id: string; name: string } | null,
): { value: string; label: string }[] {
  if (!current?.id) return options;
  if (options.some(o => o.value === current.id)) return options;
  return [...options, { value: current.id, label: current.name }];
}
