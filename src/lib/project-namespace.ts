import type { LifeArea } from "@/types/db";
import { AREA_META, AREA_PROJECT_IDS } from "@/lib/life";

/** How a Project row is used in the product. */
export type ProjectKind = "bucket" | "path" | "workspace";

/**
 * Which projects a surface may list / assign.
 *
 * - workspace: named WORK/LIFE projects only → `/projects` admin list
 * - life: 4 area buckets + named WORK/LIFE → calendar / general board pickers
 * - research: area-phd + PHD paths → research hub
 * - language: area-lang + LANG paths → language hub
 * - assignable: life + research paths + language paths → `/tasks` create/edit
 * - all: no filter
 */
export type ProjectListScope =
  | "workspace"
  | "life"
  | "research"
  | "language"
  | "assignable"
  | "all";

export const HUB_AREAS: LifeArea[] = ["PHD", "LANG"];
export const WORKSPACE_AREAS: LifeArea[] = ["WORK", "LIFE"];

const BUCKET_IDS = new Set<string>(Object.values(AREA_PROJECT_IDS));

export function isAreaBucketId(id: string | null | undefined): boolean {
  return !!id && BUCKET_IDS.has(id);
}

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

/**
 * Display label for pickers.
 * Area buckets use the stored `project.name` (editable on /projects);
 * falls back to AREA_META only when name is missing/blank.
 */
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

/** Prisma `where` fragment: projects visible for a list scope. */
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

  if (scope === "workspace") {
    return {
      area: { in: WORKSPACE_AREAS },
      id: { notIn: [...BUCKET_IDS] },
    };
  }

  if (scope === "life") {
    return {
      OR: [
        { id: { in: [...BUCKET_IDS] } },
        { area: { in: WORKSPACE_AREAS }, id: { notIn: [...BUCKET_IDS] } },
      ],
    };
  }

  // assignable: everything the user can put a task on
  if (scope === "assignable") {
    return {};
  }

  return {};
}

/**
 * Tasks that belong on general board / calendar / dashboard
 * (hide research + language hub work — those live in their hubs).
 */
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

/** Ensure the task's current project stays selectable when editing. */
export function withCurrentProjectOption(
  options: { value: string; label: string }[],
  current?: { id: string; name: string } | null,
): { value: string; label: string }[] {
  if (!current?.id) return options;
  if (options.some(o => o.value === current.id)) return options;
  return [...options, { value: current.id, label: current.name }];
}
