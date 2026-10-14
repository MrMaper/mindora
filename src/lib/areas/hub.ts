/**
 * Hub (Research / Language) predicates and Prisma fragments.
 *
 * P6: prefer UserArea.hubFor / areaId; keep legacy enum fragments as
 * dual-read fallback until P7 drops the columns.
 */
import type { LifeArea } from "@/types/db";
import {
  HUB_AREAS,
  LANGUAGE_AREA,
  RESEARCH_AREA,
  coerceLifeArea,
} from "./legacy";
import type { HubKind, MemberContext } from "./member-context";

type AreaLike = LifeArea | string | null | undefined;

export function isResearchArea(area: AreaLike): boolean {
  return area === RESEARCH_AREA;
}

export function isLanguageArea(area: AreaLike): boolean {
  return area === LANGUAGE_AREA;
}

/** @deprecated Prefer hubFor / activeHubAreaIds — kept for dual-read. */
export function isHubArea(area: AreaLike): boolean {
  return isResearchArea(area) || isLanguageArea(area);
}

export type TaskAreaShape = {
  area?: AreaLike;
  areaId?: string | null;
  project?: { area?: AreaLike; areaId?: string | null } | null;
};

/** The area a task effectively belongs to: own area, else its project's, else null. */
export function taskAreaOrNull(task: TaskAreaShape): LifeArea | null {
  const raw = task.area ?? task.project?.area ?? null;
  return raw ? coerceLifeArea(raw) : null;
}

/** Like `taskAreaOrNull` but falls back to the default area. */
export function resolveTaskArea(task: TaskAreaShape): LifeArea {
  return coerceLifeArea(task.area ?? task.project?.area);
}

/** Active hub UserArea ids for a member (module must be effective). */
export function activeHubAreaIds(ctx: Pick<MemberContext, "flags" | "hubAreas">): string[] {
  const ids: string[] = [];
  if (ctx.flags.research && ctx.hubAreas.research) {
    ids.push(ctx.hubAreas.research.id);
  }
  if (ctx.flags.language && ctx.hubAreas.language) {
    ids.push(ctx.hubAreas.language.id);
  }
  return ids;
}

/** Legacy enum values for modules that are currently effective. */
export function activeHubLegacyEnums(
  ctx: Pick<MemberContext, "flags">,
): LifeArea[] {
  const out: LifeArea[] = [];
  if (ctx.flags.research) out.push(RESEARCH_AREA);
  if (ctx.flags.language) out.push(LANGUAGE_AREA);
  return out;
}

/**
 * Hub task for a viewer: resolved areaId is one of their active hub areas,
 * or (dual-read) legacy enum matches an effective hub module.
 * Default args preserve the P1 static PHD/LANG behaviour for tests.
 */
export function isHubTask(
  task: TaskAreaShape,
  hubIds: readonly string[] = [],
  legacyHubs: readonly LifeArea[] = HUB_AREAS,
): boolean {
  const areaId = task.areaId ?? task.project?.areaId ?? null;
  if (areaId && hubIds.length > 0 && hubIds.includes(areaId)) return true;
  if (legacyHubs.length === 0) return false;
  const a = task.area;
  const pa = task.project?.area;
  return (
    (typeof a === "string" && (legacyHubs as readonly string[]).includes(a)) ||
    (typeof pa === "string" && (legacyHubs as readonly string[]).includes(pa))
  );
}

export function isResearchTask(
  task: TaskAreaShape,
  researchHubId?: string | null,
): boolean {
  if (researchHubId) {
    const areaId = task.areaId ?? task.project?.areaId ?? null;
    if (areaId === researchHubId) return true;
  }
  return isResearchArea(task.area) || isResearchArea(task.project?.area);
}

export function isLanguageTask(
  task: TaskAreaShape,
  languageHubId?: string | null,
): boolean {
  if (languageHubId) {
    const areaId = task.areaId ?? task.project?.areaId ?? null;
    if (areaId === languageHubId) return true;
  }
  return isLanguageArea(task.area) || isLanguageArea(task.project?.area);
}

/**
 * Prisma `task` where: exclude active hub tasks (Today / life / digest).
 * When no modules are on, returns `{}` so dormant hub tasks reappear.
 */
export function hubTaskExclusion(
  ctx?: Pick<MemberContext, "flags" | "hubAreas">,
): Record<string, unknown> {
  if (!ctx) {
    // Legacy static (pre-context callers / tests).
    return {
      NOT: {
        OR: [
          { area: { in: [...HUB_AREAS] } },
          { project: { area: { in: [...HUB_AREAS] } } },
        ],
      },
    };
  }

  const ids = activeHubAreaIds(ctx);
  const legacy = activeHubLegacyEnums(ctx);
  if (ids.length === 0 && legacy.length === 0) {
    return {};
  }

  const or: Record<string, unknown>[] = [];
  if (ids.length > 0) {
    or.push({ areaId: { in: ids } });
    or.push({ project: { areaId: { in: ids } } });
  }
  if (legacy.length > 0) {
    or.push({ area: { in: legacy } });
    or.push({ project: { area: { in: legacy } } });
  }
  return { NOT: { OR: or } };
}

/** Prisma fragment: task/doc in a hub area by UserArea id (+ legacy dual-read). */
export function hubContentWhere(
  hubAreaId: string | null | undefined,
  legacyEnum?: LifeArea | null,
): Record<string, unknown> {
  const or: Record<string, unknown>[] = [];
  if (hubAreaId) {
    or.push({ areaId: hubAreaId });
    or.push({ project: { areaId: hubAreaId } });
  }
  if (legacyEnum) {
    or.push({ area: legacyEnum });
    or.push({ project: { area: legacyEnum } });
  }
  if (or.length === 0) {
    return { id: "__never__" };
  }
  return { OR: or };
}

/** Prisma `project` where for a hub area. */
export function hubProjectWhere(
  hubAreaId: string | null | undefined,
  legacyEnum?: LifeArea | null,
): Record<string, unknown> {
  const or: Record<string, unknown>[] = [];
  if (hubAreaId) or.push({ areaId: hubAreaId });
  if (legacyEnum) or.push({ area: legacyEnum });
  if (or.length === 0) return { id: "__never__" };
  return { OR: or };
}

/** Prisma `task` where: task belongs to `area` directly or through its project. */
export function taskInAreaWhere(area: LifeArea) {
  return { OR: [{ area }, { project: { area } }] };
}

export function researchTaskWhere(hubAreaId?: string | null) {
  return hubContentWhere(hubAreaId, RESEARCH_AREA);
}

export function languageTaskWhere(hubAreaId?: string | null) {
  return hubContentWhere(hubAreaId, LANGUAGE_AREA);
}

/** Prisma `project` where for a single legacy area. */
export function projectAreaWhere(area: LifeArea) {
  return { area };
}

/** Alias matching docs/AREAS.md §13 naming. */
export const areaWhere = taskInAreaWhere;

export function hubKindModule(kind: HubKind): "research" | "language" {
  return kind;
}
