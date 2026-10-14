/**
 * Server helpers to resolve a member's Research / Language hub scope (P6).
 */
import { getMemberContext } from "./context";
import { hubProjectWhere } from "./hub";
import type { HubKind } from "./member-context";

export type HubScope = {
  /** Hub UserArea id; null while the member has no hub area for this kind. */
  areaId: string | null;
  /** Hub inbox project id ("" while unbound). */
  bucketProjectId: string;
  /** `templateKey` of the hub area (for legacy shared-bucket detection). */
  templateKey: string | null;
  /** True when UserArea.hubFor is set for this kind. */
  bound: boolean;
};

export async function getHubScope(
  userId: string,
  kind: HubKind,
): Promise<HubScope> {
  const ctx = await getMemberContext(userId);
  const hub = ctx.hubAreas[kind];
  return {
    areaId: hub?.id ?? null,
    bucketProjectId: hub?.bucketProjectId ?? "",
    templateKey: hub?.templateKey ?? null,
    bound: Boolean(hub),
  };
}

/** Prisma project filter for hub-owned named paths (+ inbox bucket). */
export function hubNamedProjectsWhere(
  userId: string,
  scope: HubScope,
): Record<string, unknown> {
  return {
    ...hubProjectWhere(scope.areaId),
    status: { not: "ARCHIVED" },
    ...(scope.bucketProjectId ? { id: { not: scope.bucketProjectId } } : {}),
    members: { some: { userId } },
  };
}
