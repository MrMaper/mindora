/**
 * Read-only invariant checks (docs/AREAS.md §19.1). Safe on production.
 * Exits non-zero on any violation. Run after each rollout:
 *
 *   npx tsx scripts/areas/verify-areas.ts
 *
 * P0: module policy. P4: UserArea invariants (§9.6).
 * P7: legacy enum / mirror columns are gone — `areaId` is NOT NULL on
 * Project / Task / Doc / Habit, so only ownership agreement is checked here.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PRIMARY_MODULES,
  parseModulePolicy,
  resolveEffectiveFlags,
} from "../../src/lib/modules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const STATES = new Set(["off", "on", "member_choice"]);

async function count(sql: Promise<{ n: bigint }[]>): Promise<number> {
  const rows = await sql;
  return Number(rows[0]?.n ?? 0);
}

async function main() {
  const violations: string[] = [];

  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      email: true,
      modulePolicy: true,
      mustChangePassword: true,
      password: true,
      preferences: { select: { moduleMemberPrefs: true } },
      areas: {
        select: {
          id: true,
          isDefault: true,
          archived: true,
          hubFor: true,
          bucketProjectId: true,
          name: true,
        },
      },
    },
  });

  for (const m of members) {
    const stored = (m.modulePolicy ?? {}) as Record<string, unknown>;
    for (const key of PRIMARY_MODULES) {
      if (!STATES.has(String(stored[key]))) {
        violations.push(
          `${m.email}: modulePolicy.${key} is missing/invalid (set via admin Users or provisionMember)`,
        );
      }
    }

    const prefs = (m.preferences?.moduleMemberPrefs ?? {}) as Record<
      string,
      unknown
    >;
    for (const [k, v] of Object.entries(prefs)) {
      if (
        !(PRIMARY_MODULES as readonly string[]).includes(k) ||
        typeof v !== "boolean"
      ) {
        violations.push(
          `${m.email}: moduleMemberPrefs has invalid entry ${k}`,
        );
      }
    }

    if (m.mustChangePassword && !m.password) {
      violations.push(
        `${m.email}: mustChangePassword set but no password (invite pending?)`,
      );
    }

    // --- UserArea invariants (members who never signed in have none yet) ---
    if (m.areas.length === 0) continue;

    const activeDefaults = m.areas.filter(a => a.isDefault && !a.archived);
    if (activeDefaults.length !== 1) {
      violations.push(
        `${m.email}: expected exactly 1 active default area, found ${activeDefaults.length}`,
      );
    }

    const defaultArea = activeDefaults[0];
    if (defaultArea?.hubFor) {
      violations.push(`${m.email}: default area must not be a hub`);
    }

    for (const hub of ["RESEARCH", "LANGUAGE"] as const) {
      const hubs = m.areas.filter(a => a.hubFor === hub);
      if (hubs.length > 1) {
        violations.push(
          `${m.email}: more than one area with hubFor=${hub}`,
        );
      }
    }
    const research = m.areas.find(a => a.hubFor === "RESEARCH");
    const language = m.areas.find(a => a.hubFor === "LANGUAGE");
    if (research && language && research.id === language.id) {
      violations.push(`${m.email}: research and language hubs are the same area`);
    }

    for (const area of m.areas) {
      if (!area.bucketProjectId) {
        violations.push(
          `${m.email}: area ${area.name} (${area.id}) has no bucket project`,
        );
        continue;
      }
      const bucket = await db.project.findUnique({
        where: { id: area.bucketProjectId },
        select: { id: true, areaId: true },
      });
      if (!bucket) {
        violations.push(
          `${m.email}: area ${area.id} bucket ${area.bucketProjectId} missing`,
        );
      } else if (bucket.areaId !== area.id) {
        violations.push(
          `${m.email}: bucket ${bucket.id} areaId does not point back to area`,
        );
      }
    }

    const flags = resolveEffectiveFlags({
      policy: parseModulePolicy(m.modulePolicy),
      prefs: m.preferences?.moduleMemberPrefs,
    });
    if (flags.research && !research) {
      violations.push(
        `${m.email}: research module effective but no RESEARCH hub area`,
      );
    }
    if (flags.language && !language) {
      violations.push(
        `${m.email}: language module effective but no LANGUAGE hub area`,
      );
    }

    // Ownership agreement: the area a row points at must belong to its owner.
    const badTasks = await count(db.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n
      FROM tasks t
      JOIN user_areas ua ON ua.id = t."areaId"
      WHERE ua."userId" = ${m.id}
        AND t."createdById" <> ${m.id}
        AND (t."assignedToId" IS NULL OR t."assignedToId" <> ${m.id})
    `);
    if (badTasks > 0) {
      violations.push(
        `${m.email}: ${badTasks} tasks point at this member's area but are neither created by nor assigned to them`,
      );
    }

    const badDocs = await count(db.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n
      FROM docs d
      JOIN user_areas ua ON ua.id = d."areaId"
      WHERE d."userId" = ${m.id} AND ua."userId" <> d."userId"
    `);
    if (badDocs > 0) {
      violations.push(
        `${m.email}: ${badDocs} docs point at another member's area`,
      );
    }

    const badHabits = await count(db.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*)::bigint AS n
      FROM habits h
      JOIN user_areas ua ON ua.id = h."areaId"
      WHERE h."userId" = ${m.id} AND ua."userId" <> h."userId"
    `);
    if (badHabits > 0) {
      violations.push(
        `${m.email}: ${badHabits} habits point at another member's area`,
      );
    }
  }

  const activeInvites = await db.passwordResetToken.count({
    where: { purpose: "INVITE", expiresAt: { gt: new Date() } },
  });

  const withAreas = members.filter(m => m.areas.length > 0).length;
  console.log(
    `[verify-areas] members=${members.length} withUserAreas=${withAreas} activeInvites=${activeInvites} violations=${violations.length}`,
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
