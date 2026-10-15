import { describe, expect, it } from "vitest";
import { filterTourSteps, tourForPath, isTourCompleted } from "./catalog";
import { TOUR_STEPS } from "./content";
import type { NavKey } from "@/lib/ui-profile";

function allNav(on: boolean): Record<NavKey, boolean> {
  return {
    dashboard: on,
    kanban: on,
    tasks: on,
    calendar: on,
    projects: on,
    docs: on,
    research: on,
    language: on,
    review: on,
    workLogs: on,
    reporting: on,
  };
}

describe("filterTourSteps (overview)", () => {
  it("keeps always + settings steps for an empty Starter shell", () => {
    const steps = filterTourSteps(TOUR_STEPS, {
      show: {
        ...allNav(false),
        dashboard: true,
        tasks: true,
      },
      captureEnabled: true,
      showGuide: false,
    });
    const ids = steps.map(s => s.id);
    expect(ids).toContain("welcome");
    expect(ids).toContain("today");
    expect(ids).toContain("capture");
    expect(ids).toContain("tasks");
    expect(ids).toContain("settings");
    expect(ids).toContain("finish");
    expect(ids).not.toContain("board");
    expect(ids).not.toContain("research");
    expect(ids).not.toContain("guide");
  });
});

describe("tourForPath", () => {
  it("maps routes to specialized tours", () => {
    expect(tourForPath("/calendar")?.id).toBe("calendar");
    expect(tourForPath("/kanban")?.id).toBe("board");
    expect(tourForPath("/projects/areas/x")?.id).toBe("projects");
    expect(tourForPath("/dashboard")?.id).toBe("today");
  });
});

describe("isTourCompleted", () => {
  it("treats legacy overview timestamp as done", () => {
    expect(isTourCompleted("overview", [], new Date())).toBe(true);
    expect(isTourCompleted("overview", ["overview"], null)).toBe(true);
    expect(isTourCompleted("calendar", ["overview"], new Date())).toBe(false);
  });
});
