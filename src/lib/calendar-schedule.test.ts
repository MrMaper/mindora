import { describe, expect, it } from "vitest";
import {
  DAY_MINUTES,
  HOUR_HEIGHT_PX,
  SNAP_MINUTES,
  applyMinutesToDay,
  clampBlockHeight,
  durationToHeight,
  findConflicts,
  formatMinutesClock,
  minutesFromMidnight,
  parseClockTime,
  rangesOverlap,
  snapMinutes,
  startMinutesFromPointer,
  taskSpan,
  yToMinutes,
} from "./calendar-schedule";

describe("parseClockTime", () => {
  it("parses valid HH:mm", () => {
    expect(parseClockTime("09:30")).toEqual({ hours: 9, minutes: 30 });
    expect(parseClockTime("00:00")).toEqual({ hours: 0, minutes: 0 });
    expect(parseClockTime("23:45")).toEqual({ hours: 23, minutes: 45 });
  });

  it("rejects invalid values", () => {
    expect(parseClockTime("24:00")).toBeNull();
    expect(parseClockTime("9:30")).toBeNull();
    expect(parseClockTime("12:60")).toBeNull();
    expect(parseClockTime("")).toBeNull();
    expect(parseClockTime("noon")).toBeNull();
  });
});

describe("snapMinutes", () => {
  it("snaps to 15-minute steps and stays in day", () => {
    expect(snapMinutes(7)).toBe(0);
    expect(snapMinutes(8)).toBe(15);
    expect(snapMinutes(22)).toBe(15);
    expect(snapMinutes(23)).toBe(30);
    expect(snapMinutes(DAY_MINUTES)).toBe(DAY_MINUTES - SNAP_MINUTES);
    expect(snapMinutes(-10)).toBe(0);
  });
});

describe("yToMinutes / applyMinutesToDay", () => {
  it("maps column Y to snapped minutes", () => {
    const col = HOUR_HEIGHT_PX * 24;
    expect(yToMinutes(0, col)).toBe(0);
    expect(yToMinutes(HOUR_HEIGHT_PX, col)).toBe(60);
    expect(yToMinutes(HOUR_HEIGHT_PX * 10.5, col)).toBe(630);
  });

  it("builds a local Date from day key + minutes", () => {
    const d = applyMinutesToDay("2026-09-28", 150);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(28);
    expect(d.getHours()).toBe(2);
    expect(d.getMinutes()).toBe(30);
  });
});

describe("startMinutesFromPointer", () => {
  it("preserves grab offset and snaps to 15 minutes", () => {
    const col = HOUR_HEIGHT_PX * 24;
    // Pointer at 10:00, grabbed 30 minutes (half hour) into the block → start 9:30
    const pointerAt10 = HOUR_HEIGHT_PX * 10;
    const grabHalfHour = HOUR_HEIGHT_PX / 2;
    expect(
      startMinutesFromPointer(pointerAt10, 0, col, grabHalfHour, 60),
    ).toBe(9 * 60 + 30);
  });

  it("clamps so the block stays inside the day", () => {
    const col = HOUR_HEIGHT_PX * 24;
    expect(
      startMinutesFromPointer(col, 0, col, 0, 60),
    ).toBe(DAY_MINUTES - 60);
  });

  it("uses the provided column height for mapping", () => {
    const logical = HOUR_HEIGHT_PX * 24;
    const pointerY = HOUR_HEIGHT_PX * 14;
    expect(startMinutesFromPointer(pointerY, 0, logical, 0, 60)).toBe(14 * 60);
    // Half-height column maps the same pixel twice as far into the day
    expect(startMinutesFromPointer(pointerY, 0, logical / 2, 0, 60)).toBe(
      Math.min(DAY_MINUTES - 60, 14 * 60 * 2),
    );
  });
});

describe("formatMinutesClock", () => {
  it("formats snapped HH:mm", () => {
    expect(formatMinutesClock(0)).toBe("00:00");
    expect(formatMinutesClock(90)).toBe("01:30");
    expect(formatMinutesClock(7)).toBe("00:00");
  });
});

describe("clampBlockHeight", () => {
  it("keeps blocks inside the column", () => {
    const col = HOUR_HEIGHT_PX * 24;
    expect(clampBlockHeight(0, 100, col)).toBe(100);
    expect(clampBlockHeight(col - 20, 100, col)).toBe(20);
    expect(clampBlockHeight(col, 50, col)).toBe(0);
    expect(clampBlockHeight(-10, 40, col)).toBe(40);
  });
});

describe("durationToHeight", () => {
  it("never goes below one snap slot", () => {
    const minH = (SNAP_MINUTES / 60) * HOUR_HEIGHT_PX;
    expect(durationToHeight(0)).toBe(minH);
    expect(durationToHeight(60)).toBe(HOUR_HEIGHT_PX);
    expect(durationToHeight(150)).toBe(HOUR_HEIGHT_PX * 2.5);
  });
});

describe("rangesOverlap / findConflicts", () => {
  it("detects half-open overlaps", () => {
    expect(rangesOverlap(0, 60, 60, 120)).toBe(false);
    expect(rangesOverlap(0, 61, 60, 120)).toBe(true);
  });

  it("maps conflicting timed spans both ways", () => {
    const map = findConflicts([
      { id: "a", startMin: 60, endMin: 120 },
      { id: "b", startMin: 90, endMin: 150 },
      { id: "c", startMin: 200, endMin: 260 },
    ]);
    expect(map.get("a")).toEqual(["b"]);
    expect(map.get("b")).toEqual(["a"]);
    expect(map.has("c")).toBe(false);
  });
});

describe("taskSpan", () => {
  it("defaults duration to 60 and clamps end to day", () => {
    const due = new Date(2026, 8, 28, 23, 0, 0, 0);
    const span = taskSpan("t1", due, null);
    expect(span.startMin).toBe(minutesFromMidnight(due));
    expect(span.endMin).toBe(DAY_MINUTES);

    const mid = taskSpan("t2", new Date(2026, 8, 28, 10, 0), 45);
    expect(mid.endMin - mid.startMin).toBe(45);
  });
});
