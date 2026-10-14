/**
 * Materialize an explicit module policy for every existing member
 * (docs/AREAS.md §7.6).
 *
 *   old flag true  -> policy "member_choice" and member preference true
 *   old flag false -> policy "off"
 *
 * Effective flags before and after are identical. Idempotent and safe to
 * re-run: only members whose stored policy is incomplete are touched.
 *
 * Run after `prisma migrate deploy`:
 *   npx tsx scripts/areas/backfill-modules.ts          # apply
 *   npx tsx scripts/areas/backfill-modules.ts --dry    # report only
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  backfillPolicyFromLegacy,
  policyToLegacyFlags,
  resolveEffectiveFlags,
  PRIMARY_MODULES,
} from "../../src/lib/modules";

const dry = process.argv.includes("--dry");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    select: {
      id: true,
      email: true,
      enabledModules: true,
      modulePolicy: true,
      preferences: { select: { moduleMemberPrefs: true } },
    },
  });

  let changed = 0;
  let unchanged = 0;
  const problems: string[] = [];

  for (const m of members) {
    const prefsRaw = m.preferences?.moduleMemberPrefs ?? {};
    const before = resolveEffectiveFlags({
      policy: m.modulePolicy,
      prefs: prefsRaw,
      legacy: m.enabledModules,
    });
    const result = backfillPolicyFromLegacy(
      m.modulePolicy,
      prefsRaw,
      m.enabledModules,
    );
    if (!result.changed) {
      unchanged += 1;
      continue;
    }

    const after = resolveEffectiveFlags({
      policy: result.policy,
      prefs: result.prefs,
      legacy: m.enabledModules,
    });
    const same = PRIMARY_MODULES.every(k => before[k] === after[k]);
    if (!same) {
      problems.push(`${m.email}: effective flags would change, skipped`);
      continue;
    }

    changed += 1;
    if (dry) continue;

    await db.$transaction([
      db.user.update({
        where: { id: m.id },
        data: {
          modulePolicy: result.policy,
          enabledModules: policyToLegacyFlags(result.policy),
        },
      }),
      db.userPreferences.upsert({
        where: { userId: m.id },
        create: { userId: m.id, moduleMemberPrefs: result.prefs },
        update: { moduleMemberPrefs: result.prefs },
      }),
    ]);
  }

  console.log(
    `[backfill-modules] members=${members.length} ${dry ? "would change" : "changed"}=${changed} unchanged=${unchanged}`,
  );
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
