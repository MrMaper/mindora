"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { inviteMember, updateMemberRole, removeMember } from "@/features/teams/actions";
import type { TeamDetail, RoleRow, AvailableUserRow } from "@/features/teams/types";

export function useTeamDetail(
  initialTeam: TeamDetail,
  initialRoles: RoleRow[],
  initialAvailableUsers: AvailableUserRow[]
) {
  const router = useRouter();

  const [team, setTeam] = React.useState(initialTeam);
  const [roles] = React.useState(initialRoles);
  const [availableUsers, setAvailableUsers] = React.useState(initialAvailableUsers);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = React.useState<{
    memberId: string;
    userName: string;
  } | null>(null);

  const [changingRoleId, setChangingRoleId] = React.useState<string | null>(null);

  function openInvite() {
    setSelectedUserId("");
    setSelectedRoleId(roles[0]?.id ?? "");
    setActionError(null);
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
    setActionError(null);
  }

  function onInviteSubmit() {
    if (!selectedUserId || !selectedRoleId) {
      setActionError("Please select a user and a role.");
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("userId", selectedUserId);
      fd.append("roleId", selectedRoleId);

      const result = await inviteMember(team.id, fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to invite member.");
        return;
      }

      setAvailableUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
      closeInvite();
      router.refresh();
    });
  }

  function onChangeRole(memberId: string, newRoleId: string) {
    setChangingRoleId(memberId);
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("roleId", newRoleId);

      const result = await updateMemberRole(memberId, fd);
      setChangingRoleId(null);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update role.");
        return;
      }

      router.refresh();
    });
  }

  function onRemoveConfirm() {
    if (!removeTarget) return;

    setActionError(null);
    startTransition(async () => {
      const result = await removeMember(removeTarget.memberId);
      setRemoveTarget(null);
      if (!result.success) {
        setActionError(result.error ?? "Failed to remove member.");
        return;
      }

      router.refresh();
    });
  }

  return {
    team,
    roles,
    availableUsers,
    inviteOpen,
    openInvite,
    closeInvite,
    selectedUserId,
    setSelectedUserId,
    selectedRoleId,
    setSelectedRoleId,
    onInviteSubmit,
    onChangeRole,
    changingRoleId,
    removeTarget,
    setRemoveTarget,
    onRemoveConfirm,
    isPending,
    actionError,
  };
}