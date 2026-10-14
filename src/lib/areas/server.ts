/** Area seam — server-only exports (DB / auth). */
export {
  getMemberContext,
  listUserAreas,
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
  ensureHubAreaForModule,
  bucketProjectIdForArea,
} from "./ensure";
export {
  areaIdForGuess,
  areaIdForTemplate,
  defaultAreaId,
  isMemberArea,
  resolveMemberAreaId,
} from "./resolve";
export { getEffectiveFlagsForUser } from "@/lib/module-guard";
export {
  getHubScope,
  hubNamedProjectsWhere,
  type HubScope,
} from "./hub-scope";
