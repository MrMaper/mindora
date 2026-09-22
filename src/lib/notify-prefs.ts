import type { NotificationType } from "@/types/db";

const TYPE_PREF: Partial<
  Record<
    NotificationType,
    | "notifyTaskAssigned"
    | "notifyTaskUpdated"
    | "notifyTaskCommented"
    | "notifyMention"
    | "notifySprintStarted"
    | "notifySprintEnded"
    | "notifyDeadlineApproaching"
    | "notifyStatusChanged"
  >
> = {
  TASK_ASSIGNED: "notifyTaskAssigned",
  TASK_UPDATED: "notifyTaskUpdated",
  TASK_COMMENTED: "notifyTaskCommented",
  MENTION: "notifyMention",
  SPRINT_STARTED: "notifySprintStarted",
  SPRINT_ENDED: "notifySprintEnded",
  DEADLINE_APPROACHING: "notifyDeadlineApproaching",
  STATUS_CHANGED: "notifyStatusChanged",
};

export type NotifyPrefFlags = {
  notifications: boolean;
  notifyTaskAssigned: boolean;
  notifyTaskUpdated: boolean;
  notifyTaskCommented: boolean;
  notifyMention: boolean;
  notifySprintStarted: boolean;
  notifySprintEnded: boolean;
  notifyDeadlineApproaching: boolean;
  notifyStatusChanged: boolean;
};

/** Whether a notification type should be delivered given user prefs. */
export function shouldDeliverNotification(
  type: NotificationType,
  prefs: NotifyPrefFlags | null,
): boolean {
  if (!prefs) return true;
  if (!prefs.notifications) return false;
  const key = TYPE_PREF[type];
  if (!key) return true;
  return prefs[key] !== false;
}
