import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { Translations } from "@/i18n";
import type { ProjectMemberRow } from "@/features/projects/types";

const ROLE_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  OWNER: "success",
  ADMIN: "warning",
  MEMBER: "neutral",
  VIEWER: "info",
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface MembersTabProps {
  t: Translations;
  members: ProjectMemberRow[];
  currentUserId: string;
  isAdmin: boolean;
  onInviteMember: () => void;
  onRemoveMember: (member: ProjectMemberRow) => void;
  onChangeRole: (member: ProjectMemberRow) => void;
}

export function MembersTab({
  t,
  members,
  currentUserId,
  isAdmin,
  onInviteMember,
  onRemoveMember,
  onChangeRole,
}: MembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.projects.members}</h3>
        {isAdmin && (
          <Button variant="primary" icon="plus" size="sm" onClick={onInviteMember}>
            {t.projects.inviteMember}
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>{t.projects.noMembers}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-muted">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                t={t}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onRemoveMember={onRemoveMember}
                onChangeRole={onChangeRole}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  t,
  currentUserId,
  isAdmin,
  onRemoveMember,
  onChangeRole,
}: {
  member: ProjectMemberRow;
  t: Translations;
  currentUserId: string;
  isAdmin: boolean;
  onRemoveMember: (member: ProjectMemberRow) => void;
  onChangeRole: (member: ProjectMemberRow) => void;
}) {
  const isCurrentUser = member.userId === currentUserId;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 last:border-0">
      <Avatar name={member.userName} src={member.userAvatar ?? undefined} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{member.userName}</span>
          {isCurrentUser && (
            <Badge tone="info" className="text-xs">
              {t.common.you}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{member.userEmail}</div>
      </div>

      <Badge tone={ROLE_TONE[member.role] || "neutral"}>
        {ROLE_LABEL[member.role] || member.role}
      </Badge>

      {isAdmin && !isCurrentUser && (
        <Menu
          trigger={
            <IconButton icon="more-horizontal" size="sm" aria-label={t.common.actions} />
          }
          align="end"
items={[
            { label: t.projects.changeRole, icon: "user", onClick: () => onChangeRole(member) },
            { divider: true },
            { label: t.projects.removeMember, icon: "user-x", danger: true, onClick: () => onRemoveMember(member) },
          ]}
        />
      )}
    </div>
  );
}