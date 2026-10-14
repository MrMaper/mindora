/**
 * Member context: the one read model UI/actions should ask for areas + flags.
 * Reads `user_areas` rows (P4+); a member with none yet is provisioned on first read.
 */
import { cache } from "react";
import { prisma as db } from "@/lib/db";
import { parseModuleFlags } from "@/lib/modules";
import { getModuleAccess } from "@/lib/module-guard";
import {
  buildMemberContextFromRows,
  type AreaRef,
  type MemberContext,
  type UserAreaRow,
} from "./member-context";

export type { AreaRef, HubKind, MemberContext, UserAreaRow } from "./member-context";
export {
  buildAreaRefsFromRows,
  buildMemberContextFromRows,
} from "./member-context";

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
    },
    orderBy: { sortOrder: "asc" },
  });
}

/** Deduped within one RSC request. */
export const getMemberContext = cache(
  async (userId: string): Promise<MemberContext> => {
    const [access, loaded] = await Promise.all([
      getModuleAccess(userId),
      loadUserAreas(userId),
    ]);
    let rows = loaded;
    if (rows.length === 0) {
      // Brand-new member (or a script-created one): seed the four areas once.
      const { ensurePersonalWorkspace } = await import("./ensure");
      await ensurePersonalWorkspace(userId);
      rows = await loadUserAreas(userId);
    }
    const flags = access?.flags ?? parseModuleFlags({});
    return buildMemberContextFromRows(userId, flags, rows);
  },
);

export async function listUserAreas(
  userId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<AreaRef[]> {
  const ctx = await getMemberContext(userId);
  return opts.includeArchived ? ctx.areas : ctx.areas.filter(a => !a.archived);
}
