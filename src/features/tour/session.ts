import type { TourId } from "./types";

/** Survives soft remounts / HMR while a tour is mid-flight. */
const KEY = "mindora:tour-run";

export type TourSession = {
  tourId: TourId;
  index: number;
};

export function readTourSession(): TourSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TourSession;
    if (
      typeof parsed?.tourId !== "string" ||
      typeof parsed?.index !== "number" ||
      parsed.index < 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeTourSession(tourId: TourId, index: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ tourId, index }));
  } catch {
    /* ignore */
  }
}

export function clearTourSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function laterKey(tourId: TourId): string {
  return `mindora:tour-later:${tourId}`;
}

const ALL_TOUR_IDS: readonly TourId[] = [
  "overview",
  "today",
  "board",
  "tasks",
  "calendar",
  "projects",
  "docs",
  "research",
  "language",
  "review",
  "settings",
];

/** Drop “later this session” flags so invites can appear again after a full restart. */
export function clearAllTourLaterFlags(): void {
  if (typeof window === "undefined") return;
  try {
    for (const id of ALL_TOUR_IDS) {
      sessionStorage.removeItem(laterKey(id));
    }
  } catch {
    /* ignore */
  }
}
