import { addDays, startOfDay, toDateKey } from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";

export type CaptureKind = "task" | "note" | "habit";
export type CaptureCommand = "task" | "note" | "research" | "source" | "habit";

export interface ParsedCapture {
  kind: CaptureKind;
  command: CaptureCommand | null;
  title: string;
  area: LifeArea;
  /** Local calendar day, YYYY-MM-DD. Null when the sentence names no day. */
  dateKey: string | null;
  /** 24-hour HH:mm. Null when the sentence names no clock time. */
  time: string | null;
  /** Meeting length in minutes when the sentence names one. */
  durationMinutes: number | null;
  recurrence: RecurrenceInterval;
  /** DOI extracted when the sentence looks like a paper/source capture. */
  doi: string | null;
  /** URL extracted for source capture. */
  url: string | null;
}

const DIGIT_MAP: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const HOUR_WORDS: Record<string, number> = {
  یک: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5,
  شش: 6,
  هفت: 7,
  هشت: 8,
  نه: 9,
  ده: 10,
  یازده: 11,
  دوازده: 12,
};

const COMMANDS: Record<string, CaptureCommand> = {
  task: "task",
  note: "note",
  idea: "note",
  research: "research",
  source: "source",
  habit: "habit",
  یادداشت: "note",
  ایده: "note",
  پژوهش: "research",
  منبع: "source",
  عادت: "habit",
};

type Pair = { raw: string; scan: string };

function normalizeDigits(value: string): string {
  return [...value].map(ch => DIGIT_MAP[ch] ?? ch).join("");
}

function normalizePair(input: string): Pair {
  const raw = input.replace(/\s+/g, " ").trim();
  return { raw, scan: normalizeDigits(raw) };
}

function cut(pair: Pair, start: number, length: number): Pair {
  const raw = `${pair.raw.slice(0, start)} ${pair.raw.slice(start + length)}`
    .replace(/\s+/g, " ")
    .trim();
  return { raw, scan: normalizeDigits(raw) };
}

function fmt(hours: number, minutes: number): string | null {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function applyMarker(hours: number, minutes: number, marker?: string): string | null {
  const mark = marker?.toLowerCase();
  let h = hours;
  if (mark === "pm" && h < 12) h += 12;
  if (mark === "am" && h === 12) h = 0;
  if (mark === "صبح") {
    if (h === 12) h = 0;
    if (h > 12) return null;
  }
  if (mark === "شب") {
    if (h === 12) h = 0;
    else if (h < 12) h += 12;
  }
  if (mark === "عصر" && h < 12) h += 12;
  return fmt(h, minutes);
}

function takeTime(pair: Pair): { pair: Pair; time: string | null } {
  const word = pair.scan.match(
    /(?:^|\s)ساعت\s*(دوازده|یازده|ده|نه|هشت|هفت|شش|پنج|چهار|سه|دو|یک)(?:\s+و\s+(نیم|ربع))?(?=\s|$)/,
  );
  if (word?.index !== undefined && word[1]) {
    const minutes = word[2] === "نیم" ? 30 : word[2] === "ربع" ? 15 : 0;
    const time = fmt(HOUR_WORDS[word[1]] ?? -1, minutes);
    if (time) return { pair: cut(pair, word.index, word[0].length), time };
  }

  const clock = pair.scan.match(
    /(?:^|\s)ساعت\s*(\d{1,2})(?:\s*[:：]\s*(\d{2}))?(?:\s*(صبح|عصر|شب))?(?=\s|$)/,
  );
  if (clock?.index !== undefined) {
    const time = applyMarker(Number(clock[1]), clock[2] ? Number(clock[2]) : 0, clock[3]);
    if (time) return { pair: cut(pair, clock.index, clock[0].length), time };
  }

  const at = pair.scan.match(
    /(?:^|\s)at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?=\s|$)/i,
  );
  if (at?.index !== undefined) {
    const time = applyMarker(Number(at[1]), at[2] ? Number(at[2]) : 0, at[3]);
    if (time) return { pair: cut(pair, at.index, at[0].length), time };
  }

  const bare = pair.scan.match(/(?:^|\s)(\d{1,2}):(\d{2})(?=\s|$)/);
  if (bare?.index !== undefined) {
    const time = fmt(Number(bare[1]), Number(bare[2]));
    if (time) return { pair: cut(pair, bare.index, bare[0].length), time };
  }

  return { pair, time: null };
}

