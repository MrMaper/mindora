"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import {
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/features/projects/actions";
import { deleteTask } from "@/features/tasks/actions";
import type {
  ProjectDetail,
  ProjectMemberRow,
  ProjectTaskRow,
} from "@/features/projects/types";
import {
  getProjectTaskStatusOptions,
  getProjectTaskPriorityOptions,
  getProjectTaskAssigneeOptions,
  getProjectTaskDefaultFilters,
  hasActiveProjectTaskFilters,
  filterProjectTasks,
  sortProjectTasks,
  type ProjectTaskFilters,
} from "@/components/ui-kit/forms/project-task-filters";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import { ProjectHeader } from "../ui/project-header";
import { ProjectTabs } from "../ui/project-tabs";
import { OverviewTab } from "../ui/overview-tab";
import { TaskFilters } from "../ui/task-filters";
import { TaskTable } from "../ui/task-table";
import { MembersTab } from "../ui/members-tab";
import { InviteMemberDrawer } from "../ui/invite-member-drawer";
import { RemoveMemberDialog } from "../ui/remove-member-dialog";
import { ChangeRoleDialog } from "../ui/change-role-dialog";

interface InviteUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

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
  const router = useRouter();

  const membership = members.find(m => m.userId === currentUserId);
  const isAdmin =
    membership?.role === "ADMIN" || membership?.role === "OWNER";

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
  const [deleteTaskTarget, setDeleteTaskTarget] =
    React.useState<ProjectTaskRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [invitePending, setInvitePending] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [taskFilters, setTaskFilters] = React.useState<ProjectTaskFilters>(
    getProjectTaskDefaultFilters(),
  );
  const [taskSearch, setTaskSearch] = React.useState("");

  const statusCounts = React.useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [tasks],
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

  function openTaskOnList(task?: ProjectTaskRow) {
    const params = new URLSearchParams();
    params.set("project", project.id);
    if (task?.title) params.set("search", task.title);
    router.push(`/tasks?${params.toString()}`);
  }

  function openBoardForEdit(task?: ProjectTaskRow) {
    if (project.area === "PHD") {
      router.push(`/research?project=${project.id}`);
      return;
    }
    if (project.area === "LANG") {
      router.push(`/language?project=${project.id}`);
      return;
    }
    const params = new URLSearchParams();
    params.set("project", project.id);
    if (task?.title) params.set("search", task.title);
    router.push(`/kanban?${params.toString()}`);
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
      setInviteError(result.error ?? t.projects.memberActionFailed);
      return;
    }
    setMemberDrawerOpen(false);
    router.refresh();
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    startTransition(async () => {
      const result = await removeMember(removeTarget.id);
      setRemoveTarget(null);
      if (!result.success) {
        setActionError(result.error ?? t.projects.memberActionFailed);
        return;
      }
      router.refresh();
    });
  }

  function handleSaveRole() {
    if (!roleChangeTarget) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("role", newRole);
      const result = await updateMemberRole(roleChangeTarget.id, fd);
      setRoleChangeTarget(null);
      setNewRole("MEMBER");
      if (!result.success) {
        setActionError(result.error ?? t.projects.memberActionFailed);
        return;
      }
      router.refresh();
    });
  }

  function handleDeleteTaskConfirm() {
    if (!deleteTaskTarget) return;
    startTransition(async () => {
      const result = await deleteTask(deleteTaskTarget.id);
      setDeleteTaskTarget(null);
      if (!result.success) {
        setActionError(result.error ?? t.common.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <ProjectHeader
        project={project}
        isAdmin={!!isAdmin}
        onInviteMember={() => {
          setInviteError(null);
          setMemberDrawerOpen(true);
        }}
      />

      {actionError ? (
        <div
          className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <ResolvedValidationText text={actionError} />
        </div>
      ) : null}

      <ProjectTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskCount={project._count.tasks}
        memberCount={project._count.members}
      />

      {activeTab === "overview" && (
        <OverviewTab
          tasks={tasks}
          statusCounts={statusCounts}
          onOpenTasks={() => setActiveTab("tasks")}
          onViewTask={task => openTaskOnList(task)}
        />
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
            onSearchChange={value => {
              setTaskSearch(value);
              setTaskFilters(prev => ({ ...prev, search: value }));
            }}
            onSearchSubmit={e => e.preventDefault()}
            onFiltersChange={filter =>
              setTaskFilters(prev => ({ ...prev, ...filter }))
            }
            onClearFilters={() => {
              setTaskFilters(getProjectTaskDefaultFilters());
              setTaskSearch("");
            }}
            hasActiveFilters={hasActiveTaskFilters}
            currentUserRole={isAdmin ? "ADMIN" : "MEMBER"}
          />
          <TaskTable
            tasks={filteredTasks}
            onView={task => openTaskOnList(task)}
            onEdit={task => openBoardForEdit(task)}
            onDelete={task => setDeleteTaskTarget(task)}
            emptyMessage={t.projects.noTasks}
          />
        </>
      )}

      {activeTab === "members" && (
        <MembersTab
          members={members}
          currentUserId={currentUserId}
          isAdmin={!!isAdmin && availableUsers.length > 0}
          onInviteMember={() => {
            setInviteError(null);
            setMemberDrawerOpen(true);
          }}
          onRemoveMember={member => {
            if (member.userId === currentUserId) return;
            setRemoveTarget({ id: member.id, name: member.userName });
          }}
          onChangeRole={member => {
            if (member.userId === currentUserId) return;
            setRoleChangeTarget({ id: member.id, currentRole: member.role });
            setNewRole(member.role);
          }}
        />
      )}

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

      <RemoveMemberDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        t={t}
        removeTarget={removeTarget}
        onConfirm={handleRemoveConfirm}
      />

      <ChangeRoleDialog
        open={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        t={t}
        currentRole={roleChangeTarget?.currentRole ?? ""}
        newRole={newRole}
        setNewRole={setNewRole}
        onSave={handleSaveRole}
      />

      <Dialog
        open={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        title={t.projects.deleteTask}
        description={
          deleteTaskTarget
            ? `${t.projects.deleteTaskConfirmPrefix} «${deleteTaskTarget.title}» ${t.projects.deleteTaskConfirmSuffix}`
            : ""
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteTaskTarget(null)}
              disabled={isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={isPending}
              onClick={handleDeleteTaskConfirm}
              disabled={!deleteTaskTarget || isPending}
            >
              {t.common.delete}
            </Button>
          </>
        }
      />
    </div>
  );
}
