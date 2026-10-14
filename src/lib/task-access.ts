import { hubTaskExclusion, type MemberContext } from "@/lib/areas";

/**
 * Personal ownership for Life OS reads/writes.
 * Prefer composing with `AND` so a nested `OR` (e.g. due-date) never overwrites this.
 */
export function personalTaskOwnership(userId: string) {
  return {
    OR: [
      { assignedToId: userId },
      { createdById: userId, assignedToId: null },
    ],
  };
}

/**
 * Ownership + hide active hub tasks from Today / life surfaces.
 * Pass `ctx` (P6) so exclusion respects hubFor + module flags; without it,
 * falls back to the static PHD/LANG fragment.
 */
export function personalLifeTaskWhere(
  userId: string,
  ctx?: Pick<MemberContext, "flags" | "hubAreas">,
) {
  const exclusion = hubTaskExclusion(ctx);
  const parts: Record<string, unknown>[] = [personalTaskOwnership(userId)];
  if (Object.keys(exclusion).length > 0) parts.push(exclusion);
  return { AND: parts };
}

/** Whether a member may read/mutate this task row (admins always may). */
export function canAccessPersonalTask(
  userId: string,
  role: string | undefined,
  task: {
    assignedToId?: string | null;
    createdById?: string | null;
    assignedTo?: { id: string } | null;
    createdBy?: { id: string } | null;
  },
): boolean {
  if (role === "ADMIN") return true;
  const assignee = task.assignedToId ?? task.assignedTo?.id ?? null;
  const creator = task.createdById ?? task.createdBy?.id ?? null;
  if (assignee === userId) return true;
  if (creator === userId && assignee == null) return true;
  return false;
}