const DURATION_WORDS: Record<string, number> = {
  یک: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5,
};

function takeDuration(pair: Pair): { pair: Pair; durationMinutes: number | null } {
  // ۲٫۵ ساعت / 2.5 ساعت / 2 ساعت و نیم
  const decimal = pair.scan.match(
    /(?:^|\s)(?:به\s*مدت\s*|برای\s*|for\s+)?(\d+(?:[.,٫]\d+)?)\s*(?:ساعت|hours?|hrs?)(?:\s+و\s+نیم)?(?=\s|$)/i,
  );
  if (decimal?.index !== undefined) {
    let hours = Number(decimal[1]!.replace(/[٫,]/g, "."));
    if (/و\s*نیم/i.test(decimal[0]!)) hours += 0.5;
    if (hours > 0 && hours <= 12) {
      return {
        pair: cut(pair, decimal.index, decimal[0]!.length),
        durationMinutes: Math.round(hours * 60),
      };
    }
  }

  const word = pair.scan.match(
    /(?:^|\s)(?:به\s*مدت\s*|برای\s*)?(یک|دو|سه|چهار|پنج)\s+ساعت(?:\s+و\s+(نیم|ربع))?(?=\s|$)/,
  );
  if (word?.index !== undefined && word[1]) {
    let hours = DURATION_WORDS[word[1]] ?? 0;
    if (word[2] === "نیم") hours += 0.5;
    if (word[2] === "ربع") hours += 0.25;
    if (hours > 0) {
      return {
        pair: cut(pair, word.index, word[0]!.length),
        durationMinutes: Math.round(hours * 60),
      };
    }
  }

  const minutesOnly = pair.scan.match(
    /(?:^|\s)(?:به\s*مدت\s*|برای\s*)?(\d{1,3})\s*(?:دقیقه|minutes?|mins?)(?=\s|$)/i,
  );
  if (minutesOnly?.index !== undefined) {
    const mins = Number(minutesOnly[1]);
    if (mins > 0 && mins <= 720) {
      return {
        pair: cut(pair, minutesOnly.index, minutesOnly[0]!.length),
        durationMinutes: mins,
      };
    }
  }

  return { pair, durationMinutes: null };
}

function takeRecurrence(
  pair: Pair,
  monthly: boolean,
): { pair: Pair; recurrence: RecurrenceInterval } {
  const patterns: Array<{ re: RegExp; recurrence: RecurrenceInterval }> = [
    { re: /(?:^|\s)(?:هر\s*روز|روزانه|daily)(?=\s|$)/i, recurrence: "DAILY" },
    { re: /(?:^|\s)(?:هر\s*هفته|هفتگی|weekly)(?=\s|$)/i, recurrence: "WEEKLY" },
  ];
  if (monthly) {
    patterns.push({
      re: /(?:^|\s)(?:هر\s*ماه|ماهانه|monthly)(?=\s|$)/i,
      recurrence: "MONTHLY",
    });
  }
  for (const pattern of patterns) {
    const match = pair.scan.match(pattern.re);
    if (!match || match.index === undefined) continue;
    return {
      pair: cut(pair, match.index, match[0].length),
      recurrence: pattern.recurrence,
    };
  }
  return { pair, recurrence: "NONE" };
}

function relativeDays(fragment: string): number | null {
  if (/پس|day after/i.test(fragment)) return 2;
  if (/فردا|tomorrow/i.test(fragment)) return 1;
  if (/امروز|today/i.test(fragment)) return 0;
  return null;
}

function weekdayIndex(token: string): number | null {
  const compact = token
    .toLowerCase()
    .replace(/\u200c/g, "")
    .replace(/[\s-]+/g, "");
  if (compact === "یکشنبه" || compact === "sunday") return 0;
  if (compact === "دوشنبه" || compact === "monday") return 1;
  if (compact === "سهشنبه" || compact === "tuesday") return 2;
  if (compact === "چهارشنبه" || compact === "wednesday") return 3;
  if (compact === "پنجشنبه" || compact === "thursday") return 4;
  if (compact === "جمعه" || compact === "friday") return 5;
  if (compact === "شنبه" || compact === "saturday") return 6;
  return null;
}

const DAY_COUNT: Record<string, number> = { ...HOUR_WORDS, یه: 1 };

