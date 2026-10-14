import { describe, expect, it } from "vitest";
import {
  PRIMARY_MODULES,
  MODULE_PRESETS,
  applyMemberToggle,
  policyAllowedFlags,
  resolveEffectiveFlags,
  type ModulePolicy,
} from "./modules";

describe("resolveEffectiveFlags", () => {
  it("off wins over a member preference", () => {
    const policy = { ...MODULE_PRESETS.full, research: "off" } as ModulePolicy;
    const f = resolveEffectiveFlags({
      policy,
      prefs: { research: true },
    });
    expect(f.research).toBe(false);
  });

  it("on ignores a member preference of false", () => {
    const f = resolveEffectiveFlags({
      policy: MODULE_PRESETS.full,
      prefs: { language: false },
    });
    expect(f.language).toBe(true);
  });

  it("member_choice uses the default when untouched", () => {
    const f = resolveEffectiveFlags({
      policy: MODULE_PRESETS.starter,
      prefs: {},
    });
    expect(f.research).toBe(false);
    expect(f.language).toBe(false);
    expect(f.habits).toBe(true);
    expect(f.tasks).toBe(true);
  });

  it("member_choice honours the preference", () => {
    const f = resolveEffectiveFlags({
      policy: MODULE_PRESETS.starter,
      prefs: { research: true, habits: false },
    });
    expect(f.research).toBe(true);
    expect(f.habits).toBe(false);
  });

  it("research turns off when docs is off", () => {
    const policy = {
      ...MODULE_PRESETS.full,
      docs: "off",
    } as ModulePolicy;
    expect(
      resolveEffectiveFlags({ policy, prefs: {} }).research,
    ).toBe(false);
  });

  it("reporting and workLogs turn off with tasks", () => {
    const policy = { ...MODULE_PRESETS.full, tasks: "off" } as ModulePolicy;
    const f = resolveEffectiveFlags({ policy, prefs: {} });
    expect(f.reporting).toBe(false);
    expect(f.workLogs).toBe(false);
  });

  it("dependency preference is restored when the parent comes back", () => {
    const prefs = { research: true };
    const off = resolveEffectiveFlags({
      policy: { ...MODULE_PRESETS.starter, docs: "off" } as ModulePolicy,
      prefs,
    });
    const back = resolveEffectiveFlags({
      policy: MODULE_PRESETS.starter,
      prefs,
    });
    expect(off.research).toBe(false);
    expect(back.research).toBe(true);
  });
});

describe("applyMemberToggle", () => {
  it("rejects locked and off modules", () => {
    expect(applyMemberToggle(MODULE_PRESETS.starter, {}, "tasks", false)).toMatchObject({
      ok: false,
      reason: "locked_on",
    });
    const policy = { ...MODULE_PRESETS.starter, language: "off" } as ModulePolicy;
    expect(applyMemberToggle(policy, {}, "language", true)).toMatchObject({
      ok: false,
      reason: "admin_off",
    });
  });

  it("rejects enabling when a dependency is admin-off", () => {
    const policy = { ...MODULE_PRESETS.starter, docs: "off" } as ModulePolicy;
    expect(applyMemberToggle(policy, {}, "research", true)).toMatchObject({
      ok: false,
      reason: "dependency_off",
      module: "docs",
    });
  });

  it("enables a member_choice dependency automatically", () => {
    const policy = {
      ...MODULE_PRESETS.starter,
      docs: "member_choice",
    } as ModulePolicy;
    const res = applyMemberToggle(policy, { docs: false }, "research", true);
    expect(res).toEqual({ ok: true, prefs: { docs: true, research: true } });
  });
});

describe("policyAllowedFlags", () => {
  it("is true for every non-off policy", () => {
    const flags = policyAllowedFlags({
      ...MODULE_PRESETS.starter,
      language: "off",
    } as ModulePolicy);
    expect(flags.language).toBe(false);
    expect(flags.research).toBe(true);
    for (const key of PRIMARY_MODULES) expect(typeof flags[key]).toBe("boolean");
  });
});
