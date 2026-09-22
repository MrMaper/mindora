/**
 * Unified vocab SRS (Anki-like learning + fixed graduated intervals).
 *
 * Learning: learningStep 0 → 1 → graduate (box 1).
 * Graduated: box 1..4 → intervals 1 / 3 / 7 / 21 days.
 */

export type VocabRating = "again" | "hard" | "good" | "easy";

export type RequeueHint = "soon" | "later" | "end" | "none";

/** Graduated box → days until next review. Index 0 unused for graduated cards. */
export const SRS_INTERVALS = [0, 1, 3, 7, 21] as const;

/** Minutes until re-ask while still in learning (after a successful step). */
export const LEARNING_STEP_DELAYS_MIN = [3, 12] as const;

/** How many learning goods are needed before graduating. */
export const LEARNING_STEPS = LEARNING_STEP_DELAYS_MIN.length;

export const REVIEW_DAILY_CAP = 40;

export function intervalForBox(box: number): number {
  const clamped = Math.max(0, Math.min(box, SRS_INTERVALS.length - 1));
  return SRS_INTERVALS[clamped] ?? 21;
}

export function normalizeLearningStep(
  learningStep: number | null | undefined,
  box: number,
): number | null {
  // null = graduated
  if (learningStep === null) return null;
  if (learningStep === undefined) {
    // Legacy rows: box>0 already graduated; box 0 still learning.
    return box > 0 ? null : 0;
  }
  if (learningStep < 0) return null;
  return Math.min(learningStep, LEARNING_STEPS - 1);
}

function atLocalMorning(base: Date, daysAhead: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + daysAhead);
  next.setHours(8, 0, 0, 0);
  if (daysAhead === 0 && next.getTime() <= base.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function inMinutes(base: Date, minutes: number): Date {
  const next = new Date(base);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

export interface ScheduleInput {
  box: number;
  /** null = graduated; 0..LEARNING_STEPS-1 = learning. */
  learningStep: number | null | undefined;
  rating: VocabRating;
  now?: Date;
}

export interface ScheduleResult {
  box: number;
  learningStep: number | null;
  intervalDays: number;
  nextReviewAt: Date;
  lapsed: boolean;
  requeueInSession: RequeueHint;
  /** True when card left learning and entered graduated SRS. */
  graduated: boolean;
}

/**
 * Single source of truth: DB schedule + same-session requeue hint.
 */
export function scheduleAfterReview(input: ScheduleInput): ScheduleResult {
  const now = input.now ?? new Date();
  let box = Math.max(0, input.box);
  let step = normalizeLearningStep(input.learningStep, box);
  let lapsed = false;
  let graduated = false;
  let intervalDays = 0;
  let nextReviewAt = new Date(now);
  let requeueInSession: RequeueHint = "none";

  const inLearning = step !== null;

  switch (input.rating) {
    case "again": {
      // Reset to first learning step; ask again soon today.
      step = 0;
      box = 0;
      lapsed = true;
      intervalDays = 0;
      nextReviewAt = inMinutes(now, 3);
      requeueInSession = "soon";
      break;
    }

    case "hard": {
      if (inLearning) {
        // Stay on current step; re-ask later today; stay due soon for refill.
        intervalDays = 0;
        nextReviewAt = inMinutes(now, 10);
        requeueInSession = "later";
      } else {
        // Graduated but hard: pull back toward short intervals + re-ask today.
        box = Math.max(1, Math.min(box, 2));
        intervalDays = 1;
        nextReviewAt = atLocalMorning(now, 1);
        requeueInSession = "later";
      }
      break;
    }

    case "good": {
      if (inLearning) {
        const current = step ?? 0;
        if (current < LEARNING_STEPS - 1) {
          // Delay for this completed step, then advance.
          const delay =
            LEARNING_STEP_DELAYS_MIN[current] ??
            LEARNING_STEP_DELAYS_MIN[0]!;
          step = current + 1;
          box = 0;
          intervalDays = 0;
          nextReviewAt = inMinutes(now, delay);
          requeueInSession = "end";
        } else {
          // Graduate after final learning good.
          step = null;
          box = 1;
          graduated = true;
          intervalDays = intervalForBox(box);
          nextReviewAt = atLocalMorning(now, intervalDays);
          requeueInSession = "none";
        }
      } else {
        box = Math.min(box + 1, SRS_INTERVALS.length - 1);
        if (box < 1) box = 1;
        intervalDays = intervalForBox(box);
        nextReviewAt = atLocalMorning(now, Math.max(1, intervalDays));
        requeueInSession = "none";
      }
      break;
    }

    case "easy": {
      // Skip remaining learning; jump to a comfortable graduated box.
      step = null;
      graduated = inLearning || box < 2;
      box = Math.min(Math.max(box + 2, 2), SRS_INTERVALS.length - 1);
      intervalDays = intervalForBox(box);
      nextReviewAt = atLocalMorning(now, Math.max(1, intervalDays));
      requeueInSession = "none";
      break;
    }
  }

  return {
    box,
    learningStep: step,
    intervalDays:
      step === null && input.rating !== "again"
        ? Math.max(intervalDays, 1)
        : intervalDays,
    nextReviewAt,
    lapsed,
    requeueInSession,
    graduated,
  };
}

/** Insert a card back into the remaining review queue. */
export function reinsertInQueue<T extends { id: string }>(
  rest: T[],
  card: T,
  where: Exclude<RequeueHint, "none">,
): T[] {
  const without = rest.filter(c => c.id !== card.id);
  if (where === "end") return [...without, card];
  const offset = where === "soon" ? 2 : 5;
  const at = Math.min(offset, without.length);
  return [...without.slice(0, at), card, ...without.slice(at)];
}

export function applyRequeueHint<T extends { id: string }>(
  queue: T[],
  card: T,
  hint: RequeueHint,
): T[] {
  const rest = queue.slice(1);
  if (hint === "none") return rest.filter(c => c.id !== card.id);
  return reinsertInQueue(rest, card, hint);
}
