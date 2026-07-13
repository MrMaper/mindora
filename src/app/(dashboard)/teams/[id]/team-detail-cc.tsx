"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { useTeamDetail } from "./use-team-detail";
import { getTranslations, type Translations } from "@/i18n";
import type { TeamDetail, RoleRow, AvailableUserRow } from "@/features/teams/types";
import type { Language } from "@/types/db";

interface TeamDetailCCProps {
  team: TeamDetail;
  roles: RoleRow[];
  availableUsers: AvailableUserRow[];
  callerRole: string | null;
  currentUserId: string;
  language: Language;
}

const ROLE_DISPLAY_MAP: Record<string, keyof Translations["teams"]> = {
  ADMINISTRATOR: "roleAdministrator",
  TEAM_LEAD: "roleTeamLead",
  MEMBER: "roleMember",
};

const ROLE_ORDER: Record<string, number> = {
  ADMINISTRATOR: 0,
  TEAM_LEAD: 1,
  MEMBER: 2,
};

export function TeamDetailCC({
  team: initialTeam,
  roles,
  availableUsers,
  callerRole,
  currentUserId,
  language,
}: TeamDetailCCProps) {
  const u = useTeamDetail(initialTeam, roles, availableUsers);
  const t = getTranslations(language);

  const canManage =
    callerRole === "ADMINISTRATOR" || callerRole === "TEAM_LEAD";

  const sortedMembers = [...u.team.members].sort(
    (a, b) => (ROLE_ORDER[a.roleName] ?? 99) - (ROLE_ORDER[b.roleName] ?? 99)
  );

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {u.team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {u.team.name}
              </h1>
              {u.team.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {u.team.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="users" size={13} />
              {u.team.memberCount} {t.teams.members.toLowerCase()}
            </span>
            <Badge tone={u.team.status === "ACTIVE" ? "success" : "neutral"}>
              {u.team.status === "ACTIVE" ? t.teams.active : t.teams.archived}
            </Badge>
          </div>
        </div>

        {canManage && (
          <Button variant="primary" icon="plus" onClick={u.openInvite}>
            {t.teams.inviteMember}
          </Button>
        )}
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {u.actionError && (
        <div
          className="auth-card__alert auth-card__alert--error mb-4"
          role="alert"
        >
          {u.actionError}
        </div>
      )}

      {/* ── Members list ────────────────────────────────────────────────── */}
      <div className="border border-border-default rounded-card overflow-hidden">
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_180px_120px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-sunken"
        >
          <span className="text-2xs font-semibold uppercase tracking-caps text-tertiary">
            {t.teams.member}
          </span>
          <span className="text-2xs font-semibold uppercase tracking-caps text-tertiary">
            {t.teams.roles}
          </span>
          <span className="text-2xs font-semibold uppercase tracking-caps text-tertiary">
            {t.teams.memberSince}
          </span>
          <span />
        </div>

        {/* Rows */}
        {sortedMembers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t.teams.noMembers}
          </div>
        ) : (
          sortedMembers.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canChangeRole =
              canManage && callerRole === "ADMINISTRATOR" && !isSelf;
            const canRemove = canManage && !isSelf;

            return (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_180px_120px_40px] gap-3 px-4 h-14 items-center border-b border-border-subtle last:border-b-0"
              >
                {/* Name + avatar */}
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

                {/* Role — inline select for admins */}
                <div>
                  {canChangeRole ? (
                    <Select
                      value={member.roleId}
                      onChange={(value) => u.onChangeRole(member.id, value)}
                      options={roles.map((r) => ({
                        value: r.id,
                        label: t.teams[ROLE_DISPLAY_MAP[r.name] ?? "roleMember"],
                      }))}
                      disabled={u.changingRoleId === member.id}
                    />
                  ) : (
                    <span className="text-sm text-foreground">
                      {t.teams[ROLE_DISPLAY_MAP[member.roleName] ?? "roleMember"]}
                    </span>
                  )}
                </div>

                {/* Joined date */}
                <span className="text-xs text-muted-foreground">
                  {new Date(member.joinedAt).toLocaleDateString(
                    language === "FA" ? "fa-IR" : "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </span>

                {/* Actions */}
                <div className="flex justify-end">
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="x"
                      onClick={() =>
                        u.setRemoveTarget({
                          memberId: member.id,
                          userName: member.userName,
                        })
                      }
                      className="text-muted-foreground hover:text-red-500"
                      aria-label={`${t.teams.removeMember}: ${member.userName}`}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Invite member drawer ────────────────────────────────────────── */}
      <Drawer
        open={u.inviteOpen}
        onClose={u.closeInvite}
        header={
          <span className="text-sm font-semibold text-foreground">
            {t.teams.inviteMember}
          </span>
        }
        footer={
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              onClick={u.closeInvite}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onInviteSubmit}
            >
              {t.teams.invite}
            </Button>
          </div>
        }
      >
        <div className="p-4 flex flex-col gap-4">
          {u.actionError && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.actionError}
            </div>
          )}

          {u.availableUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t.teams.noMembers}
            </p>
          ) : (
            <>
              <Select
                label={t.teams.selectUser}
                value={u.selectedUserId}
                onChange={u.setSelectedUserId}
                options={[
                  { value: "", label: t.teams.selectUser },
                  ...u.availableUsers.map((usr) => ({
                    value: usr.id,
                    label: `${usr.name} (${usr.email})`,
                  })),
                ]}
              />
              <Select
                label={t.teams.selectRole}
                value={u.selectedRoleId}
                onChange={u.setSelectedRoleId}
                options={u.roles.map((r) => ({
                  value: r.id,
                  label: t.teams[ROLE_DISPLAY_MAP[r.name] ?? "roleMember"],
                }))}
              />
            </>
          )}
        </div>
      </Drawer>

      {/* ── Remove confirmation dialog ──────────────────────────────────── */}
      <Dialog
        open={!!u.removeTarget}
        onClose={() => u.setRemoveTarget(null)}
        title={t.teams.confirmRemoveTitle}
        description={`${t.teams.confirmRemovePrefix} ${u.removeTarget?.userName} ${t.teams.confirmRemoveSuffix}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => u.setRemoveTarget(null)}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={u.isPending}
              onClick={u.onRemoveConfirm}
            >
              {t.teams.removeMember}
            </Button>
          </>
        }
      />
    </>
  );
}