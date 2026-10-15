import { describe, expect, it } from "vitest";
import { placeTourCard } from "./place-card";

describe("placeTourCard", () => {
  it("keeps the card inside the viewport when the hole is wide", () => {
    const hole = { top: 40, left: 80, width: 900, height: 220 };
    const pos = placeTourCard(hole, 360, 200, 1200, 800, true);
    expect(pos.top).toBeGreaterThanOrEqual(12);
    expect(pos.top + 200).toBeLessThanOrEqual(800 - 12);
    expect(pos.left).toBeGreaterThanOrEqual(12);
    expect(pos.left + 360).toBeLessThanOrEqual(1200 - 12);
  });

  it("does not push the card below the viewport", () => {
    const hole = { top: 500, left: 100, width: 400, height: 220 };
    const pos = placeTourCard(hole, 360, 220, 1000, 700, false);
    expect(pos.top + 220).toBeLessThanOrEqual(700 - 12);
  });

  it("centers when there is no hole", () => {
    const pos = placeTourCard(null, 360, 200, 1000, 800, false);
    expect(pos.top).toBeCloseTo((800 - 200) / 2, 0);
    expect(pos.left).toBeCloseTo((1000 - 360) / 2, 0);
  });
});
