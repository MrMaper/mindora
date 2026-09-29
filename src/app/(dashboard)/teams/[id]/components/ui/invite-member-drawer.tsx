"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Select } from "@/components/ui-kit/forms/select";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { useTranslation } from "@/i18n/provider";
import { ROLE_DISPLAY_MAP } from "../../constants";
import type { RoleRow, AvailableUserRow } from "@/features/teams/types";

interface InviteMemberDrawerProps {
  open: boolean;
  onClose: () => void;
  actionError: string | null;
  isPending: boolean;
  availableUsers: AvailableUserRow[];
  roles: RoleRow[];
  selectedUserId: string;
  selectedRoleId: string;
  onSelectedUserIdChange: (value: string) => void;
  onSelectedRoleIdChange: (value: string) => void;
  onInviteSubmit: () => void;
}

export function InviteMemberDrawer({
  open,
  onClose,
  actionError,
  isPending,
  availableUsers,
  roles,
  selectedUserId,
  selectedRoleId,
  onSelectedUserIdChange,
  onSelectedRoleIdChange,
  onInviteSubmit,
}: InviteMemberDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.teams.inviteMember}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={onInviteSubmit}
          >
            {t.teams.invite}
          </Button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError && (
          <div
            className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
            role="alert"
          >
            <ResolvedValidationText text={actionError} />
          </div>
        )}

        {availableUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t.teams.noMembers}
          </p>
        ) : (
          <>
            <Select
              label={t.teams.selectUser}
              value={selectedUserId}
              onChange={onSelectedUserIdChange}
              options={[
                { value: "", label: t.teams.selectUser },
                ...availableUsers.map(usr => ({
                  value: usr.id,
                  label: `${usr.name} (${usr.email})`,
                })),
              ]}
            />
            <Select
              label={t.teams.selectRole}
              value={selectedRoleId}
              onChange={onSelectedRoleIdChange}
              options={roles.map(r => ({
                value: r.id,
                label: t.teams[ROLE_DISPLAY_MAP[r.name] ?? "roleMember"],
              }))}
            />
          </>
        )}
      </div>
    </Drawer>
  );
}
