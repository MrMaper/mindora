"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useTranslation } from "@/i18n/provider";
import type { ProjectMemberRow } from "@/features/projects/types";

const ROLE_TONE: Record<
  string,
  "neutral" | "info" | "warning" | "success" | "danger"
> = {
  OWNER: "success",
  ADMIN: "warning",
  MEMBER: "neutral",
  VIEWER: "info",
};

interface MembersTabProps {
  members: ProjectMemberRow[];
  currentUserId: string;
  isAdmin: boolean;
  onInviteMember: () => void;
  onRemoveMember: (member: ProjectMemberRow) => void;
  onChangeRole: (member: ProjectMemberRow) => void;
}

export function MembersTab({
  members,
  currentUserId,
  isAdmin,
  onInviteMember,
  onRemoveMember,
  onChangeRole,
}: MembersTabProps) {
  const t = useTranslation();

  function roleLabel(role: string) {
    if (role === "OWNER") return t.projects.roleOwner;
    if (role === "ADMIN") return t.projects.roleAdmin;
    if (role === "VIEWER") return t.projects.roleViewer;
    return t.projects.roleMember;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t.projects.members}
        </h3>
        {isAdmin ? (
          <Button
            variant="primary"
            icon="plus"
            size="sm"
            onClick={onInviteMember}
          >
            {t.projects.inviteMember}
          </Button>
        ) : null}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        {members.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t.projects.noMembers}
          </div>
        ) : (
          members.map(member => {
            const isCurrentUser = member.userId === currentUserId;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-hover"
              >
                <Avatar
                  name={member.userName}
                  src={member.userAvatar ?? undefined}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.userName}
                    </span>
                    {isCurrentUser ? (
                      <Badge tone="info">{t.common.you}</Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.userEmail}
                  </div>
                </div>

                <Badge tone={ROLE_TONE[member.role] ?? "neutral"}>
                  {roleLabel(member.role)}
                </Badge>

                {isAdmin && !isCurrentUser ? (
                  <Menu
                    trigger={
                      <IconButton
                        icon="more-horizontal"
                        size="sm"
                        aria-label={t.common.actions}
                      />
                    }
                    align="end"
                    items={[
                      {
                        label: t.projects.changeRole,
                        icon: "user",
                        onClick: () => onChangeRole(member),
                      },
                      { divider: true },
                      {
                        label: t.projects.removeMember,
                        icon: "user-x",
                        danger: true,
                        onClick: () => onRemoveMember(member),
                      },
                    ]}
                  />
                ) : (
                  <span className="w-8" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
