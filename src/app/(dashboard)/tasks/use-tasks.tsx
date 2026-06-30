"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, updateTaskSchema, createLabelSchema } from "@/schemas/tasks";
import {
  createTask,
  updateTask,
  deleteTask,
  getTaskDetailAction,
} from "@/features/tasks/actions";
import { createLabel, deleteLabel } from "@/features/labels/actions";
import type { CreateTaskInput, UpdateTaskInput, CreateLabelInput } from "@/schemas/tasks";
import type { TaskRow, TaskDetail } from "@/features/tasks/types";

type DrawerMode = "none" | "create" | "edit";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  sort: string;
  order: string;
}

export function useTasks(initialFilters: TaskFilters) {
  const router = useRouter();

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
      assignedToId: "",
      dueDate: "",
    });
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
      assignedToId: detail.assignedTo?.id ?? "",
      dueDate: toDateInputValue(detail.dueDate),
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
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  }

  const onCreateSubmit = createForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description ?? "");
      fd.append("status", data.status);
      fd.append("priority", data.priority);
      fd.append("type", data.type);
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
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
      fd.append("type", data.type);
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
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
      if (!result.success) setActionError(result.error ?? "Failed to delete task.");
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
    if (merged.sort) params.set("sort", merged.sort);
    if (merged.order) params.set("order", merged.order);
    params.set("page", "1");
    router.push(`/tasks?${params.toString()}`);
  }

  function changeSort(field: string) {
    const nextOrder =
      initialFilters.sort === field && initialFilters.order === "asc" ? "desc" : "asc";
    applyFilters({ sort: field, order: nextOrder });
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
