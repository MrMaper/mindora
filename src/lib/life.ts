import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";
import { formatNumber } from "@/lib/utils";

export {
  AREA_PROJECT_IDS,
  LEGACY_AREA_PROJECT_IDS,
  personalAreaProjectId,
  areaProjectIdsForUser,
  isAreaBucketId,
  isUserAreaBucket,
  areaBucketIdsToExclude,
  lifeAreaFromBucketId,
} from "@/lib/area-projects";

export const LIFE_AREAS: LifeArea[] = ["PHD", "WORK", "LIFE", "LANG"];

export function coerceLifeArea(area: string | null | undefined): LifeArea {
  if (area === "PHD" || area === "WORK" || area === "LANG" || area === "LIFE") {
    return area;
  }
  return "LIFE";
}

export const AREA_META: Record<
  LifeArea,
  { nameFa: string; nameEn: string; descriptionFa: string; descriptionEn: string }
> = {
  PHD: {
    nameFa: "دکتری",
    nameEn: "PhD",
    descriptionFa: "تحصیل، پژوهش و نوشتن",
    descriptionEn: "Study, research and writing",
  },
  WORK: {
    nameFa: "کار",
    nameEn: "Work",
    descriptionFa: "شغل و کارهای حرفه‌ای",
    descriptionEn: "Job and professional projects",
  },
  LIFE: {
    nameFa: "زندگی",
    nameEn: "Life",
    descriptionFa: "خانه، سلامت و امور شخصی",
    descriptionEn: "Home, health and personal matters",
  },
  LANG: {
    nameFa: "زبان",
    nameEn: "Language",
    descriptionFa: "مهارت‌ها، واژگان و آمادگی آزمون",
    descriptionEn: "Skills, vocab and exam prep",
  },
};

const PERSIAN_WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * FA-first calendar zone for Today / focus picks.
 * UTC hosts must not treat "today" as the UTC day — Iran can already be the next morning.
 */
export const LIFE_APP_TIMEZONE = "Asia/Tehran";
/** `Date#getTimezoneOffset()` for Asia/Tehran (no DST). */
export const LIFE_APP_TZ_OFFSET_MINUTES = -210;

export function zonedDateKey(
  date: Date = new Date(),
  timeZone: string = LIFE_APP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Absolute instant of 00:00:00.000 in Asia/Tehran on that calendar day. */
export function startOfZonedDay(date: Date = new Date()): Date {
  return dueFromWallClock(
    zonedDateKey(date),
    0,
    0,
    LIFE_APP_TZ_OFFSET_MINUTES,
  );
}

/** Absolute instant of 23:59:59.999 in Asia/Tehran on that calendar day. */
export function endOfZonedDay(date: Date = new Date()): Date {
  return new Date(startOfZonedDay(date).getTime() + 86_400_000 - 1);
}

/** Saturday-start week in Asia/Tehran (absolute bounds). */
export function startOfZonedWeek(date: Date = new Date()): Date {
  const start = startOfZonedDay(date);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: LIFE_APP_TIMEZONE,
    weekday: "short",
  }).format(date);
  const day =
    { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekday] ?? 0;
  const diff = (day + 1) % 7;
  return new Date(start.getTime() - diff * 86_400_000);
}

export function endOfZonedWeek(date: Date = new Date()): Date {
  return new Date(startOfZonedWeek(date).getTime() + 7 * 86_400_000 - 1);
}

export function zonedWeekCells(date: Date = new Date()): Date[] {
  const start = startOfZonedWeek(date);
  return Array.from(
    { length: 7 },
    (_, i) => new Date(start.getTime() + i * 86_400_000),
  );
}

/** Saturday-start week, matching a typical Iranian week. */
export function startOfWeek(date = new Date()): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day + 1) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function endOfWeek(date = new Date()): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}

/**
 * Inbox (BACKLOG) vs This Week (TODO) from due date.
 * No due / due after this week → Inbox. Due this week or overdue → This Week.
 */
export function planningStatusFromDue(
  due: Date | null | undefined,
  now = new Date(),
): "BACKLOG" | "TODO" {
  if (!due) return "BACKLOG";
  if (due.getTime() > endOfWeek(now).getTime()) return "BACKLOG";
  return "TODO";
}

/** Keep IN_PROGRESS+ untouched; only derive the Inbox ↔ This Week pair. */
export function resolveBoardPlanningStatus<S extends string>(
  requested: S,
  due: Date | null | undefined,
  now = new Date(),
): S | "BACKLOG" | "TODO" {
  if (requested !== "BACKLOG" && requested !== "TODO") return requested;
  return planningStatusFromDue(due, now);
}

/**
 * Personal Life OS planning status:
 * - waiting follow-ups stay BACKLOG (unless Done / In Progress)
 * - PhD / Language hub stages are never remapped by due date
 * - WORK/LIFE use Inbox ↔ This Week from due
 */
