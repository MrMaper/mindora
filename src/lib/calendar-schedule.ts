/** Shared calendar schedule math (15-minute grid). */

export const SNAP_MINUTES = 15;
/** Pixels per hour — keep divisible by 4 so each 15‑minute slot is an even height. */
export const HOUR_HEIGHT_PX = 64;
export const DAY_MINUTES = 24 * 60;
export const SLOT_HEIGHT_PX = HOUR_HEIGHT_PX / (60 / SNAP_MINUTES);
export const CLOCK_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parse `HH:mm` into hours/minutes, or null if invalid. */
export function parseClockTime(
  time: string,
): { hours: number; minutes: number } | null {
  const match = CLOCK_TIME_RE.exec(time);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function snapMinutes(raw: number, step = SNAP_MINUTES): number {
  const clamped = Math.min(DAY_MINUTES - step, Math.max(0, raw));
  return Math.round(clamped / step) * step;
}

/** Clamp a timed block so it stays inside the day column. */
export function clampBlockHeight(
  topPx: number,
  heightPx: number,
  columnHeight = HOUR_HEIGHT_PX * 24,
): number {
  if (columnHeight <= 0) return 0;
  const maxH = Math.max(0, columnHeight - Math.max(0, topPx));
  return Math.min(Math.max(0, heightPx), maxH);
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function applyMinutesToDay(dayKey: string, minutes: number): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  const snapped = snapMinutes(minutes);
  const hours = Math.floor(snapped / 60);
  const mins = snapped % 60;
  return new Date(y!, m! - 1, d!, hours, mins, 0, 0);
}

/** Y offset inside a 24h column → minutes from midnight. */
export function yToMinutes(y: number, columnHeight: number): number {
  if (columnHeight <= 0) return 0;
  return snapMinutes((y / columnHeight) * DAY_MINUTES);
}

export function minutesToY(minutes: number, columnHeight = HOUR_HEIGHT_PX * 24): number {
  return (minutes / DAY_MINUTES) * columnHeight;
}

/**
 * Map pointer Y to a block start time, preserving where the user grabbed
 * the block (grabOffsetPx from the top of the event).
 *
 * `columnHeight` should be the **logical** grid height (COLUMN_HEIGHT / HOUR_HEIGHT_PX*24),
 * not a possibly-subpixel getBoundingClientRect().height — rendering uses the same constant.
 */
export function startMinutesFromPointer(
  clientY: number,
  columnTop: number,
  columnHeight: number,
  grabOffsetPx: number,
  durationMinutes: number,
): number {
  const duration = Math.max(SNAP_MINUTES, durationMinutes);
  const gridHeight = columnHeight > 0 ? columnHeight : HOUR_HEIGHT_PX * 24;
  const topY = clientY - Math.max(0, grabOffsetPx) - columnTop;
  const start = yToMinutes(topY, gridHeight);
  const maxStart = DAY_MINUTES - duration;
  return Math.min(Math.max(0, start), Math.max(0, maxStart));
}

/** Build HH:mm from snapped minutes since midnight. */
export function formatMinutesClock(startMin: number): string {
  const snapped = snapMinutes(startMin);
  const hh = String(Math.floor(snapped / 60)).padStart(2, "0");
  const mm = String(snapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function durationToHeight(durationMinutes: number): number {
  return Math.max(
    (SNAP_MINUTES / 60) * HOUR_HEIGHT_PX,
    (Math.max(SNAP_MINUTES, durationMinutes) / 60) * HOUR_HEIGHT_PX,
  );
}

export type TimedSpan = {
  id: string;
  startMin: number;
  endMin: number;
};

/** True when two half-open ranges [a0,a1) and [b0,b1) overlap. */
export function rangesOverlap(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
): boolean {
  return a0 < b1 && b0 < a1;
}

export function findConflicts(spans: TimedSpan[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      const a = spans[i]!;
      const b = spans[j]!;
      if (rangesOverlap(a.startMin, a.endMin, b.startMin, b.endMin)) {
        const ai = map.get(a.id) ?? [];
        const bi = map.get(b.id) ?? [];
        ai.push(b.id);
        bi.push(a.id);
        map.set(a.id, ai);
        map.set(b.id, bi);
      }
    }
  }
  return map;
}

export function taskSpan(
  id: string,
  due: Date,
  durationMinutes?: number | null,
): TimedSpan {
  const startMin = minutesFromMidnight(due);
  const dur = Math.max(SNAP_MINUTES, durationMinutes && durationMinutes > 0 ? durationMinutes : 60);
  return {
    id,
    startMin,
    endMin: Math.min(DAY_MINUTES, startMin + dur),
  };
}
