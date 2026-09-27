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

/** Clock label when a due date has a real time. Noon is the dateless default. */
export function formatClock(date: Date, language: "FA" | "EN" = "FA"): string | null {
  const value = new Date(date);
  if (value.getHours() === 12 && value.getMinutes() === 0) return null;
  return formatNumber(
    `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`,
    language,
  );
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

export function isOverdueTask(
  task: { dueDate: Date | null; status: string },
  today = startOfDay(),
): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  return startOfDay(new Date(task.dueDate)).getTime() < today.getTime();
}
