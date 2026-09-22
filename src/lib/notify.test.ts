import { describe, expect, it } from "vitest";
import { nextRecurrenceDate, addDays } from "@/lib/life";
import { shouldDeliverNotification } from "@/lib/notify-prefs";

describe("nextRecurrenceDate", () => {
  it("returns null for NONE", () => {
    expect(nextRecurrenceDate(new Date("2026-01-01"), "NONE")).toBeNull();
  });

  it("adds one day for DAILY", () => {
    const from = new Date(2026, 0, 1);
    const next = nextRecurrenceDate(from, "DAILY");
    expect(next?.getDate()).toBe(2);
  });

  it("adds seven days for WEEKLY", () => {
    const from = new Date(2026, 0, 1);
    const next = nextRecurrenceDate(from, "WEEKLY");
    expect(next?.getTime()).toBe(addDays(from, 7).getTime());
  });
});

describe("shouldDeliverNotification", () => {
  const allOn = {
    notifications: true,
    notifyTaskAssigned: true,
    notifyTaskUpdated: true,
    notifyTaskCommented: true,
    notifyMention: true,
    notifySprintStarted: true,
    notifySprintEnded: true,
    notifyDeadlineApproaching: true,
    notifyStatusChanged: true,
  };

  it("allows when prefs are null", () => {
    expect(shouldDeliverNotification("MENTION", null)).toBe(true);
  });

  it("blocks when master notifications off", () => {
    expect(
      shouldDeliverNotification("TASK_ASSIGNED", {
        ...allOn,
        notifications: false,
      }),
    ).toBe(false);
  });

  it("respects mention preference", () => {
    expect(
      shouldDeliverNotification("MENTION", {
        ...allOn,
        notifyMention: false,
      }),
    ).toBe(false);
    expect(shouldDeliverNotification("MENTION", allOn)).toBe(true);
  });

  it("allows VOCAB_REVIEW_DUE when master on", () => {
    expect(shouldDeliverNotification("VOCAB_REVIEW_DUE", allOn)).toBe(true);
  });
});
