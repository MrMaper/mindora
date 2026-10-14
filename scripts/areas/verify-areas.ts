/**
 * Read-only invariant checks (docs/AREAS.md §19.1). Safe on production.
 * Exits non-zero on any violation. Run after each rollout and backfill:
 *
 *   npx tsx scripts/areas/verify-areas.ts
 *
 * P0 covers module policy. Area invariants are added with the schema (P4).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PRIMARY_MODULES,
  parseModulePolicy,
  policyToLegacyFlags,
} from "../../src/lib/modules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const STATES = new Set(["off", "on", "member_choice"]);

async function main() {
  const violations: string[] = [];

  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      email: true,
      enabledModules: true,
      modulePolicy: true,
      mustChangePassword: true,
      password: true,
      preferences: { select: { moduleMemberPrefs: true } },
    },
  });

  for (const m of members) {
    const stored = (m.modulePolicy ?? {}) as Record<string, unknown>;
    for (const key of PRIMARY_MODULES) {
      if (!STATES.has(String(stored[key]))) {
        violations.push(`${m.email}: modulePolicy.${key} is missing/invalid (run backfill-modules)`);
      }
    }

    const policy = parseModulePolicy(m.modulePolicy, m.enabledModules);
    const mirror = policyToLegacyFlags(policy);
    const legacy = (m.enabledModules ?? {}) as Record<string, unknown>;
    for (const key of PRIMARY_MODULES) {
      if (legacy[key] !== undefined && legacy[key] !== mirror[key]) {
        violations.push(`${m.email}: enabledModules.${key} disagrees with policy mirror`);
      }
    }

    const prefs = (m.preferences?.moduleMemberPrefs ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(prefs)) {
      if (!(PRIMARY_MODULES as readonly string[]).includes(k) || typeof v !== "boolean") {
        violations.push(`${m.email}: moduleMemberPrefs has invalid entry ${k}`);
      }
    }

    if (m.mustChangePassword && !m.password) {
      violations.push(`${m.email}: mustChangePassword set but no password (invite pending?)`);
    }
  }

  const activeInvites = await db.passwordResetToken.count({
    where: { purpose: "INVITE", expiresAt: { gt: new Date() } },
  });

  console.log(
    `[verify-areas] members=${members.length} activeInvites=${activeInvites} violations=${violations.length}`,
  );
  if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
