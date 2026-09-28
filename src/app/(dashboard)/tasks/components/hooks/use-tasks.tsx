"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskSchema,
  updateTaskSchema,
  createLabelSchema,
} from "@/schemas/tasks";
import {
  createTask,
  updateTask,
  deleteTask,
  getTaskDetailAction,
} from "@/features/tasks/actions";
import { createLabel, deleteLabel } from "@/features/labels/actions";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateLabelInput,
} from "@/schemas/tasks";
import type { TaskRow, TaskDetail } from "@/features/tasks/types";
import { coerceLifeArea, dueDateToFormValue } from "@/lib/life";
import { useAreaBuckets } from "@/components/area-buckets-provider";

type DrawerMode = "none" | "create" | "edit";

export interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  area: string;
  label: string;
  sort: string;
  order: string;
  group: string;
}

export function useTasks(initialFilters: TaskFilters) {
  const router = useRouter();
  const areaIds = useAreaBuckets();

  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("none");
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);
  const [labelDialogOpen, setLabelDialogOpen] = React.useState(false);
  const [labelError, setLabelError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState(initialFilters.search);
  const [project, setProject] = React.useState(initialFilters.project);

  const createForm = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "BACKLOG",
      priority: "NONE",
      type: "TASK",
      assignedToId: "",
      dueDate: "",
      durationMinutes: "",
    },
  });

  const editForm = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "BACKLOG",
      priority: "NONE",
      type: "TASK",
      assignedToId: "",
      dueDate: "",
      durationMinutes: "",
      area: "LIFE",
      recurrence: "NONE",
    },
  });

  const labelForm = useForm<CreateLabelInput>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: { name: "", color: "#6366f1" },
  });

  function openCreate() {
    createForm.reset({
      title: "",
      description: "",
      status: "BACKLOG",
      priority: "NONE",
      type: "TASK",
      projectId: "",
      assignedToId: "",
      dueDate: "",
      durationMinutes: "",
      area: "LIFE",
      recurrence: "NONE",
    });
    // Default to life bucket after reset — set explicitly via AREA id in submit if empty
    createForm.setValue("projectId", areaIds.LIFE);
    createForm.setValue("area", "LIFE");
    setSelectedLabelIds([]);
    setActionError(null);
    setDrawerMode("create");
  }

  async function openEdit(task: TaskRow) {
    setEditingTaskId(task.id);
    setActiveTask(null);
    setActionError(null);
    setDrawerMode("edit");
    setIsLoadingDetail(true);

    const detail = await getTaskDetailAction(task.id);
    setIsLoadingDetail(false);
    if (!detail) {
      setActionError("Failed to load task.");
      return;
    }

    setActiveTask(detail);
    setSelectedLabelIds(detail.labels.map(l => l.id));
    editForm.reset({
      title: detail.title,
      description: detail.description ?? "",
      status: detail.status,
      priority: detail.priority,
      type: detail.type,
      projectId: detail.projectId ?? "",
      assignedToId: detail.assignedTo?.id ?? "",
      dueDate: dueDateToFormValue(detail.dueDate),
      durationMinutes:
        detail.durationMinutes && detail.durationMinutes > 0
          ? String(detail.durationMinutes)
          : "",
      area: coerceLifeArea(detail.area),
      recurrence: detail.recurrence ?? "NONE",
    });
  }

  function closeDrawer() {
    setDrawerMode("none");
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

  const onCreateSubmit = createForm.handleSubmit(data => {
    console.log(data);
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description ?? "");
      fd.append("status", data.status);
      fd.append("priority", data.priority);
      fd.append("type", "TASK");
      fd.append("projectId", data.projectId || areaIds.LIFE);
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
      fd.append("durationMinutes", data.durationMinutes ?? "");
      fd.append("area", data.area || "LIFE");
      fd.append("recurrence", data.recurrence ?? "NONE");
      fd.append("labelIds", JSON.stringify(selectedLabelIds));
      const result = await createTask(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to create task.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  const onEditSubmit = editForm.handleSubmit(data => {
    if (!editingTaskId) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description ?? "");
      fd.append("status", data.status);
      fd.append("priority", data.priority);
      fd.append("type", "TASK");
      fd.append("projectId", data.projectId ?? "");
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
      fd.append("durationMinutes", data.durationMinutes ?? "");
      fd.append("area", data.area ?? "LIFE");
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

  function onDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.success)
        setActionError(result.error ?? "Failed to delete task.");
      else {
        closeDrawer();
        router.refresh();
      }
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search });
  }

  function applyFilters(next: Partial<TaskFilters>) {
    const merged = { ...initialFilters, search, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.status) params.set("status", merged.status);
    if (merged.priority) params.set("priority", merged.priority);
    if (merged.assignee) params.set("assignee", merged.assignee);
    if (merged.area) params.set("area", merged.area);
    if (merged.project) params.set("project", merged.project);
    if (merged.label) params.set("label", merged.label);
    if (merged.sort) params.set("sort", merged.sort);
    if (merged.order) params.set("order", merged.order);
    if (merged.group) params.set("group", merged.group);
    params.set("page", "1");
    router.push(`/tasks?${params.toString()}`);
  }

  function changeSort(field: string) {
    const nextOrder =
      initialFilters.sort === field && initialFilters.order === "asc"
        ? "desc"
        : "asc";
    applyFilters({ sort: field, order: nextOrder });
  }

  function setProjectFilter(value: string) {
    setProject(value);
    applyFilters({ project: value });
  }

  function onLabelDialogOpen() {
    labelForm.reset({ name: "", color: "#6366f1" });
    setLabelError(null);
    setLabelDialogOpen(true);
  }

  const onCreateLabelSubmit = labelForm.handleSubmit(data => {
    setLabelError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("color", data.color);
      const result = await createLabel(fd);
      if (!result.success) {
        setLabelError(result.error ?? "Failed to create label.");
        return;
      }
      labelForm.reset({ name: "", color: "#6366f1" });
      router.refresh();
    });
  });

  function onDeleteLabel(labelId: string) {
    startTransition(async () => {
      await deleteLabel(labelId);
      setSelectedLabelIds(prev => prev.filter(id => id !== labelId));
      router.refresh();
    });
  }

  return {
    drawerMode,
    activeTask,
    isLoadingDetail,
    deleteTarget,
    setDeleteTarget,
    actionError,
    setActionError,
    isPending,
    search,
    setSearch,
    project,
    setProject: setProjectFilter,
    createForm,
    editForm,
    openCreate,
    openEdit,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
    onDeleteConfirm,
    onSearchSubmit,
    applyFilters,
    changeSort,
    selectedLabelIds,
    toggleLabel,
    labelDialogOpen,
    setLabelDialogOpen,
    onLabelDialogOpen,
    labelForm,
    labelError,
    onCreateLabelSubmit,
    onDeleteLabel,
  };
}
