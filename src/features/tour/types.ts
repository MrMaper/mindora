import type { NavKey } from "@/lib/ui-profile";

/** Stable ids persisted in UserPreferences.completedTourIds */
export type TourId =
  | "overview"
  | "today"
  | "board"
  | "tasks"
  | "calendar"
  | "projects"
  | "docs"
  | "research"
  | "language"
  | "review"
  | "settings";

export type TourTargetId = string;

export type TourGate =
  | { kind: "always" }
  | { kind: "nav"; key: NavKey }
  | { kind: "capture" }
  | { kind: "guide" }
  | { kind: "settings" };

export type TourStepDef = {
  id: string;
  target: TourTargetId | null;
  href?: string;
  /** Default false — stay on the page; only overview Today/Capture navigate. */
  navigate?: boolean;
  gate: TourGate;
  title: { FA: string; EN: string };
  body: { FA: string; EN: string };
};

export type TourDef = {
  id: TourId;
  /** Path prefixes that activate this page tour (overview is global). */
  paths?: string[];
  /** Soft invite when landing on a matching path (page tours only). */
  inviteTitle: { FA: string; EN: string };
  inviteBody: { FA: string; EN: string };
  steps: TourStepDef[];
};

export type TourUiCopy = {
  progress: { FA: string; EN: string };
  next: { FA: string; EN: string };
  back: { FA: string; EN: string };
  skip: { FA: string; EN: string };
  done: { FA: string; EN: string };
  inviteStart: { FA: string; EN: string };
  inviteLater: { FA: string; EN: string };
  inviteNever: { FA: string; EN: string };
  pageRestart: { FA: string; EN: string };
};