export function resolvePersonalTaskPlanningStatus<S extends string>(
  requested: S,
  due: Date | null | undefined,
  opts?: {
    area?: string | null;
    waitingOn?: boolean;
    now?: Date;
  },
): S | "BACKLOG" | "TODO" {
  if (
    opts?.waitingOn &&
    requested !== "DONE" &&
    requested !== "IN_PROGRESS"
  ) {
    return "BACKLOG";
  }
  if (opts?.area === "PHD" || opts?.area === "LANG") {
    return requested;
  }
  return resolveBoardPlanningStatus(requested, due, opts?.now);
}

/**
 * Wall-clock "now" for the caller's timezone on a UTC host.
 * `timezoneOffsetMinutes` is `Date#getTimezoneOffset()` (Iran → -210).
 */
export function clientLocalNow(timezoneOffsetMinutes?: number | null): Date {
  if (
    typeof timezoneOffsetMinutes !== "number" ||
    !Number.isFinite(timezoneOffsetMinutes)
  ) {
    return new Date();
  }
  return new Date(Date.now() - timezoneOffsetMinutes * 60_000);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function nextRecurrenceDate(
  from: Date | null,
  recurrence: RecurrenceInterval,
): Date | null {
  if (recurrence === "NONE") return null;
  const base = from ? new Date(from) : new Date();
  if (recurrence === "DAILY") return addDays(base, 1);
  if (recurrence === "WEEKLY") return addDays(base, 7);
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function formatJalaliDate(date: Date, language: "FA" | "EN" = "FA"): string {
  if (language === "EN") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  const { jy, jm, jd } = toJalaali(date);
  const weekday = PERSIAN_WEEKDAYS[date.getDay()];
  return `${weekday} ${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

function clockDigits(date: Date, language: "FA" | "EN"): string {
  return formatNumber(
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    language,
  );
}

/** Clock label when a due date has a real time. Noon is the date-only default. */
export function formatClock(
  date: Date,
  language: "FA" | "EN" = "FA",
  durationMinutes?: number | null,
): string | null {
  if (!hasDueTime(date, durationMinutes)) return null;
  const start = new Date(date);
  const startLabel = clockDigits(start, language);
  if (durationMinutes != null && durationMinutes > 0) {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return `${startLabel}–${clockDigits(end, language)}`;
  }
  return startLabel;
}

function isUtcNoon(value: Date): boolean {
  return (
    value.getUTCHours() === 12 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

function isLocalNoon(value: Date): boolean {
  return (
    value.getHours() === 12 &&
    value.getMinutes() === 0 &&
    value.getSeconds() === 0 &&
    value.getMilliseconds() === 0
  );
}

/** FA date-only rows written with `dueFromWallClock(..., 12, 0, -210)` → 08:30 UTC. */
function isTehranNoon(value: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LIFE_APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const hour = parts.find(part => part.type === "hour")?.value;
  const minute = parts.find(part => part.type === "minute")?.value;
  const second = parts.find(part => part.type === "second")?.value;
  return hour === "12" && minute === "00" && second === "00";
}

/** Noon means “day only” unless a duration marks a real noon meeting. */
export function hasDueTime(
  date: Date,
  durationMinutes?: number | null,
): boolean {
  if (durationMinutes != null && durationMinutes > 0) return true;
  const value = new Date(date);
  if (isLocalNoon(value)) return false;
  // Legacy date-only rows written as noon UTC on a UTC host (afternoon in +3:30).
  if (isUtcNoon(value)) return false;
  // Iran date-only on a UTC host (local noon Asia/Tehran via dueFromWallClock).
  if (isTehranNoon(value)) return false;
  return true;
}

/**
 * Calendar day key for a due, matching date-only / legacy UTC-noon semantics.
 * Timed dues use the local calendar day of the instant.
 */
export function toDueDateKey(
  date: Date,
  durationMinutes?: number | null,
): string {
  const value = new Date(date);
  if (durationMinutes != null && durationMinutes > 0) {
    return toDateKey(value);
  }
  if (isLocalNoon(value)) return toDateKey(value);
  if (isTehranNoon(value)) return zonedDateKey(value);
  if (isUtcNoon(value)) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, "0"),
      String(value.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }
  return toDateKey(value);
}

/** Local start of the due’s calendar day (date-only / legacy UTC noon aware). */
export function dueCalendarDayStart(
  date: Date,
  durationMinutes?: number | null,
): Date {
  return startOfDay(parseLocalDate(toDueDateKey(date, durationMinutes)));
}

/** Force the date-only sentinel (local noon). */
export function withDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Build an absolute instant from a calendar day + wall clock in the caller's TZ.
 * `timezoneOffsetMinutes` is `Date#getTimezoneOffset()` (Iran UTC+3:30 → -210).
 * Use this on the server so UTC hosts don't turn "noon / date-only" into afternoon.
 */
export function dueFromWallClock(
  dateKey: string,
  hours: number,
  minutes: number,
  timezoneOffsetMinutes: number,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return withDateOnly(new Date());
  }
  const [y, m, d] = dateKey.split("-").map(Number);
  const h = Math.min(23, Math.max(0, Math.round(hours)));
  const min = Math.min(59, Math.max(0, Math.round(minutes)));
  return new Date(
    Date.UTC(y!, m! - 1, d!, h, min, 0, 0) + timezoneOffsetMinutes * 60_000,
  );
}

/**
 * Move a due to another calendar day.
 * Keeps the clock when the task already had one; otherwise stays noon.
 */
export function moveDueToDay(
  existing: Date | null | undefined,
  dayKey: string,
  durationMinutes?: number | null,
): Date {
  const next = parseLocalDate(dayKey);
  if (existing && hasDueTime(existing, durationMinutes)) {
    next.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
  }
  return next;
}

/** Set a due to a calendar day at an explicit local clock (24h). */
export function setDueDateTime(
  dayKey: string,
  hours: number,
  minutes = 0,
): Date {
  const next = parseLocalDate(dayKey);
  next.setHours(
    Math.min(23, Math.max(0, Math.round(hours))),
    Math.min(59, Math.max(0, Math.round(minutes))),
    0,
    0,
  );
  return next;
}

/** Drop target id for a week-grid hour cell: `YYYY-MM-DDTHH`. */
export function weekHourDropId(dayKey: string, hour: number): string {
  return `${dayKey}T${String(hour).padStart(2, "0")}`;
}

export function parseWeekHourDropId(
  id: string,
): { dateKey: string; hour: number } | null {
  const match = id.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[2]);
  if (hour < 0 || hour > 23) return null;
  return { dateKey: match[1]!, hour };
}

/** Full ISO for form fields so the clock survives edit. */
export function dueDateToFormValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString();
}