const DAY_PART_TIME: Record<string, string> = {
  صبح: "09:00",
  ظهر: "12:00",
  عصر: "17:00",
  شب: "21:00",
};

function takeDayPart(pair: Pair): { pair: Pair; time: string | null } {
  const match = pair.scan.match(/(?:^|\s)(صبح|ظهر|عصر|شب)(?=\s|$)/);
  if (!match || match.index === undefined || !match[1]) return { pair, time: null };
  const time = DAY_PART_TIME[match[1]] ?? null;
  if (!time) return { pair, time: null };
  return { pair: cut(pair, match.index, match[0].length), time };
}

function takeDate(pair: Pair, now: Date): { pair: Pair; dateKey: string | null; night: boolean } {
  const tonight = pair.scan.match(/(?:^|\s)امشب(?=\s|$)/);
  if (tonight?.index !== undefined) {
    return {
      pair: cut(pair, tonight.index, tonight[0].length),
      dateKey: toDateKey(startOfDay(now)),
      night: true,
    };
  }

  const relative = pair.scan.match(
    /(?:^|\s)(?:تا\s+)?(?:پس[\u200c\s-]*فردا|the day after tomorrow|فردا|tomorrow|امروز|today)(?=\s|$)/i,
  );
  if (relative?.index !== undefined) {
    const days = relativeDays(relative[0]);
    if (days !== null) {
      return {
        pair: cut(pair, relative.index, relative[0].length),
        dateKey: toDateKey(addDays(startOfDay(now), days)),
        night: false,
      };
    }
  }

  const inDays = pair.scan.match(
    /(?:^|\s)(دوازده|یازده|ده|نه|هشت|هفت|شش|پنج|چهار|سه|دو|یه|یک|\d{1,2})\s*روز\s*(?:دیگه|دیگر|بعد)(?=\s|$)/,
  );
  if (inDays?.index !== undefined && inDays[1]) {
    const count = DAY_COUNT[inDays[1]] ?? Number(inDays[1]);
    if (count >= 1 && count <= 60) {
      return {
        pair: cut(pair, inDays.index, inDays[0].length),
        dateKey: toDateKey(addDays(startOfDay(now), count)),
        night: false,
      };
    }
  }

  const nextWeek = pair.scan.match(
    /(?:^|\s)هفته[\u200c\s-]*(?:بعد|آینده|دیگر|دیگه)(?=\s|$)/,
  );
  if (nextWeek?.index !== undefined) {
    return {
      pair: cut(pair, nextWeek.index, nextWeek[0].length),
      dateKey: toDateKey(addDays(startOfDay(now), 7)),
      night: false,
    };
  }

  const weekday = pair.scan.match(
    /(?:^|\s)(?:تا\s+)?(?:next\s+)?(یکشنبه|دوشنبه|سه[\u200c\s-]*شنبه|چهارشنبه|پنجشنبه|جمعه|شنبه|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?=\s|$)/i,
  );
  if (weekday?.index !== undefined && weekday[1]) {
    const day = weekdayIndex(weekday[1]);
    if (day !== null) {
      const start = startOfDay(now);
      const delta = (day - start.getDay() + 7) % 7;
      return {
        pair: cut(pair, weekday.index, weekday[0].length),
        dateKey: toDateKey(addDays(start, delta)),
        night: false,
      };
    }
  }

  return { pair, dateKey: null, night: false };
}

function detectArea(scan: string): LifeArea {
  if (
    /پژوهش|تحقیق|مقاله|مقالات|دکتری|پایان[\u200c\s-]*نامه|\bphd\b|\bresearch\b|\bpaper\b|\bthesis\b|\bdissertation\b/i.test(
      scan,
    )
  ) {
    return "PHD";
  }
  if (/زبان|واژه|لغت|\blanguage\b|\bvocab(?:ulary)?\b/i.test(scan)) return "LANG";
  if (/(?:^|\s)(?:شغل|اداره|دفتر)(?=\s|$)|\bwork\b|\bjob\b/i.test(scan)) return "WORK";
  if (/زندگی|\blife\b/i.test(scan)) return "LIFE";
  return "LIFE";
}

