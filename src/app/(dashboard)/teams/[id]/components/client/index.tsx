"use client";

import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";

import * as React from "react";
import { useTranslation } from "@/i18n/provider";
import { useTeamDetail } from "../hooks/use-team-detail";
import { TeamDetailHeader } from "../ui/team-detail-header";
import { TeamDetailMembers } from "../ui/team-detail-members";
import { InviteMemberDrawer } from "../ui/invite-member-drawer";
import { RemoveMemberDialog } from "../ui/remove-member-dialog";
import type {
  TeamDetail,
  RoleRow,
  AvailableUserRow,
} from "@/features/teams/types";
import type { Language } from "@/types/db";

interface TeamDetailCCProps {
  team: TeamDetail;
  roles: RoleRow[];
  availableUsers: AvailableUserRow[];
  callerRole: string | null;
  currentUserId: string;
  language: Language;
}

export function TeamDetailCC({
  team: initialTeam,
  roles,
  availableUsers,
  callerRole,
  currentUserId,
  language,
}: TeamDetailCCProps) {
  const t = useTranslation();
  const u = useTeamDetail(initialTeam, roles, availableUsers);

  const canManage =
    callerRole === "ADMINISTRATOR" || callerRole === "TEAM_LEAD";

  return (
    <>
      <TeamDetailHeader
        name={u.team.name}
        description={u.team.description}
        memberCount={u.team.memberCount}
        status={u.team.status}
        canManage={canManage}
        onInvite={u.openInvite}
      />

      {u.actionError && (
        <div
          className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <ResolvedValidationText text={u.actionError} />
        </div>
      )}

      <TeamDetailMembers
        members={u.team.members}
        roles={roles}
        language={language}
        currentUserId={currentUserId}
        callerRole={callerRole}
        changingRoleId={u.changingRoleId}
        onChangeRole={u.onChangeRole}
        onRemove={(memberId, userName) =>
          u.setRemoveTarget({ memberId, userName })
        }
      />

      <InviteMemberDrawer
        open={u.inviteOpen}
        onClose={u.closeInvite}
        actionError={u.actionError}
        isPending={u.isPending}
        availableUsers={u.availableUsers}
        roles={roles}
        selectedUserId={u.selectedUserId}
        selectedRoleId={u.selectedRoleId}
        onSelectedUserIdChange={u.setSelectedUserId}
        onSelectedRoleIdChange={u.setSelectedRoleId}
        onInviteSubmit={u.onInviteSubmit}
      />

      <RemoveMemberDialog
        removeTarget={u.removeTarget}
        onClose={() => u.setRemoveTarget(null)}
        isPending={u.isPending}
        onRemoveConfirm={u.onRemoveConfirm}
      />
    </>
  );
}
