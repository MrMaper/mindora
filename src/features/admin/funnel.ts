/**
 * Onboarding funnel from timestamps we already store (docs/AREAS.md §6.7, S-11).
 * Pure: aggregate counts only, no per-member behavioral detail.
 *
 * Caveats (documented, not hidden):
 * - There is no "first login" timestamp; "first login" means `lastLoginAt` is set.
 * - "Within 24 h" is measured from account creation, the only anchor we have.
 * - Members created before the lifecycle columns shipped have no timestamps and
 *   simply drop out of the later steps.
 */
export type FunnelChannel = "ADMIN_INVITE" | "SELF_SIGNUP";

export interface FunnelMemberRow {
  createdVia: FunnelChannel;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  firstCaptureAt: Date | null;
  uiProfileChangedAt: Date | null;
  uiProfile: string | null;
}

export interface FunnelCounts {
  invited: number;
  loggedIn: number;
  captured: number;
  capturedWithin24h: number;
  returned: number;
  switchedToFull: number;
}

export type OnboardingFunnel = Record<FunnelChannel | "ALL", FunnelCounts>;

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyCounts(): FunnelCounts {
  return {
    invited: 0,
    loggedIn: 0,
    captured: 0,
    capturedWithin24h: 0,
    returned: 0,
    switchedToFull: 0,
  };
}

function add(counts: FunnelCounts, row: FunnelMemberRow) {
  counts.invited += 1;
  if (row.lastLoginAt) counts.loggedIn += 1;
  if (row.firstCaptureAt) {
    counts.captured += 1;
    if (row.firstCaptureAt.getTime() - row.createdAt.getTime() <= DAY_MS) {
      counts.capturedWithin24h += 1;
    }
  }
  // Came back on a later calendar day than the one the account was created.
  if (row.lastSeenAt && dayKey(row.lastSeenAt) > dayKey(row.createdAt)) {
    counts.returned += 1;
  }
  if (row.uiProfileChangedAt && row.uiProfile === "full") {
    counts.switchedToFull += 1;
  }
}

export function computeOnboardingFunnel(rows: FunnelMemberRow[]): OnboardingFunnel {
  const out: OnboardingFunnel = {
    ALL: emptyCounts(),
    ADMIN_INVITE: emptyCounts(),
    SELF_SIGNUP: emptyCounts(),
  };
  for (const row of rows) {
    add(out.ALL, row);
    add(out[row.createdVia], row);
  }
  return out;
}