function takeCommand(pair: Pair): { pair: Pair; command: CaptureCommand | null } {
  const match = pair.scan.match(
    /^\/(task|note|idea|research|source|habit|یادداشت|ایده|پژوهش|منبع|عادت)(?=\s|$)/i,
  );
  if (!match || match.index === undefined || !match[1]) return { pair, command: null };
  const command = COMMANDS[match[1].toLowerCase()] ?? null;
  if (!command) return { pair, command: null };
  return { pair: cut(pair, match.index, match[0].length), command };
}

function kindFromCommand(command: CaptureCommand | null): CaptureKind {
  if (command === "note") return "note";
  if (command === "habit") return "habit";
  return "task";
}

function applyPrefixes(
  pair: Pair,
  kind: CaptureKind,
  command: CaptureCommand | null,
): { pair: Pair; kind: CaptureKind } {
  const idea = pair.scan.match(/^(?:ایده|یادداشت|note|idea)\s*[:：\-]\s*/i);
  const habit = pair.scan.match(/^(?:عادت|habit)\s*[:：]\s*/i);
  if (command === "note" && idea?.index === 0) {
    return { pair: cut(pair, 0, idea[0].length), kind: "note" };
  }
  if (command === "habit" && habit?.index === 0) {
    return { pair: cut(pair, 0, habit[0].length), kind: "habit" };
  }
  if (command) return { pair, kind };
  if (idea?.index === 0) return { pair: cut(pair, 0, idea[0].length), kind: "note" };
  if (habit?.index === 0) return { pair: cut(pair, 0, habit[0].length), kind: "habit" };
  return { pair, kind };
}

export function parseCapture(input: string, now = new Date()): ParsedCapture {
  let pair = normalizePair(input);
  const commandResult = takeCommand(pair);
  pair = commandResult.pair;
  const command = commandResult.command;
  let kind = kindFromCommand(command);
  const prefixed = applyPrefixes(pair, kind, command);
  pair = prefixed.pair;
  kind = prefixed.kind;

  let dateKey: string | null = null;
  let time: string | null = null;
  let durationMinutes: number | null = null;
  let recurrence: RecurrenceInterval = "NONE";

  if (kind === "task") {
    const dated = takeDate(pair, now);
    pair = dated.pair;
    dateKey = dated.dateKey;
    const timed = takeTime(pair);
    pair = timed.pair;
    time = timed.time;
    if (!time && dated.night) time = "21:00";
    let dayPartNoon = false;
    if (!time) {
      const part = takeDayPart(pair);
      pair = part.pair;
      time = part.time;
      // ظهر → 12:00 would otherwise collapse to date-only via hasDueTime.
      dayPartNoon = part.time === "12:00";
    }
    const lasting = takeDuration(pair);
    pair = lasting.pair;
    durationMinutes = lasting.durationMinutes;
    if (dayPartNoon && (durationMinutes == null || durationMinutes <= 0)) {
      durationMinutes = 60;
    }
    const recurring = takeRecurrence(pair, true);
    pair = recurring.pair;
    recurrence = recurring.recurrence;
  } else if (kind === "habit") {
    const recurring = takeRecurrence(pair, false);
    pair = recurring.pair;
    recurrence = recurring.recurrence === "NONE" ? "DAILY" : recurring.recurrence;
  }

  const area =
    command === "research" || command === "source"
      ? "PHD"
      : detectArea(pair.scan);

  const doiMatch = pair.scan.match(
    /\b(?:doi:\s*)?(10\.\d{4,9}\/[^\s]+)/i,
  );
  const doi: string | null = doiMatch?.[1]
    ? doiMatch[1].replace(/[.,;:]+$/, "")
    : null;
  let url: string | null = null;
  const urlMatch = pair.raw.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    url = urlMatch[0].replace(/[.,;:)+]+$/, "");
  }

  return {
    kind,
    command,
    title: pair.raw,
    area,
    dateKey,
    time,
    durationMinutes,
    recurrence,
    doi,
    url,
  };
}

/** What Capture will actually create (preview + server must agree). */
export type CaptureProduct = "task" | "note" | "habit" | "source" | "research";

export function captureProduct(parsed: ParsedCapture): CaptureProduct {
  if (parsed.kind === "note") return "note";
  if (parsed.kind === "habit") return "habit";
  // Explicit source command, or research command with a DOI.
  // A bare PhD-area guess + DOI must NOT steal a dated task into a source.
  if (parsed.command === "source") return "source";
  if (parsed.command === "research" && parsed.doi) return "source";
  if (parsed.command === "research") return "research";
  return "task";
}
