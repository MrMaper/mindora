/**
 * Hub (Research / Language) predicates and Prisma fragments.
 *
 * P1: static, backed by the enum — behavior identical to the pre-seam code.
 * P6 turns these into per-member lookups (`MemberContext.hubAreas`) and
 * respects module flags; call sites should already pass through here.
 */
import type { LifeArea } from "@/types/db";
import {
  HUB_AREAS,
  LANGUAGE_AREA,
  RESEARCH_AREA,
  coerceLifeArea,
} from "./legacy";

type AreaLike = LifeArea | string | null | undefined;

export function isResearchArea(area: AreaLike): boolean {
  return area === RESEARCH_AREA;
}

export function isLanguageArea(area: AreaLike): boolean {
  return area === LANGUAGE_AREA;
}

export function isHubArea(area: AreaLike): boolean {
  return isResearchArea(area) || isLanguageArea(area);
}

export type TaskAreaShape = {
  area?: AreaLike;
  project?: { area?: AreaLike } | null;
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

/** Hub task = pipeline task owned by Research/Language (hidden from Today etc.). */
export function isHubTask(task: TaskAreaShape): boolean {
  return isHubArea(task.area) || isHubArea(task.project?.area);
}

export function isResearchTask(task: TaskAreaShape): boolean {
  return isResearchArea(task.area) || isResearchArea(task.project?.area);
}

export function isLanguageTask(task: TaskAreaShape): boolean {
  return isLanguageArea(task.area) || isLanguageArea(task.project?.area);
}

/** Prisma `task` where: exclude hub tasks (Today / life surfaces). */
export function hubTaskExclusion(): Record<string, unknown> {
  return {
    NOT: {
      OR: [
        { area: { in: HUB_AREAS } },
        { project: { area: { in: HUB_AREAS } } },
      ],
    },
  };
}

/** Prisma `task` where: task belongs to `area` directly or through its project. */
export function taskInAreaWhere(area: LifeArea) {
  return { OR: [{ area }, { project: { area } }] };
}

export function researchTaskWhere() {
  return taskInAreaWhere(RESEARCH_AREA);
}

export function languageTaskWhere() {
  return taskInAreaWhere(LANGUAGE_AREA);
}

/** Prisma `project` where for a single area. */
export function projectAreaWhere(area: LifeArea) {
  return { area };
}

/** Alias matching docs/AREAS.md §13 naming. */
export const areaWhere = taskInAreaWhere;

