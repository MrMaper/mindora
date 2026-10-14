/**
 * Member context: the one read model UI/actions should ask for areas + flags.
 * P4: prefers `user_areas` rows; falls back to the enum until backfill runs.
 */
import { cache } from "react";
import { prisma as db } from "@/lib/db";
import { parseModuleFlags } from "@/lib/modules";
import { getModuleAccess } from "@/lib/module-guard";
import {
  buildMemberContext,
  buildMemberContextFromRows,
  type AreaRef,
  type MemberContext,
  type PrefRow,
  type UserAreaRow,
} from "./member-context";

export type { AreaRef, HubKind, MemberContext, UserAreaRow } from "./member-context";
export {
  buildMemberContext,
  buildAreaRefs,
  buildAreaRefsFromRows,
  buildMemberContextFromRows,
} from "./member-context";

async function loadAreaPrefs(userId: string): Promise<PrefRow[]> {
  return db.userAreaPreference.findMany({
    where: { userId },
    select: {
      area: true,
      color: true,
      icon: true,
      sortOrder: true,
      archived: true,
    },
  });
}

async function loadUserAreas(userId: string): Promise<UserAreaRow[]> {
  return db.userArea.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      nameIsDefault: true,
      templateKey: true,
      color: true,
      icon: true,
      sortOrder: true,
      archived: true,
      isDefault: true,
      hubFor: true,
      bucketProjectId: true,
      legacyEnum: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

/** Deduped within one RSC request. */
export const getMemberContext = cache(
  async (userId: string): Promise<MemberContext> => {
    const [access, rows, prefs] = await Promise.all([
      getModuleAccess(userId),
      loadUserAreas(userId),
      loadAreaPrefs(userId),
    ]);
    const flags = access?.flags ?? parseModuleFlags({});
    if (rows.length > 0) {
      return buildMemberContextFromRows(userId, flags, rows);
    }
    // Pre-backfill: enum + preferences (identical to P1).
    return buildMemberContext(userId, flags, prefs);
  },
);

export async function listUserAreas(
  userId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<AreaRef[]> {
  const ctx = await getMemberContext(userId);
  return opts.includeArchived ? ctx.areas : ctx.areas.filter(a => !a.archived);
}
