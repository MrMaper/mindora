"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTaskSchema } from "@/schemas/tasks";
import { updateTask, getTaskDetailAction } from "@/features/tasks/actions";
import { coerceLifeArea, dueDateToFormValue } from "@/lib/life";
import { useAreaBuckets } from "@/components/area-buckets-provider";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { TaskRow, TaskDetail } from "@/features/tasks/types";
import { toFormStatus } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";

function resolveArea(task: TaskRow | TaskDetail): LifeArea {
  return coerceLifeArea(task.area);
}

export function useLifeTaskEdit() {
  const router = useRouter();
  const areaIds = useAreaBuckets();

  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);

  const editForm = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "BACKLOG",
      priority: "NONE",
      type: "TASK",
      projectId: "",
      assignedToId: "",
      dueDate: "",
      durationMinutes: "",
      waitingOn: "",
      area: "LIFE",
      recurrence: "NONE",
    },
  }) as import("react-hook-form").UseFormReturn<UpdateTaskInput>;

  async function openTask(task: TaskRow) {
    setEditingTaskId(task.id);
    setActiveTask(null);
    setActionError(null);
    setIsLoadingDetail(true);

    const detail = await getTaskDetailAction(task.id);
    setIsLoadingDetail(false);
    if (!detail) {
      setActionError("Failed to load task.");
      return;
    }

    const area = resolveArea(detail);
    setActiveTask(detail);
    setSelectedLabelIds(detail.labels.map(l => l.id));
    editForm.reset({
      title: detail.title,
      description: detail.description ?? "",
      status: toFormStatus(detail.status),
      priority: detail.priority,
      type: detail.type,
      projectId: detail.projectId ?? areaIds[area],
      assignedToId: detail.assignedTo?.id ?? "",
      dueDate: dueDateToFormValue(detail.dueDate),
      durationMinutes:
        detail.durationMinutes && detail.durationMinutes > 0
          ? String(detail.durationMinutes)
          : "",
      waitingOn: detail.waitingOn ? "1" : "",
      area,
      recurrence: detail.recurrence ?? "NONE",
    });
  }

  function closeDrawer() {
    setEditingTaskId(null);
    setActiveTask(null);
    setActionError(null);
    setSelectedLabelIds([]);
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId],
    );
  }

  const onEditSubmit = editForm.handleSubmit(data => {
    if (!editingTaskId) return;
    setActionError(null);
    startTransition(async () => {
      const area = (data.area ?? "LIFE") as LifeArea;
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description ?? "");
      fd.append("status", data.status);
      fd.append("priority", data.priority);
      fd.append("type", "TASK");
      fd.append("projectId", data.projectId || areaIds[area]);
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
      fd.append("durationMinutes", data.durationMinutes ?? "");
      fd.append("waitingOn", data.waitingOn === "1" || data.waitingOn === "true" ? "1" : "");
      fd.append("area", area);
      fd.append("recurrence", data.recurrence ?? "NONE");
      fd.append("labelIds", JSON.stringify(selectedLabelIds));
      const result = await updateTask(editingTaskId, fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update task.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  function syncDueFromCalendar(
    taskId: string,
    dueDate: Date,
    durationMinutes: number | null,
  ) {
    if (editingTaskId !== taskId) return;
    editForm.setValue("dueDate", dueDateToFormValue(dueDate));
    editForm.setValue(
      "durationMinutes",
      durationMinutes && durationMinutes > 0 ? String(durationMinutes) : "",
    );
    setActiveTask(prev =>
      prev && prev.id === taskId
        ? { ...prev, dueDate, durationMinutes }
        : prev,
    );
  }

  return {
    editingTaskId,
    activeTask,
    isLoadingDetail,
    actionError,
    isPending,
    editForm,
    selectedLabelIds,
    toggleLabel,
    openTask,
    closeDrawer,
    onEditSubmit,
    syncDueFromCalendar,
  };
}
