import type { AreaRef } from "@/lib/areas";
import {
  resolveAreaVisualFromRef,
  type AreaVisual,
} from "@/lib/area-visual";
import type { TaskRow } from "@/features/tasks/types";

/** Resolve the member AreaRef for a task (areaId, else the member's default area). */
export function areaRefForTask(
  task: Pick<TaskRow, "areaId">,
  areas: AreaRef[],
): AreaRef | null {
  if (task.areaId) {
    const byId = areas.find(a => a.id === task.areaId);
    if (byId) return byId;
  }
  return areas.find(a => a.isDefault) ?? areas[0] ?? null;
}

export function taskAreaKey(
  task: Pick<TaskRow, "areaId">,
  areas: AreaRef[],
): string {
  const ref = areaRefForTask(task, areas);
  if (ref) return ref.id;
  return task.areaId ?? "";
}

export function visualForTask(
  task: Pick<TaskRow, "areaId">,
  areas: AreaRef[],
): AreaVisual {
  const ref = areaRefForTask(task, areas);
  return resolveAreaVisualFromRef(
    ref ?? { templateKey: "life", color: null, icon: null, hubFor: null },
  );
}
