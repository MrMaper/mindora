import type { TourTargetId } from "./types";

export function tourAttr(id: TourTargetId): { "data-tour": string } {
  return { "data-tour": id };
}

export function tourSelector(id: TourTargetId): string {
  return `[data-tour="${CSS.escape(id)}"]`;
}

/** Prefer the visible desktop target; fall back to any match (e.g. mobile sheet). */
export function findTourTarget(id: TourTargetId): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(tourSelector(id)),
  );
  if (nodes.length === 0) return null;
  const visible = nodes.find(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none"
    );
  });
  return visible ?? nodes[0] ?? null;
}
