/**
 * Member context: the one read model UI/actions should ask for areas + flags.
 */
import { cache } from "react";
import { prisma as db } from "@/lib/db";
import { parseModuleFlags } from "@/lib/modules";
import { getModuleAccess } from "@/lib/module-guard";
import {
  buildMemberContext,
  type AreaRef,
  type MemberContext,
  type PrefRow,
} from "./member-context";

export type { AreaRef, HubKind, MemberContext } from "./member-context";
export { buildMemberContext, buildAreaRefs } from "./member-context";

async function loadAreaPrefs(userId: string): Promise<PrefRow[]> {
  const rows = await db.userAreaPreference.findMany({
    where: { userId },
    select: {
      area: true,
      color: true,
      icon: true,
      sortOrder: true,
      archived: true,
    },
  });
  return rows;
}

/** Deduped within one RSC request. */
export const getMemberContext = cache(
  async (userId: string): Promise<MemberContext> => {
    const [access, prefs] = await Promise.all([
      getModuleAccess(userId),
      loadAreaPrefs(userId),
    ]);
    // Unknown user (deleted mid-request): same fallback as getEffectiveFlagsForUser.
    const flags = access?.flags ?? parseModuleFlags({});
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
