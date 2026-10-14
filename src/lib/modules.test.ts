import { describe, expect, it } from "vitest";
import {
  PRIMARY_MODULES,
  MODULE_PRESETS,
  applyMemberToggle,
  backfillPolicyFromLegacy,
  parseModuleFlags,
  policyToLegacyFlags,
  resolveEffectiveFlags,
  type ModulePolicy,
} from "./modules";

const legacyShapes: unknown[] = [
  {},
  null,
  { tasks: true },
  { research: false, language: false },
  { docs: false },
  { tasks: false },
  { reporting: false, workLogs: true },
  {
    tasks: true,
    docs: true,
    research: true,
    language: false,
    habits: false,
    projects: true,
    workLogs: false,
    reporting: true,
  },
];

describe("backfill equivalence (docs/AREAS.md §7.6)", () => {
  it.each(legacyShapes.map((l, i) => [i, l] as const))(
    "effective flags are identical before and after backfill (shape %s)",
    (_i, legacy) => {
      const before = resolveEffectiveFlags({ policy: {}, prefs: {}, legacy });
      expect(before).toEqual(parseModuleFlags(legacy));

      const { policy, prefs } = backfillPolicyFromLegacy({}, {}, legacy);
      const after = resolveEffectiveFlags({ policy, prefs, legacy });
      expect(after).toEqual(before);
    },
  );

  it("is idempotent", () => {
    const first = backfillPolicyFromLegacy({}, {}, { research: false });
    const second = backfillPolicyFromLegacy(first.policy, first.prefs, {
      research: false,
    });
    expect(second.changed).toBe(false);
    expect(second.policy).toEqual(first.policy);
  });
});

describe("resolveEffectiveFlags", () => {
  it("off wins over a member preference", () => {
    const policy = { ...MODULE_PRESETS.full, research: "off" } as ModulePolicy;
    const f = resolveEffectiveFlags({
      policy,
      prefs: { research: true },
      legacy: {},
    });
    expect(f.research).toBe(false);
  });

  it("on ignores a member preference of false", () => {
    const f = resolveEffectiveFlags({
      policy: MODULE_PRESETS.full,
      prefs: { language: false },
      legacy: {},
    });
    expect(f.language).toBe(true);
  });

  it("member_choice uses the default when untouched", () => {
    const f = resolveEffectiveFlags({
      policy: MODULE_PRESETS.starter,
      prefs: {},
      legacy: {},
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
      legacy: {},
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
      resolveEffectiveFlags({ policy, prefs: {}, legacy: {} }).research,
    ).toBe(false);
  });

  it("reporting and workLogs turn off with tasks", () => {
    const policy = { ...MODULE_PRESETS.full, tasks: "off" } as ModulePolicy;
    const f = resolveEffectiveFlags({ policy, prefs: {}, legacy: {} });
    expect(f.reporting).toBe(false);
    expect(f.workLogs).toBe(false);
  });

  it("dependency preference is restored when the parent comes back", () => {
    const prefs = { research: true };
    const off = resolveEffectiveFlags({
      policy: { ...MODULE_PRESETS.starter, docs: "off" } as ModulePolicy,
      prefs,
      legacy: {},
    });
    const back = resolveEffectiveFlags({
      policy: MODULE_PRESETS.starter,
      prefs,
      legacy: {},
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

describe("policyToLegacyFlags", () => {
  it("mirrors non-off policies as true", () => {
    const flags = policyToLegacyFlags({
      ...MODULE_PRESETS.starter,
      language: "off",
    } as ModulePolicy);
    expect(flags.language).toBe(false);
    expect(flags.research).toBe(true);
    for (const key of PRIMARY_MODULES) expect(typeof flags[key]).toBe("boolean");
  });
});
