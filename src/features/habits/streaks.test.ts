import { describe, expect, it } from "vitest";
import { computeHabitStreaks } from "./streaks";

describe("computeHabitStreaks", () => {
  it("clears streak and best when all logs are removed", () => {
    expect(computeHabitStreaks([], "2026-09-29")).toEqual({
      streak: 0,
      bestStreak: 0,
      lastDoneDate: null,
    });
  });

  it("undoing the only today check-in resets best to 0", () => {
    // After toggle on: logs = [today]. After toggle off: logs = [].
    expect(computeHabitStreaks(["2026-09-29"], "2026-09-29")).toEqual({
      streak: 1,
      bestStreak: 1,
      lastDoneDate: "2026-09-29",
    });
    expect(computeHabitStreaks([], "2026-09-29").bestStreak).toBe(0);
  });

  it("keeps historical best after undoing today", () => {
    const withoutToday = ["2026-09-20", "2026-09-21", "2026-09-22"];
    const stats = computeHabitStreaks(withoutToday, "2026-09-29");
    expect(stats.bestStreak).toBe(3);
    expect(stats.streak).toBe(0); // gap from last done
    expect(stats.lastDoneDate).toBe("2026-09-22");
  });

  it("counts active daily streak ending today", () => {
    const stats = computeHabitStreaks(
      ["2026-09-27", "2026-09-28", "2026-09-29"],
      "2026-09-29",
    );
    expect(stats.streak).toBe(3);
    expect(stats.bestStreak).toBe(3);
  });
});
