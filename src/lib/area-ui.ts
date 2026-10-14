import type { AreaRef } from "@/lib/areas";
import { DEFAULT_AREA } from "@/lib/areas";
import {
  resolveAreaVisualFromRef,
  type AreaVisual,
} from "@/lib/area-visual";
import type { TaskRow } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";

/** Resolve the member AreaRef for a task (areaId first, then legacy enum). */
export function areaRefForTask(
  task: Pick<TaskRow, "area" | "areaId">,
  areas: AreaRef[],
): AreaRef | null {
  if (task.areaId) {
    const byId = areas.find(a => a.id === task.areaId);
    if (byId) return byId;
  }
  if (task.area) {
    const byLegacy = areas.find(a => a.legacyEnum === task.area);
    if (byLegacy) return byLegacy;
  }
  return areas.find(a => a.isDefault) ?? areas[0] ?? null;
}

export function taskAreaKey(
  task: Pick<TaskRow, "area" | "areaId">,
  areas: AreaRef[],
): string {
  const ref = areaRefForTask(task, areas);
  if (ref) return ref.id;
  return task.areaId ?? task.area ?? "";
}

export function visualForTask(
  task: Pick<TaskRow, "area" | "areaId">,
  areas: AreaRef[],
): AreaVisual {
  const ref = areaRefForTask(task, areas);
  if (ref) return resolveAreaVisualFromRef(ref);
  return resolveAreaVisualFromRef({
    legacyEnum: (task.area as LifeArea) ?? DEFAULT_AREA,
    color: null,
    icon: null,
    hubFor: null,
  });
}
