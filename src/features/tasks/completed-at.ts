/** Stamp or clear completion when status crosses DONE. No-op otherwise. */
export function completedAtWrite(
  previousStatus: string,
  nextStatus: string,
): { completedAt: Date } | { completedAt: null } | undefined {
  if (previousStatus !== "DONE" && nextStatus === "DONE") {
    return { completedAt: new Date() };
  }
  if (previousStatus === "DONE" && nextStatus !== "DONE") {
    return { completedAt: null };
  }
  return undefined;
}
