/**
 * Server helpers to resolve a member's Research / Language hub scope (P6).
 */
import { getMemberContext } from "./context";
import { personalAreaProjectId } from "./buckets";
import { LANGUAGE_AREA, RESEARCH_AREA } from "./legacy";
import { hubProjectWhere } from "./hub";
import type { HubKind } from "./member-context";
import type { LifeArea } from "@/types/db";

export type HubScope = {
  areaId: string | null;
  legacyEnum: LifeArea;
  bucketProjectId: string;
  /** True when UserArea.hubFor is set for this kind. */
  bound: boolean;
};

export async function getHubScope(
  userId: string,
  kind: HubKind,
): Promise<HubScope> {
  const ctx = await getMemberContext(userId);
  const hub = ctx.hubAreas[kind];
  const legacy = kind === "research" ? RESEARCH_AREA : LANGUAGE_AREA;
  return {
    areaId: hub?.id ?? null,
    legacyEnum: hub?.legacyEnum ?? legacy,
    bucketProjectId:
      hub?.bucketProjectId || personalAreaProjectId(userId, legacy),
    bound: Boolean(hub),
  };
}

/** Prisma project filter for hub-owned named paths (+ inbox bucket). */
export function hubNamedProjectsWhere(
  userId: string,
  scope: HubScope,
): Record<string, unknown> {
  return {
    ...hubProjectWhere(scope.areaId, scope.legacyEnum),
    status: { not: "ARCHIVED" },
    id: { not: scope.bucketProjectId },
    members: { some: { userId } },
  };
}
