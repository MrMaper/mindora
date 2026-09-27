import { describe, expect, it } from "vitest";
import { isTodayFocusCandidate, normalizeFocusSlots } from "./focus-slots";

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

describe("normalizeFocusSlots", () => {
  it("keeps an empty hole between filled slots", () => {
    expect(normalizeFocusSlots(["", "task-b", ""])).toEqual([null, "task-b", null]);
  });
});
