"use client";

import * as React from "react";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";
import { ROLE_DISPLAY_MAP } from "../../constants";
import type { TeamMemberRow, RoleRow } from "@/features/teams/types";
import type { Language } from "@/types/db";

interface MemberRowProps {
  member: TeamMemberRow;
  roles: RoleRow[];
  language: Language;
  currentUserId: string;
  callerRole: string | null;
  changingRoleId: string | null;
  onChangeRole: (memberId: string, newRoleId: string) => void;
  onRemove: (memberId: string, userName: string) => void;
}

export function MemberRow({
  member,
  roles,
  language,
  currentUserId,
  callerRole,
  changingRoleId,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  const t = useTranslation();

  const isSelf = member.userId === currentUserId;
  const canManage =
    callerRole === "ADMINISTRATOR" || callerRole === "TEAM_LEAD";
  const canChangeRole = canManage && callerRole === "ADMINISTRATOR" && !isSelf;
  const canRemove = canManage && !isSelf;

  return (
    <div className="grid grid-cols-[1fr_180px_120px_40px] gap-3 px-4 h-14 items-center border-b border-border-subtle last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          name={member.userName}
          src={member.userAvatar ?? undefined}
          size="sm"
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {member.userName}
            {isSelf && (
              <span className="text-xs text-muted-foreground ml-1.5">
                (you)
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {member.userEmail}
          </div>
        </div>
      </div>

      <div>
        {canChangeRole ? (
          <Select
            value={member.roleId}
            onChange={value => onChangeRole(member.id, value)}
            options={roles.map(r => ({
              value: r.id,
              label: t.teams[ROLE_DISPLAY_MAP[r.name] ?? "roleMember"],
            }))}
            disabled={changingRoleId === member.id}
          />
        ) : (
          <span className="text-sm text-foreground">
            {t.teams[ROLE_DISPLAY_MAP[member.roleName] ?? "roleMember"]}
          </span>
        )}
      </div>

      <span className="text-xs text-muted-foreground">
        {new Date(member.joinedAt).toLocaleDateString(
          language === "FA" ? "fa-IR" : "en-US",
          { month: "short", day: "numeric", year: "numeric" },
        )}
      </span>

      <div className="flex justify-end">
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            icon="x"
            onClick={() => onRemove(member.id, member.userName)}
            className="text-muted-foreground hover:text-red-500"
            aria-label={`${t.teams.removeMember}: ${member.userName}`}
          />
        )}
      </div>
    </div>
  );
}