export function formatJalaliShort(date: Date, language: "FA" | "EN" = "FA"): string {
  if (language === "EN") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const { jm, jd } = toJalaali(date);
  return `${jd} ${PERSIAN_MONTHS[jm - 1]}`;
}

const PERSIAN_WEEKDAYS_SAT = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

export { PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SAT };

export function jalaliOf(date: Date) {
  return toJalaali(date);
}

export function toGregorianDate(jy: number, jm: number, jd: number): Date {
  const max = jalaaliMonthLength(jy, jm);
  const safeDay = Math.min(Math.max(jd, 1), max);
  const { gy, gm, gd } = toGregorian(jy, jm, safeDay);
  return startOfDay(new Date(gy, gm - 1, gd));
}

export function addJalaliMonth(jy: number, jm: number, delta: number) {
  const index = jy * 12 + (jm - 1) + delta;
  const y = Math.floor(index / 12);
  const m = ((index % 12) + 12) % 12;
  return { jy: y, jm: m + 1 };
}

export function jalaliMonthCells(jy: number, jm: number): Date[] {
  const first = toGregorianDate(jy, jm, 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function formatJalaliMonthYear(
  jy: number,
  jm: number,
  language: "FA" | "EN" = "FA",
): string {
  if (language === "EN") {
    const date = toGregorianDate(jy, jm, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return `${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

export function jalaliMonthBounds(jy: number, jm: number) {
  const from = startOfWeek(toGregorianDate(jy, jm, 1));
  const lastDay = jalaaliMonthLength(jy, jm);
  const to = endOfWeek(toGregorianDate(jy, jm, lastDay));
  return { from, to };
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(value);
}

export function weekCells(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatJalaliWeekRange(
  weekStart: Date,
  language: "FA" | "EN" = "FA",
): string {
  const start = startOfWeek(weekStart);
  const end = addDays(start, 6);
  if (language === "EN") {
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }
  const a = toJalaali(start);
  const b = toJalaali(end);
  if (a.jm === b.jm && a.jy === b.jy) {
    return `${a.jd}–${b.jd} ${PERSIAN_MONTHS[a.jm - 1]} ${a.jy}`;
  }
  if (a.jy === b.jy) {
    return `${a.jd} ${PERSIAN_MONTHS[a.jm - 1]} – ${b.jd} ${PERSIAN_MONTHS[b.jm - 1]} ${a.jy}`;
  }
  return `${a.jd} ${PERSIAN_MONTHS[a.jm - 1]} ${a.jy} – ${b.jd} ${PERSIAN_MONTHS[b.jm - 1]} ${b.jy}`;
}

/**
 * Overdue rules:
 * - Timed due (real clock or duration): past the due instant → overdue.
 * - Date-only (local noon or legacy UTC noon, no duration): overdue only after that calendar day ends.
 */
export function isOverdueTask(
  task: {
    dueDate: Date | null;
    status: string;
    durationMinutes?: number | null;
  },
  now = new Date(),
): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  const due = new Date(task.dueDate);
  if (hasDueTime(due, task.durationMinutes)) {
    return due.getTime() < now.getTime();
  }
  // Date-only: compare Asia/Tehran calendar keys so UTC hosts don't lag Iran.
  return toDueDateKey(due, task.durationMinutes) < zonedDateKey(now);
}
