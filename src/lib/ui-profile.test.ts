import { describe, expect, it } from "vitest";
import { parseModuleFlags, type ModuleFlags } from "@/lib/modules";
import {
  SUGGEST_FULL_AFTER_DONE,
  templateKeyForLifePart,
  explicitNavModules,
  isLifePartChip,
  navVisibility,
  parseUiProfile,
  shouldSuggestFull,
} from "./ui-profile";

const allOn = parseModuleFlags({});
const flags = (over: Partial<ModuleFlags> = {}): ModuleFlags => ({ ...allOn, ...over });

describe("parseUiProfile", () => {
  it("accepts the two profiles and falls back to full", () => {
    expect(parseUiProfile("starter")).toBe("starter");
    expect(parseUiProfile("full")).toBe("full");
    expect(parseUiProfile("weird")).toBe("full");
    expect(parseUiProfile(null)).toBe("full");
    expect(parseUiProfile(undefined, "starter")).toBe("starter");
  });
});

describe("shouldSuggestFull", () => {
  it("waits for 3 completed tasks, once, and only on starter", () => {
    const base = { profile: "starter" as const, dismissedAt: null };
    expect(SUGGEST_FULL_AFTER_DONE).toBe(3);
    expect(shouldSuggestFull({ ...base, doneCount: 2 })).toBe(false);
    expect(shouldSuggestFull({ ...base, doneCount: 3 })).toBe(true);
    expect(shouldSuggestFull({ ...base, doneCount: 9, dismissedAt: new Date() })).toBe(false);
    expect(shouldSuggestFull({ profile: "full", doneCount: 9, dismissedAt: null })).toBe(false);
  });
});

describe("navVisibility", () => {
  it("full shows everything the effective modules allow", () => {
    const nav = navVisibility({ profile: "full", flags: allOn, explicit: [], hasDatedTask: false });
    expect(Object.values(nav).every(Boolean)).toBe(true);
    const noResearch = navVisibility({
      profile: "full",
      flags: flags({ research: false }),
      explicit: [],
      hasDatedTask: false,
    });
    expect(noResearch.research).toBe(false);
    expect(noResearch.docs).toBe(true);
  });

  it("starter shows at most Today and Tasks until a task has a date", () => {
    const nav = navVisibility({ profile: "starter", flags: allOn, explicit: [], hasDatedTask: false });
    expect(nav.dashboard).toBe(true);
    expect(nav.tasks).toBe(true);
    const visible = Object.entries(nav).filter(([, v]) => v).map(([k]) => k);
    expect(visible).toEqual(["dashboard", "tasks"]);
  });

  it("starter shows Calendar after the first dated task (≤ 3 entries + Settings)", () => {
    const nav = navVisibility({ profile: "starter", flags: allOn, explicit: [], hasDatedTask: true });
    const visible = Object.entries(nav).filter(([, v]) => v).map(([k]) => k);
    expect(visible).toEqual(["dashboard", "tasks", "calendar"]);
  });

  it("starter hides Board and Review even though tasks are on", () => {
    const nav = navVisibility({ profile: "starter", flags: allOn, explicit: [], hasDatedTask: true });
    expect(nav.kanban).toBe(false);
    expect(nav.review).toBe(false);
  });

  it("starter adds explicitly enabled modules, and only if still effective", () => {
    const nav = navVisibility({
      profile: "starter",
      flags: flags({ research: false }),
      explicit: ["language", "research"],
      hasDatedTask: false,
    });
    expect(nav.language).toBe(true);
    expect(nav.research).toBe(false);
    expect(nav.docs).toBe(false);
  });

  it("starter respects a tasks-off policy", () => {
    const nav = navVisibility({
      profile: "starter",
      flags: flags({ tasks: false }),
      explicit: [],
      hasDatedTask: true,
    });
    expect(nav.tasks).toBe(false);
    expect(nav.calendar).toBe(false);
  });
});

describe("explicitNavModules", () => {
  it("keeps only member-enabled modules that are effective and have a nav entry", () => {
    expect(
      explicitNavModules(
        { language: true, research: true, habits: true, docs: false },
        flags({ research: false }),
      ),
    ).toEqual(["language"]);
    expect(explicitNavModules({}, allOn)).toEqual([]);
  });
});

describe("life-part chips", () => {
  it("validates chip ids", () => {
    expect(isLifePartChip("work")).toBe(true);
    expect(isLifePartChip("nope")).toBe(false);
  });

  it("maps to the four fixed areas without ever hiding the task", () => {
    const off = { research: false, language: false };
    const on = { research: true, language: true };
    expect(templateKeyForLifePart("work", off)).toBe("work");
    expect(templateKeyForLifePart("home", off)).toBe("life");
    expect(templateKeyForLifePart("health", off)).toBe("life");
    expect(templateKeyForLifePart("other", off)).toBe("life");
    // Hub areas hide tasks from Today, so only when the module is on.
    expect(templateKeyForLifePart("study", off)).toBe("life");
    expect(templateKeyForLifePart("language", off)).toBe("life");
    expect(templateKeyForLifePart("study", on)).toBe("research");
    expect(templateKeyForLifePart("language", on)).toBe("language");
  });
});
