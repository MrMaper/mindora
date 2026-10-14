/** Area seam — server-only exports (DB / auth). */
export {
  getMemberContext,
  listUserAreas,
  buildMemberContext,
  buildAreaRefs,
  buildAreaRefsFromRows,
  buildMemberContextFromRows,
  type AreaRef,
  type HubKind,
  type MemberContext,
  type UserAreaRow,
} from "./context";
export {
  ensureDefaultArea,
  ensurePersonalWorkspace,
  ensureUserAreas,
  ensureHubAreaForModule,
  projectIdForArea,
} from "./ensure";
export {
  areaIdForLegacy,
  dualAreaFields,
  dualAreaRequired,
  clearAreaIdCache,
} from "./dual-write";
export { getEffectiveFlagsForUser } from "@/lib/module-guard";
export {
  getHubScope,
  hubNamedProjectsWhere,
  type HubScope,
} from "./hub-scope";
