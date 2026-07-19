"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { getTranslations } from "@/i18n";
import type { ProjectDetail, ProjectMemberRow, ProjectTaskRow } from "@/features/projects/types";
import type { Language } from "@/types/db";

interface ProjectDetailCCProps {
  project: ProjectDetail;
  members: ProjectMemberRow[];
  tasks: ProjectTaskRow[];
  currentUserId: string;
  language: Language;
}

const STATUS_BADGE_TONE: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  BACKLOG: "neutral",
  TODO: "info",
  IN_PROGRESS: "warning",
  REVIEW: "warning",
  TESTING: "info",
  DONE: "success",
  BLOCKED: "error",
};

const PRIORITY_ICON: Record<string, string> = {
  URGENT: "alert-triangle",
  HIGH: "arrow-up",
  MEDIUM: "minus",
  LOW: "arrow-down",
  NONE: "circle",
};

const ROLE_DISPLAY: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function ProjectDetailCC({
  project,
  members,
  tasks,
  currentUserId,
  language,
}: ProjectDetailCCProps) {
  const t = getTranslations(language);
  const isOwner = members.find((m) => m.userId === currentUserId)?.role === "OWNER";
  const isAdmin = members.find((m) => m.userId === currentUserId)?.role === "ADMIN" || isOwner;

  const [activeTab, setActiveTab] = React.useState<"overview" | "tasks" | "members">("overview");
  const [memberDrawerOpen, setMemberDrawerOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("MEMBER");
  const [removeTarget, setRemoveTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = React.useState<{ id: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = React.useState("MEMBER");
  const [isPending, startTransition] = React.useTransition();

  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function handleInviteMember() {
    if (!selectedUserId || !selectedRole) return;
    setMemberDrawerOpen(false);
    setSelectedUserId("");
    setSelectedRole("MEMBER");
  }

  const handleRemoveMember = (member: typeof members[0]) => {
    if (member.userId === currentUserId) return;
    setRemoveTarget({ id: member.id, name: member.userName });
  };

  const handleChangeRole = (member: typeof members[0]) => {
    if (member.userId === currentUserId) return;
    setRoleChangeTarget({ id: member.id, currentRole: member.role });
    setNewRole(member.role);
  };

  const handleSaveRole = () => {
    if (!roleChangeTarget) return;
    setRoleChangeTarget(null);
    setNewRole("MEMBER");
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === "FA" ? "fa-IR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-semibold text-base">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground truncate">{project.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="users" size={13} />
                  {project._count.members} {project._count.members === 1 ? t.projects.member : t.projects.members}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="check-square" size={13} />
                  {project._count.tasks} {project._count.tasks === 1 ? t.projects.task : t.projects.tasks}
                </span>
                <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
                  {project.status === "ACTIVE" ? t.projects.active : t.projects.archived}
                </Badge>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button variant="primary" icon="plus" onClick={() => setMemberDrawerOpen(true)}>
              {t.projects.inviteMember}
            </Button>
          )}
        </div>

        {project.description && (
          <p className="text-base text-muted-foreground max-w-3xl">{project.description}</p>
        )}

        {/* ── Tabs ── */}
        <div className="border-b border-border-default">
          <nav className="flex gap-6 px-1" aria-label="Project sections">
            {[
              { id: "overview", label: t.projects.overview, count: project._count.tasks },
              { id: "tasks", label: t.projects.tasks, count: project._count.tasks },
              { id: "members", label: t.projects.members, count: project._count.members },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Cards */}
            {["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE", "BLOCKED"].map((status) => (
              <div
                key={status}
                className="bg-card border border-border-default rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">
                    {t.tasks[status.toLowerCase()]}
                  </span>
                  <Icon name={PRIORITY_ICON[status] || "square"} size={16} className="text-tertiary" />
                </div>
                <div className="text-3xl font-bold text-foreground">{statusCounts[status] || 0}</div>
              </div>
            ))}

            {/* Progress */}
            <div className="md:col-span-2 lg:col-span-3 bg-card border border-border-default rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">{t.projects.progress}</h3>
              <div className="space-y-4">
                {[
                  { status: "DONE", label: t.tasks.done, tone: "success" as const },
                  { status: "IN_PROGRESS", label: t.tasks.inProgress, tone: "warning" as const },
                  { status: "REVIEW", label: t.tasks.review, tone: "info" as const },
                  { status: "TODO", label: t.tasks.todo, tone: "neutral" as const },
                ].map((item) => {
                  const count = statusCounts[item.status] || 0;
                  const total = tasks.length || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <Badge tone={item.tone} className="w-24 text-xs">{item.label}</Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: `var(--color-${item.tone})` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.projects.tasks}</h3>
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onChange={() => {}}
                  options={[
                    { value: "", label: t.tasks.allStatuses },
                    ...["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE", "BLOCKED"].map((s) => ({
                      value: s,
                      label: t.tasks[s.toLowerCase()],
                    })),
                  ]}
                  className="w-40"
                />
              </div>
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Icon name="check-square" size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p>{t.projects.noTasks}</p>
              </div>
            ) : (
              <div className="border border-border-default rounded-xl overflow-hidden">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-muted/50"
                  >
                    <Badge tone={STATUS_BADGE_TONE[task.status]}>
                      {t.tasks[task.status.toLowerCase()]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{task.title}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name={PRIORITY_ICON[task.priority] || "circle"} size={10} />
                          {t.tasks[task.priority.toLowerCase()]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="git-branch" size={10} />
                          {t.tasks[task.type.toLowerCase()]}
                        </span>
                      </div>
                    </div>
                    {task.assignee && (
                      <Avatar name={task.assignee.name} src={task.assignee.avatar} size="sm" />
                    )}
                  </div>
                ))}
              </div>
          </div>
        }

        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.projects.members}</h3>
              {isAdmin && (
                <Button variant="primary" icon="plus" size="sm" onClick={() => setMemberDrawerOpen(true)}>
                  {t.projects.inviteMember}
                </Button>
              )}
            </div>
            <div className="border border-border-default rounded-xl overflow-hidden">
              {members.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Icon name="users" size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                  <p>{t.projects.noMembers}</p>
                </div>
              ) : (
                members.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-muted/50"
                    >
                      <Avatar name={member.userName} src={member.userAvatar} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{member.userName}</span>
                          {isCurrentUser && (
                            <Badge tone="info" className="text-xs">{t.common.you}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.userEmail}</div>
                      </div>
                      <Badge tone={member.role === "OWNER" ? "success" : member.role === "ADMIN" ? "warning" : "neutral"}>
                        {ROLE_DISPLAY[member.role] || member.role}
                      </Badge>
                      {isAdmin && !isCurrentUser && (
                        <Menu
                          trigger={
                            <IconButton icon="more-horizontal" size="sm" aria-label={t.common.actions} />
                          }
                          align="end"
                          items={[
                            {
                              label: t.projects.changeRole,
                              icon: "user-cog",
                              onClick: () => handleChangeRole(member),
                            },
                            { divider: true },
                            {
                              label: t.projects.removeMember,
                              icon: "user-minus",
                              danger: true,
                              onClick: () => handleRemoveMember(member),
                            },
                          ]}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Invite Member Drawer ── */}
        <Drawer
          open={memberDrawerOpen}
          onClose={() => setMemberDrawerOpen(false)}
          header={<span className="text-sm font-semibold text-foreground">{t.projects.inviteMember}</span>}
          footer={
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={() => setMemberDrawerOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button variant="primary" onClick={handleInviteMember} disabled={!selectedUserId || !selectedRole}>
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
                ...members.map((m) => ({ value: m.userId, label: `${m.userName} (${m.userEmail})` })),
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

        {/* ── Remove Member Dialog ── */}
        <Dialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          title={t.projects.confirmRemoveTitle}
          description={`${t.projects.confirmRemovePrefix} ${removeTarget?.name} ${t.projects.confirmRemoveSuffix}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
                {t.common.cancel}
              </Button>
              <Button variant="danger" onClick={() => { /* call action */ setRemoveTarget(null); }}>
                {t.projects.removeMember}
              </Button>
            </>
          }
        />

        {/* ── Change Role Dialog ── */}
        <Dialog
          open={!!roleChangeTarget}
          onClose={() => setRoleChangeTarget(null)}
          title={t.projects.changeRole}
          description={`${t.projects.confirmRemovePrefix} ${t.projects.confirmRemoveSuffix}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRoleChangeTarget(null)}>
                {t.common.cancel}
              </Button>
              <Button variant="primary" onClick={handleSaveRole}>
                {t.common.save}
              </Button>
            </>
          }
        >
          <div className="p-4">
            <Select
              label={t.projects.selectRole}
              value={newRole}
              onChange={setNewRole}
              options={[
                { value: "OWNER", label: t.projects.roleOwner },
                { value: "ADMIN", label: t.projects.roleAdmin },
                { value: "MEMBER", label: t.projects.roleMember },
                { value: "VIEWER", label: t.projects.roleViewer },
              ]}
            />
          </div>
        </Dialog>
      </div>
    }
