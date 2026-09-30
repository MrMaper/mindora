import { describe, expect, it } from "vitest";
import {
  endOfZonedDay,
  hasDueTime,
  startOfZonedDay,
  toDueDateKey,
  zonedDateKey,
} from "@/lib/life";

describe("Asia/Tehran day bounds", () => {
  it("uses Tehran Y-M-D when UTC is still the previous evening", () => {
    // 2026-09-30 20:57 UTC → 2026-10-01 00:27 in Tehran
    const utcEvening = new Date("2026-09-30T20:57:00.000Z");
    expect(zonedDateKey(utcEvening)).toBe("2026-10-01");
  });

  it("starts the Tehran day at 20:30 UTC the previous calendar day", () => {
    const duringOct1Tehran = new Date("2026-09-30T21:00:00.000Z");
    const start = startOfZonedDay(duringOct1Tehran);
    expect(start.toISOString()).toBe("2026-09-30T20:30:00.000Z");
    const end = endOfZonedDay(duringOct1Tehran);
    expect(end.toISOString()).toBe("2026-10-01T20:29:59.999Z");
  });

  it("keeps a Tehran-local noon due inside that day's absolute window", () => {
    // Oct 1 12:00 Tehran = Oct 1 08:30 UTC
    const due = new Date("2026-10-01T08:30:00.000Z");
    const start = startOfZonedDay(due);
    const end = endOfZonedDay(due);
    expect(due.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(due.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("treats Tehran noon as date-only on a UTC host", () => {
    const due = new Date("2026-10-01T08:30:00.000Z");
    expect(hasDueTime(due, null)).toBe(false);
    expect(toDueDateKey(due, null)).toBe("2026-10-01");
  });
});
