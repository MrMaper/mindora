import { describe, expect, it } from "vitest";
import {
  focusPickGroup,
  isTodayFocusCandidate,
  normalizeFocusSlots,
} from "./focus-slots";

const todayKey = "2026-09-27";

describe("isTodayFocusCandidate", () => {
  it("accepts an open task due today", () => {
    expect(
      isTodayFocusCandidate(
        { status: "TODO", dueDate: new Date(2026, 8, 27, 10, 0) },
        todayKey,
      ),
    ).toBe(true);
  });

  it("accepts an open task with no due date", () => {
    expect(isTodayFocusCandidate({ status: "BACKLOG", dueDate: null }, todayKey)).toBe(true);
  });

  it("accepts an overdue task and rejects tomorrow and done tasks", () => {
    expect(
      isTodayFocusCandidate(
        { status: "TODO", dueDate: new Date(2026, 8, 26, 12, 0) },
        todayKey,
      ),
    ).toBe(true);
    expect(
      isTodayFocusCandidate(
        { status: "TODO", dueDate: new Date(2026, 8, 28, 12, 0) },
        todayKey,
      ),
    ).toBe(false);
    expect(
      isTodayFocusCandidate(
        { status: "DONE", dueDate: new Date(2026, 8, 27, 12, 0) },
        todayKey,
      ),
    ).toBe(false);
  });
});

describe("focusPickGroup", () => {
  const now = new Date(2026, 8, 27, 15, 0, 0);

  it("groups a past timed due today as overdue", () => {
    expect(
      focusPickGroup(
        {
          dueDate: new Date(2026, 8, 27, 10, 0, 0),
          durationMinutes: 30,
          status: "TODO",
        },
        todayKey,
        now,
      ),
    ).toBe("overdue");
  });

  it("keeps date-only today in today", () => {
    expect(
      focusPickGroup(
        {
          dueDate: new Date(2026, 8, 27, 12, 0, 0),
          durationMinutes: null,
          status: "TODO",
        },
        todayKey,
        now,
      ),
    ).toBe("today");
  });
});

describe("normalizeFocusSlots", () => {
  it("keeps an empty hole between filled slots", () => {
    expect(normalizeFocusSlots(["", "task-b", ""])).toEqual([null, "task-b", null]);
  });
});
