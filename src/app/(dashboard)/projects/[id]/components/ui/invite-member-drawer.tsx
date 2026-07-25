"use client";

import * as React from "react";
import { Select } from "@/components/ui-kit/forms/select";
import { Button } from "@/components/ui-kit/forms/button";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import type { Translations } from "@/i18n";

interface InviteMemberDrawerProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  members: Array<{ userId: string; userName: string; userEmail: string }>;
  currentUserId: string;
  onInvite: () => void;
}

export function InviteMemberDrawer({
  open,
  onClose,
  t,
  members,
  currentUserId,
  onInvite,
}: InviteMemberDrawerProps) {
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("MEMBER");

  const availableMembers = members.filter(
    (m) => m.userId !== currentUserId,
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
            onClick={onInvite}
            disabled={!selectedUserId || !selectedRole}
          >
            {t.projects.invite}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        <Select
          label={t.projects.selectUser}
          value={selectedUserId}
          onChange={setSelectedUserId}
          options={[
            { value: "", label: t.projects.selectUser },
            ...availableMembers.map((m) => ({
              value: m.userId,
              label: `${m.userName} (${m.userEmail})`,
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