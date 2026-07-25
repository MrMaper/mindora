"use client";

import * as React from "react";
import { useTranslation } from "@/i18n/provider";
import { MemberRow } from "./member-row";
import { ROLE_ORDER } from "../../constants";
import type { TeamMemberRow, RoleRow } from "@/features/teams/types";
import type { Language } from "@/types/db";

interface TeamDetailMembersProps {
  members: TeamMemberRow[];
  roles: RoleRow[];
  language: Language;
  currentUserId: string;
  callerRole: string | null;
  changingRoleId: string | null;
  onChangeRole: (memberId: string, newRoleId: string) => void;
  onRemove: (memberId: string, userName: string) => void;
}

export function TeamDetailMembers({
  members,
  roles,
  language,
  currentUserId,
  callerRole,
  changingRoleId,
  onChangeRole,
  onRemove,
}: TeamDetailMembersProps) {
  const t = useTranslation();

  const sortedMembers = [...members].sort(
    (a, b) => (ROLE_ORDER[a.roleName] ?? 99) - (ROLE_ORDER[b.roleName] ?? 99),
  );

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_180px_120px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-bg-sunken">
        <span className="text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t.teams.member}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t.teams.roles}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t.teams.memberSince}
        </span>
        <span />
      </div>

      {sortedMembers.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t.teams.noMembers}
        </div>
      ) : (
        sortedMembers.map(member => (
          <MemberRow
            key={member.id}
            member={member}
            roles={roles}
            language={language}
            currentUserId={currentUserId}
            callerRole={callerRole}
            changingRoleId={changingRoleId}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}
