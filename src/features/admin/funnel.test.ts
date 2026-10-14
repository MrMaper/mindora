import { describe, expect, it } from "vitest";
import { computeOnboardingFunnel, type FunnelMemberRow } from "./funnel";

const d = (iso: string) => new Date(iso);

function row(over: Partial<FunnelMemberRow> = {}): FunnelMemberRow {
  return {
    createdVia: "ADMIN_INVITE",
    createdAt: d("2026-10-01T08:00:00Z"),
    lastLoginAt: null,
    lastSeenAt: null,
    firstCaptureAt: null,
    uiProfileChangedAt: null,
    uiProfile: "starter",
    ...over,
  };
}

describe("computeOnboardingFunnel", () => {
  it("counts an untouched invite only as invited", () => {
    const f = computeOnboardingFunnel([row()]);
    expect(f.ALL).toEqual({
      invited: 1,
      loggedIn: 0,
      captured: 0,
      capturedWithin24h: 0,
      returned: 0,
      switchedToFull: 0,
    });
  });

  it("walks a member through every step", () => {
    const f = computeOnboardingFunnel([
      row({
        lastLoginAt: d("2026-10-01T09:00:00Z"),
        firstCaptureAt: d("2026-10-01T09:05:00Z"),
        lastSeenAt: d("2026-10-03T10:00:00Z"),
        uiProfileChangedAt: d("2026-10-03T10:01:00Z"),
        uiProfile: "full",
      }),
    ]);
    expect(f.ALL).toEqual({
      invited: 1,
      loggedIn: 1,
      captured: 1,
      capturedWithin24h: 1,
      returned: 1,
      switchedToFull: 1,
    });
  });

  it("separates a late capture from a same-day one", () => {
    const f = computeOnboardingFunnel([
      row({ firstCaptureAt: d("2026-10-01T20:00:00Z") }),
      row({ firstCaptureAt: d("2026-10-04T20:00:00Z") }),
    ]);
    expect(f.ALL.captured).toBe(2);
    expect(f.ALL.capturedWithin24h).toBe(1);
  });

  it("does not count activity on the creation day as a return", () => {
    const f = computeOnboardingFunnel([
      row({ lastSeenAt: d("2026-10-01T23:00:00Z") }),
    ]);
    expect(f.ALL.returned).toBe(0);
  });

  it("does not count a member who was already full and never switched", () => {
    const f = computeOnboardingFunnel([row({ uiProfile: "full" })]);
    expect(f.ALL.switchedToFull).toBe(0);
  });

  it("splits by createdVia and keeps ALL as the sum", () => {
    const f = computeOnboardingFunnel([
      row({ createdVia: "ADMIN_INVITE" }),
      row({ createdVia: "SELF_SIGNUP" }),
      row({ createdVia: "SELF_SIGNUP" }),
    ]);
    expect(f.ADMIN_INVITE.invited).toBe(1);
    expect(f.SELF_SIGNUP.invited).toBe(2);
    expect(f.ALL.invited).toBe(3);
  });
});
