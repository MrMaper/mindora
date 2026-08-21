"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";
import { inviteMember } from "@/features/projects/actions";
import type {
  ProjectDetail,
  ProjectMemberRow,
  ProjectTaskRow,
} from "@/features/projects/types";

interface InviteUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}
import {
  ProjectTaskFilters,
  getProjectTaskStatusOptions,
  getProjectTaskPriorityOptions,
  getProjectTaskAssigneeOptions,
  getProjectTaskDefaultFilters,
  hasActiveProjectTaskFilters,
  filterProjectTasks,
  sortProjectTasks,
} from "@/components/ui-kit/forms/project-task-filters";
import { ProjectHeader } from "../ui/project-header";
import { ProjectTabs } from "../ui/project-tabs";
import { OverviewTab } from "../ui/overview-tab";
import { TaskFilters } from "../ui/task-filters";
import { TaskTable } from "../ui/task-table";
import { MembersTab } from "../ui/members-tab";
import { InviteMemberDrawer } from "../ui/invite-member-drawer";
import { RemoveMemberDialog } from "../ui/remove-member-dialog";
import { ChangeRoleDialog } from "../ui/change-role-dialog";

interface ProjectDetailCCProps {
  project: ProjectDetail;
  members: ProjectMemberRow[];
  tasks: ProjectTaskRow[];
  availableUsers: InviteUser[];
  currentUserId: string;
}

export function ProjectDetailCC({
  project,
  members,
  tasks,
  availableUsers,
  currentUserId,
}: ProjectDetailCCProps) {
  const t = useTranslation();
  const isOwner =
    members.find(m => m.userId === currentUserId)?.role === "OWNER";
  const isAdmin =
    members.find(m => m.userId === currentUserId)?.role === "ADMIN" || isOwner;

  const [activeTab, setActiveTab] = React.useState<
    "overview" | "tasks" | "members"
  >("overview");
  const [memberDrawerOpen, setMemberDrawerOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = React.useState<{
    id: string;
    currentRole: string;
  } | null>(null);
  const [newRole, setNewRole] = React.useState("MEMBER");

  const [taskFilters, setTaskFilters] = React.useState<ProjectTaskFilters>(
    getProjectTaskDefaultFilters(),
  );
  const [taskSearch, setTaskSearch] = React.useState("");

  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filteredTasks = sortProjectTasks(
    filterProjectTasks(tasks, taskFilters),
    taskFilters.sort,
    taskFilters.order,
  );

  const hasActiveTaskFilters = hasActiveProjectTaskFilters(taskFilters);

  const statusOptions = getProjectTaskStatusOptions(t);
  const priorityOptions = getProjectTaskPriorityOptions(t);
  const assigneeOptions = getProjectTaskAssigneeOptions(members, t);

  function handleTaskSearchChange(value: string) {
    setTaskSearch(value);
    setTaskFilters(prev => ({ ...prev, search: value }));
  }

  function handleTaskSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  function handleTaskFiltersChange(filter: Partial<ProjectTaskFilters>) {
    setTaskFilters(prev => ({ ...prev, ...filter }));
  }

  function handleTaskClearFilters() {
    setTaskFilters(getProjectTaskDefaultFilters());
    setTaskSearch("");
  }

  async function handleInviteMember(userId: string, role: string) {
    setInviteError(null);
    setInvitePending(true);

    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("role", role);

    const result = await inviteMember(project.id, fd);
    setInvitePending(false);

    if (!result.success) {
      setInviteError(result.error ?? "Failed to invite member.");
      return;
    }

    setMemberDrawerOpen(false);
    // Refresh the page to show the new member
    window.location.reload();
  }

  const [invitePending, setInvitePending] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  const handleRemoveMember = (member: ProjectMemberRow) => {
    if (member.userId === currentUserId) return;
    setRemoveTarget({ id: member.id, name: member.userName });
  };

  const handleChangeRole = (member: ProjectMemberRow) => {
    if (member.userId === currentUserId) return;
    setRoleChangeTarget({ id: member.id, currentRole: member.role });
    setNewRole(member.role);
  };

  const handleSaveRole = () => {
    setRoleChangeTarget(null);
    setNewRole("MEMBER");
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <ProjectHeader
        project={project}
        t={t}
        isAdmin={isAdmin}
        onInviteMember={() => setMemberDrawerOpen(true)}
      />

      {/* ── Tabs ── */}
      <ProjectTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        t={t}
        taskCount={project._count.tasks}
        memberCount={project._count.members}
      />

      {/* ── Tab Content ── */}
      {activeTab === "overview" && (
        <OverviewTab t={t} tasks={tasks} statusCounts={statusCounts} />
      )}

      {activeTab === "tasks" && (
        <>
          <TaskFilters
            t={t}
            filters={taskFilters}
            search={taskSearch}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            assigneeOptions={assigneeOptions}
            onSearchChange={handleTaskSearchChange}
            onSearchSubmit={handleTaskSearchSubmit}
            onFiltersChange={handleTaskFiltersChange}
            onClearFilters={handleTaskClearFilters}
            hasActiveFilters={hasActiveTaskFilters}
            currentUserRole={isAdmin ? "ADMIN" : "MEMBER"}
          />
          <TaskTable
            tasks={filteredTasks}
            t={t}
            onView={task => {
              /* TODO: implement view navigation */
            }}
            onEdit={task => {
              /* TODO: implement edit */
            }}
            onDelete={task => {
              /* TODO: implement delete */
            }}
            emptyMessage={t.projects.noTasks}
          />
        </>
      )}

      {activeTab === "members" && (
        <MembersTab
          t={t}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onInviteMember={() => setMemberDrawerOpen(true)}
          onRemoveMember={handleRemoveMember}
          onChangeRole={handleChangeRole}
        />
      )}

      {/* ── Invite Member Drawer ── */}
      <InviteMemberDrawer
        open={memberDrawerOpen}
        onClose={() => setMemberDrawerOpen(false)}
        t={t}
        availableUsers={availableUsers}
        currentUserId={currentUserId}
        onInvite={handleInviteMember}
        isPending={invitePending}
        error={inviteError}
      />

      {/* ── Remove Member Dialog ── */}
      <RemoveMemberDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        t={t}
        removeTarget={removeTarget}
        onConfirm={() => {
          setRemoveTarget(null);
        }}
      />

      {/* ── Change Role Dialog ── */}
      <ChangeRoleDialog
        open={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        t={t}
        currentRole={roleChangeTarget?.currentRole ?? ""}
        newRole={newRole}
        setNewRole={setNewRole}
        onSave={handleSaveRole}
      />
    </div>
  );
}
