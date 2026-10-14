/**
 * Hub (Research / Language) predicates and Prisma fragments.
 *
 * A hub area is a `UserArea` with `hubFor` set (docs/AREAS.md §10). Since P7
 * everything keys on `areaId`; there is no enum fallback.
 */
import type { HubKind, MemberContext } from "./member-context";

export type TaskAreaShape = {
  areaId?: string | null;
  project?: { areaId?: string | null } | null;
};

/** The area id a task effectively belongs to: own area, else its project's, else null. */
export function taskAreaOrNull(task: TaskAreaShape): string | null {
  return task.areaId ?? task.project?.areaId ?? null;
}

/** Hub kind of an area id for this member (`hubFor`), regardless of module flags. */
export function hubKindForAreaId(
  areaId: string | null | undefined,
  ctx: Pick<MemberContext, "hubAreas">,
): HubKind | null {
  if (!areaId) return null;
  if (ctx.hubAreas.research?.id === areaId) return "research";
  if (ctx.hubAreas.language?.id === areaId) return "language";
  return null;
}

/** True when the area is one of the member's hub areas (bound, flags ignored). */
export function isHubAreaId(
  areaId: string | null | undefined,
  ctx: Pick<MemberContext, "hubAreas">,
): boolean {
  return hubKindForAreaId(areaId, ctx) !== null;
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

/**
 * Hub task for a viewer: resolved areaId is one of their active hub areas
 * (docs/AREAS.md §10.2).
 */
export function isHubTask(
  task: TaskAreaShape,
  hubIds: readonly string[] = [],
): boolean {
  const areaId = taskAreaOrNull(task);
  return !!areaId && hubIds.includes(areaId);
}

export function isResearchTask(
  task: TaskAreaShape,
  researchHubId?: string | null,
): boolean {
  return !!researchHubId && taskAreaOrNull(task) === researchHubId;
}

export function isLanguageTask(
  task: TaskAreaShape,
  languageHubId?: string | null,
): boolean {
  return !!languageHubId && taskAreaOrNull(task) === languageHubId;
}

/**
 * Prisma `task` where: exclude active hub tasks (Today / life / digest).
 * When no modules are on, returns `{}` so dormant hub tasks reappear.
 */
export function hubTaskExclusion(
  ctx: Pick<MemberContext, "flags" | "hubAreas">,
): Record<string, unknown> {
  const ids = activeHubAreaIds(ctx);
  if (ids.length === 0) return {};
  return {
    NOT: {
      OR: [{ areaId: { in: ids } }, { project: { areaId: { in: ids } } }],
    },
  };
}

/** Prisma fragment: task/doc in a hub area (own area or its project's). */
export function hubContentWhere(
  hubAreaId: string | null | undefined,
): Record<string, unknown> {
  if (!hubAreaId) return { id: "__never__" };
  return { OR: [{ areaId: hubAreaId }, { project: { areaId: hubAreaId } }] };
}

/** Prisma `project` where for a hub area. */
export function hubProjectWhere(
  hubAreaId: string | null | undefined,
): Record<string, unknown> {
  if (!hubAreaId) return { id: "__never__" };
  return { areaId: hubAreaId };
}

/** Prisma `task` where: task belongs to the area directly or through its project. */
export function taskInAreaWhere(areaId: string) {
  return { OR: [{ areaId }, { project: { areaId } }] };
}

/**
 * Prisma `task` where: the task sits in a Research hub area (own area or its
 * project's), for any member. Used by sync code that has no userId.
 */
export function researchHubTaskWhere() {
  const hub = { hubFor: "RESEARCH" as const };
  return { OR: [{ userArea: hub }, { project: { userArea: hub } }] };
}

/** Prisma `doc` where: the doc is filed under a Research hub area. */
export function researchHubDocWhere() {
  return { userArea: { hubFor: "RESEARCH" as const } };
}

export function researchTaskWhere(hubAreaId?: string | null) {
  return hubContentWhere(hubAreaId);
}

export function languageTaskWhere(hubAreaId?: string | null) {
  return hubContentWhere(hubAreaId);
}

/** Prisma `project` where for a single area. */
export function projectAreaWhere(areaId: string) {
  return { areaId };
}

/** Alias matching docs/AREAS.md §13 naming. */
export const areaWhere = taskInAreaWhere;

export function hubKindModule(kind: HubKind): "research" | "language" {
  return kind;
}
