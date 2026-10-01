import { describe, expect, it } from "vitest";
import { startOfAppDay, startOfAppDayInstant } from "./day";

describe("language app day", () => {
  it("day key is UTC midnight of Tehran Y-M-D", () => {
    // 2026-09-30 21:00 UTC → 2026-10-01 00:30 Tehran
    const duringOct1Tehran = new Date("2026-09-30T21:00:00.000Z");
    expect(startOfAppDay(duringOct1Tehran).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });

  it("instant window starts at real Tehran midnight", () => {
    const duringOct1Tehran = new Date("2026-09-30T21:00:00.000Z");
    expect(startOfAppDayInstant(duringOct1Tehran).toISOString()).toBe(
      "2026-09-30T20:30:00.000Z",
    );
    expect(duringOct1Tehran.getTime()).toBeGreaterThanOrEqual(
      startOfAppDayInstant(duringOct1Tehran).getTime(),
    );
  });
});
