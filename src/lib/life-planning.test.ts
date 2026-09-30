import { describe, expect, it } from "vitest";
import {
  addDays,
  dueFromWallClock,
  endOfWeek,
  hasDueTime,
  isOverdueTask,
  planningStatusFromDue,
  resolveBoardPlanningStatus,
  resolvePersonalTaskPlanningStatus,
  startOfWeek,
  withDateOnly,
} from "./life";

describe("dueFromWallClock", () => {
  // Iran UTC+3:30 → getTimezoneOffset() === -210
  const iranOffset = -210;

  it("keeps local noon for date-only on a UTC host", () => {
    const due = dueFromWallClock("2026-10-02", 12, 0, iranOffset);
    expect(due.toISOString()).toBe("2026-10-02T08:30:00.000Z");
  });

  it("keeps an explicit afternoon clock", () => {
    const due = dueFromWallClock("2026-10-02", 15, 30, iranOffset);
    expect(due.toISOString()).toBe("2026-10-02T12:00:00.000Z");
  });
});

describe("hasDueTime", () => {
  it("treats local noon without duration as date-only", () => {
    const noon = withDateOnly(new Date(2026, 9, 2));
    expect(hasDueTime(noon, null)).toBe(false);
    expect(hasDueTime(noon, 0)).toBe(false);
  });

  it("treats noon with duration as timed", () => {
    const noon = withDateOnly(new Date(2026, 9, 2));
    expect(hasDueTime(noon, 60)).toBe(true);
  });

  it("treats non-noon clocks as timed", () => {
    const afternoon = new Date(2026, 9, 2, 15, 30, 0, 0);
    expect(hasDueTime(afternoon, null)).toBe(true);
  });

  it("treats legacy UTC noon without duration as date-only", () => {
    const utcNoon = new Date(Date.UTC(2026, 8, 30, 12, 0, 0, 0));
    expect(hasDueTime(utcNoon, null)).toBe(false);
    expect(hasDueTime(utcNoon, 45)).toBe(true);
  });
});

describe("isOverdueTask", () => {
  // 2026-09-30 12:30 UTC = 16:00 Tehran — still Sept 30 in Asia/Tehran
  const now = new Date("2026-09-30T12:30:00.000Z");

  it("marks a timed due today overdue after its clock", () => {
    expect(
      isOverdueTask(
        {
          dueDate: new Date("2026-09-30T06:30:00.000Z"), // 10:00 Tehran
          status: "TODO",
          durationMinutes: 60,
        },
        now,
      ),
    ).toBe(true);
  });

  it("keeps a later timed due today in not-overdue", () => {
    expect(
      isOverdueTask(
        {
          dueDate: new Date("2026-09-30T14:30:00.000Z"), // 18:00 Tehran
          status: "TODO",
          durationMinutes: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("keeps date-only today not overdue until the day ends", () => {
    expect(
      isOverdueTask(
        {
          dueDate: dueFromWallClock("2026-09-30", 12, 0, -210),
          status: "TODO",
          durationMinutes: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("keeps legacy UTC-noon today not overdue until the day ends", () => {
    expect(
      isOverdueTask(
        {
          dueDate: new Date(Date.UTC(2026, 8, 30, 12, 0, 0, 0)),
          status: "TODO",
          durationMinutes: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("marks date-only yesterday overdue", () => {
    expect(
      isOverdueTask(
        {
          dueDate: dueFromWallClock("2026-09-29", 12, 0, -210),
          status: "TODO",
          durationMinutes: null,
        },
        now,
      ),
    ).toBe(true);
  });

  it("treats UTC evening as next Tehran morning for date-only overdue", () => {
    // 20:57 UTC Sept 30 → Oct 1 00:27 Tehran; Sept 30 date-only is overdue
    const iranNextMorning = new Date("2026-09-30T20:57:00.000Z");
    expect(
      isOverdueTask(
        {
          dueDate: dueFromWallClock("2026-09-30", 12, 0, -210),
          status: "TODO",
          durationMinutes: null,
        },
        iranNextMorning,
      ),
    ).toBe(true);
  });
});

describe("planningStatusFromDue", () => {
  const wednesday = new Date(2026, 8, 30, 12, 0, 0); // Wed 30 Sep 2026
  const weekStart = startOfWeek(wednesday);
  const weekEnd = endOfWeek(wednesday);

  it("puts undated work in Inbox", () => {
    expect(planningStatusFromDue(null, wednesday)).toBe("BACKLOG");
  });

  it("puts this-week due in This Week", () => {
    expect(planningStatusFromDue(weekStart, wednesday)).toBe("TODO");
    expect(planningStatusFromDue(weekEnd, wednesday)).toBe("TODO");
    expect(planningStatusFromDue(wednesday, wednesday)).toBe("TODO");
  });

  it("puts overdue work in This Week", () => {
    expect(planningStatusFromDue(addDays(weekStart, -2), wednesday)).toBe("TODO");
  });

  it("keeps later weeks in Inbox until that week arrives", () => {
    expect(planningStatusFromDue(addDays(weekEnd, 1), wednesday)).toBe("BACKLOG");
    expect(planningStatusFromDue(addDays(weekEnd, 21), wednesday)).toBe("BACKLOG");
  });
});

describe("resolveBoardPlanningStatus", () => {
  const now = new Date(2026, 8, 30, 12, 0, 0);

  it("does not touch in-progress and later columns", () => {
    expect(
      resolveBoardPlanningStatus("IN_PROGRESS", addDays(endOfWeek(now), 14), now),
    ).toBe("IN_PROGRESS");
    expect(resolveBoardPlanningStatus("DONE", null, now)).toBe("DONE");
  });

  it("derives Inbox / This Week from due", () => {
    expect(resolveBoardPlanningStatus("BACKLOG", now, now)).toBe("TODO");
    expect(
      resolveBoardPlanningStatus("TODO", addDays(endOfWeek(now), 14), now),
    ).toBe("BACKLOG");
  });
});

describe("resolvePersonalTaskPlanningStatus", () => {
  const now = new Date(2026, 8, 30, 12, 0, 0);

  it("never remaps PhD / Language by due", () => {
    expect(
      resolvePersonalTaskPlanningStatus("BACKLOG", now, {
        area: "PHD",
        now,
      }),
    ).toBe("BACKLOG");
    expect(
      resolvePersonalTaskPlanningStatus("IN_PROGRESS", null, {
        area: "LANG",
        now,
      }),
    ).toBe("IN_PROGRESS");
  });

  it("parks waiting tasks in Inbox", () => {
    expect(
      resolvePersonalTaskPlanningStatus("TODO", now, {
        area: "LIFE",
        waitingOn: true,
        now,
      }),
    ).toBe("BACKLOG");
  });

  it("still plans non-hub work from due", () => {
    expect(
      resolvePersonalTaskPlanningStatus("BACKLOG", now, {
        area: "WORK",
        now,
      }),
    ).toBe("TODO");
  });
});
