import { isOverdueTask, toDueDateKey } from "@/lib/life";

export const FOCUS_SLOT_COUNT = 3;

export type FocusPickGroup = "overdue" | "today" | "undated";

function dueKey(
  dueDate: Date | string | null,
  durationMinutes?: number | null,
): string | null {
  if (dueDate == null || dueDate === "") return null;
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return null;
  return toDueDateKey(date, durationMinutes);
}

/** A priority can be overdue, due today, or an open task with no due date. */
export function isTodayFocusCandidate(
  task: {
    status: string;
    dueDate: Date | string | null;
    durationMinutes?: number | null;
  },
  todayKey: string,
): boolean {
  if (task.status === "DONE") return false;
  const key = dueKey(task.dueDate, task.durationMinutes);
  if (!key) return true;
  return key <= todayKey;
}

export function focusPickGroup(
  task: {
    dueDate: Date | string | null;
    durationMinutes?: number | null;
    status?: string;
  },
  todayKey: string,
  now = new Date(),
): FocusPickGroup {
  const key = dueKey(task.dueDate, task.durationMinutes);
  if (!key) return "undated";
  if (key < todayKey) return "overdue";
  if (
    key === todayKey &&
    task.dueDate != null &&
    isOverdueTask(
      {
        dueDate:
          task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
        status: task.status ?? "TODO",
        durationMinutes: task.durationMinutes,
      },
      now,
    )
  ) {
    return "overdue";
  }
  return "today";
}

/** Preserve holes (`""`) so a task can sit in slot 2 while slot 1 is empty. Older rows are packed from the left. */
export function normalizeFocusSlots(ids: string[]): (string | null)[] {
  const slots: (string | null)[] = [null, null, null];
  if (ids.some(id => id === "")) {
    for (let i = 0; i < FOCUS_SLOT_COUNT; i++) slots[i] = ids[i] || null;
    return slots;
  }
  ids.filter(Boolean).slice(0, FOCUS_SLOT_COUNT).forEach((id, index) => {
    slots[index] = id;
  });
  return slots;
}

export function serializeFocusSlots(slots: (string | null)[]): string[] {
  if (slots.every(id => !id)) return [];
  return slots.map(id => id ?? "");
}

/** A task already sitting in a priority slot is not offered in the other pickers. */
export function omitPinnedFocusTasks<T extends { id: string }>(
  tasks: T[],
  pinned: readonly ({ id: string } | null | undefined)[],
): T[] {
  const taken = new Set(pinned.flatMap(task => (task?.id ? [task.id] : [])));
  if (taken.size === 0) return tasks;
  return tasks.filter(task => !taken.has(task.id));
}
