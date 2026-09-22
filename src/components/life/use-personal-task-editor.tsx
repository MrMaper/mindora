"use client";

import { EditTaskDrawer } from "@/app/(dashboard)/kanban/components/ui/edit-task-drawer";
import { useTranslation } from "@/i18n/provider";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/features/tasks/types";
import { useLifeTaskEdit } from "@/features/life/use-life-task-edit";
import type { TaskRow } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";

export function usePersonalTaskEditor(opts: {
  users: UserRow[];
  labels: LabelRow[];
  userProjects: ProjectRow[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const t = useTranslation();
  const edit = useLifeTaskEdit();

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...opts.users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const statusFieldOptions = STATUS_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));

  const drawer = (
    <EditTaskDrawer
      open={!!edit.editingTaskId}
      onClose={edit.closeDrawer}
      isPending={edit.isPending}
      isLoadingDetail={edit.isLoadingDetail}
      actionError={edit.actionError}
      control={edit.editForm.control}
      setValue={edit.editForm.setValue}
      labels={opts.labels}
      selectedLabelIds={edit.selectedLabelIds}
      onLabelToggle={edit.toggleLabel}
      activeTask={edit.activeTask}
      users={opts.users}
      projects={opts.userProjects}
      currentUserId={opts.currentUserId}
      currentUserRole={opts.currentUserRole}
      onSubmit={edit.onEditSubmit}
      statusFieldOptions={statusFieldOptions}
      priorityFieldOptions={priorityFieldOptions}
      userOptions={userOptions}
      preset="life"
    />
  );

  return {
    openTask: (task: TaskRow) => void edit.openTask(task),
    drawer,
  };
}
