import type { NavKey } from "@/lib/ui-profile";
import type { TourDef, TourId, TourStepDef } from "./types";
import { overviewTour } from "./tours/overview";
import { PAGE_TOURS } from "./tours/pages";

export const ALL_TOURS: TourDef[] = [overviewTour, ...PAGE_TOURS];

export function getTour(id: TourId): TourDef | undefined {
  return ALL_TOURS.find(t => t.id === id);
}

export function tourForPath(pathname: string): TourDef | undefined {
  const path = pathname.split("?")[0] || pathname;
  return PAGE_TOURS.find(t =>
    (t.paths ?? []).some(
      p => path === p || path.startsWith(p + "/"),
    ),
  );
}

export function isTourCompleted(
  id: TourId,
  completedIds: readonly string[],
  overviewAt: Date | string | null | undefined,
): boolean {
  if (completedIds.includes(id)) return true;
  // Legacy: overview only stored the timestamp before completedTourIds existed.
  if (id === "overview" && overviewAt) return true;
  return false;
}

export function filterTourSteps(
  steps: TourStepDef[],
  input: {
    show: Record<NavKey, boolean>;
    captureEnabled: boolean;
    showGuide: boolean;
  },
): TourStepDef[] {
  return steps.filter(step => {
    const { gate } = step;
    if (gate.kind === "always") return true;
    if (gate.kind === "capture") return input.captureEnabled;
    if (gate.kind === "settings") return true;
    if (gate.kind === "guide") return input.showGuide;
    if (gate.kind === "nav") return input.show[gate.key];
    return false;
  });
}
