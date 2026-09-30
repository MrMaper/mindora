import { describe, expect, it } from "vitest";
import { parseCapture } from "./parse";

const now = new Date(2026, 8, 27, 15, 0, 0);

describe("parseCapture", () => {
  it("reads a task with tomorrow, a clock time, and research", () => {
    const parsed = parseCapture("فردا ساعت ۱۰ مقاله STT را بررسی کنم", now);
    expect(parsed.kind).toBe("task");
    expect(parsed.dateKey).toBe("2026-09-28");
    expect(parsed.time).toBe("10:00");
    expect(parsed.area).toBe("PHD");
    expect(parsed.title).toBe("مقاله STT را بررسی کنم");
  });

  it("turns an idea prefix into a note and keeps the wording", () => {
    const parsed = parseCapture("ایده: بررسی robustness مدل‌های فارسی", now);
    expect(parsed.kind).toBe("note");
    expect(parsed.title).toBe("بررسی robustness مدل‌های فارسی");
    expect(parsed.dateKey).toBeNull();
    expect(parsed.area).toBe("LIFE");
  });

  it("reads slash commands", () => {
    expect(parseCapture("/habit آب بنوش", now)).toMatchObject({
      kind: "habit",
      title: "آب بنوش",
      recurrence: "DAILY",
    });
    expect(parseCapture("/research فردا فصل ۳", now)).toMatchObject({
      kind: "task",
      command: "research",
      area: "PHD",
      dateKey: "2026-09-28",
      title: "فصل ۳",
    });
    expect(parseCapture("/note hello", now)).toMatchObject({
      kind: "note",
      title: "hello",
    });
  });

  it("maps a weekday and weekly recurrence", () => {
    const parsed = parseCapture("هر هفته شنبه خرید", now);
    expect(parsed.dateKey).toBe("2026-10-03");
    expect(parsed.recurrence).toBe("WEEKLY");
    expect(parsed.title).toBe("خرید");
  });

  it("keeps the same weekday when that day is today", () => {
    const saturday = new Date(2026, 9, 3, 9, 0, 0);
    expect(parseCapture("شنبه خرید", saturday).dateKey).toBe("2026-10-03");
  });

  it("reads night hours, word hours, and English clock phrases", () => {
    expect(parseCapture("ساعت ۱۰ شب ورزش", now)).toMatchObject({
      time: "22:00",
      title: "ورزش",
    });
    expect(parseCapture("ساعت ده و نیم جلسه", now)).toMatchObject({
      time: "10:30",
      title: "جلسه",
    });
    expect(parseCapture("tomorrow at 10 review the paper", now)).toMatchObject({
      kind: "task",
      dateKey: "2026-09-28",
      time: "10:00",
      area: "PHD",
      title: "review the paper",
    });
  });

  it("reads relative days, next week, tonight, and a time of day", () => {
    expect(parseCapture("دو روز دیگه گزارش", now)).toMatchObject({
      dateKey: "2026-09-29",
      title: "گزارش",
    });
    expect(parseCapture("هفته بعد خرید", now)).toMatchObject({
      dateKey: "2026-10-04",
      title: "خرید",
    });
    expect(parseCapture("امشب ورزش", now)).toMatchObject({
      dateKey: "2026-09-27",
      time: "21:00",
      title: "ورزش",
    });
    expect(parseCapture("فردا صبح جلسه", now)).toMatchObject({
      dateKey: "2026-09-28",
      time: "09:00",
      title: "جلسه",
    });
    expect(parseCapture("تا جمعه گزارش", now)).toMatchObject({
      dateKey: "2026-10-02",
      title: "گزارش",
    });
  });

  it("does not treat the word کار as the work area", () => {
    expect(parseCapture("فردا این کار را تمام کنم", now)).toMatchObject({
      area: "LIFE",
      dateKey: "2026-09-28",
      title: "این کار را تمام کنم",
    });
    expect(parseCapture("فردا شغل جدید", now).area).toBe("WORK");
  });

  it("leaves an empty title when the sentence is only a day", () => {
    expect(parseCapture("فردا", now).title).toBe("");
    expect(parseCapture("پس‌فردا گزارش", now)).toMatchObject({
      dateKey: "2026-09-29",
      title: "گزارش",
    });
  });

  it("keeps ظهر as a timed noon meeting (not date-only)", () => {
    expect(parseCapture("فردا ظهر جلسه", now)).toMatchObject({
      dateKey: "2026-09-28",
      time: "12:00",
      durationMinutes: 60,
      title: "جلسه",
    });
  });
});
