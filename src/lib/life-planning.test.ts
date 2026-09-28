import { describe, expect, it } from "vitest";
import {
  addDays,
  endOfWeek,
  planningStatusFromDue,
  resolveBoardPlanningStatus,
  startOfWeek,
} from "./life";

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
