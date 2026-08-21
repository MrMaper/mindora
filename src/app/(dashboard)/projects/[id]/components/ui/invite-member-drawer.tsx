"use client";

import * as React from "react";
import { Select } from "@/components/ui-kit/forms/select";
import { Button } from "@/components/ui-kit/forms/button";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";

interface InviteUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface InviteMemberDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  availableUsers: InviteUser[];
  currentUserId: string;
  onInvite: (userId: string, role: string) => void;
  isPending?: boolean;
  error?: string | null;
}

export function InviteMemberDrawer({
  open,
  onClose,
  t,
  availableUsers,
  currentUserId,
  onInvite,
  isPending,
  error,
}: InviteMemberDrawerProps) {
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("MEMBER");

  const filteredUsers = availableUsers.filter(
    (u) => u.id !== currentUserId,
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      header={<span className="text-sm font-semibold text-foreground">{t.projects.inviteMember}</span>}
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={() => {
              if (selectedUserId && selectedRole) {
                onInvite(selectedUserId, selectedRole);
              }
            }}
            disabled={!selectedUserId || !selectedRole || isPending}
          >
            {t.projects.invite}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm">
            {error}
          </div>
        )}
        <Select
          label={t.projects.selectUser}
          value={selectedUserId}
          onChange={setSelectedUserId}
          options={[
            { value: "", label: t.projects.selectUser },
            ...filteredUsers.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.email})`,
            })),
          ]}
        />
        <Select
          label={t.projects.selectRole}
          value={selectedRole}
          onChange={setSelectedRole}
          options={[
            { value: "MEMBER", label: t.projects.roleMember },
            { value: "ADMIN", label: t.projects.roleAdmin },
            { value: "VIEWER", label: t.projects.roleViewer },
          ]}
        />
      </div>
    </Drawer>
  );
}