/** Area seam — server-only exports (DB / auth). */
export {
  getMemberContext,
  listUserAreas,
  buildMemberContext,
  buildAreaRefs,
  type AreaRef,
  type HubKind,
  type MemberContext,
} from "./context";
export {
  ensureDefaultArea,
  ensurePersonalWorkspace,
  projectIdForArea,
} from "./ensure";
export { getEffectiveFlagsForUser } from "@/lib/module-guard";
