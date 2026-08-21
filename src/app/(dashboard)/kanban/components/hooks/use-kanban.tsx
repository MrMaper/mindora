"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { updateTaskSchema } from "@/schemas/tasks";
import { updateTask, getTaskDetailAction } from "@/features/tasks/actions";
import { moveTask } from "@/features/kanban/actions";
import { BOARD_STATUSES } from "@/features/kanban/types";
import type { BoardColumns, BoardStatus } from "@/features/kanban/types";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { TaskRow, TaskDetail } from "@/features/tasks/types";

interface KanbanFilters {
  search: string;
  project: string;
  assignee: string;
  label: string;
  priority: string;
}

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function isStatus(id: string): id is BoardStatus {
  return (BOARD_STATUSES as string[]).includes(id);
}

export function useKanban(initialColumns: BoardColumns, initialFilters: KanbanFilters) {
  const router = useRouter();

  const [prevInitialColumns, setPrevInitialColumns] = React.useState(initialColumns);
  const [columns, setColumns] = React.useState<BoardColumns>(initialColumns);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  const [activeTaskCard, setActiveTaskCard] = React.useState<TaskRow | null>(null);
  const [search, setSearch] = React.useState(initialFilters.search);
  const [project, setProject] = React.useState(initialFilters.project);

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
    },
  }) as import("react-hook-form").UseFormReturn<UpdateTaskInput>;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const collisionDetection = closestCorners;

  function findContainer(id: string): BoardStatus | null {
    if (isStatus(id)) return id;
    for (const status of BOARD_STATUSES) {
      if (columns[status].some(t => t.id === id)) return status;
    }
    return null;
  }

  function onDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const status = findContainer(id);
    if (!status) return;
    setActiveTaskCard(columns[status].find(t => t.id === id) ?? null);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeStatus = findContainer(activeId);
    const overStatus = findContainer(overId);
    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setColumns(prev => {
      const activeItems = prev[activeStatus];
      const overItems = prev[overStatus];
      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      if (activeIndex === -1) return prev;
      const overIndex = overItems.findIndex(t => t.id === overId);
      const moved = { ...activeItems[activeIndex], status: overStatus };
      const newActiveItems = activeItems.filter(t => t.id !== activeId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      const newOverItems = [...overItems.slice(0, insertAt), moved, ...overItems.slice(insertAt)];
      return { ...prev, [activeStatus]: newActiveItems, [overStatus]: newOverItems };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTaskCard(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeStatus = findContainer(activeId);
    if (!activeStatus) return;

    const overStatus = findContainer(overId) ?? activeStatus;
    let resultingColumns = columns;

    if (activeStatus === overStatus) {
      const items = columns[activeStatus];
      const oldIndex = items.findIndex(t => t.id === activeId);
      const newIndex = items.findIndex(t => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        resultingColumns = { ...columns, [activeStatus]: arrayMove(items, oldIndex, newIndex) };
        setColumns(resultingColumns);
      }
    }

    const orderedIds = resultingColumns[overStatus].map(t => t.id);
    startTransition(async () => {
      const result = await moveTask({ taskId: activeId, toStatus: overStatus, orderedIds });
      if (!result.success) router.refresh();
    });
  }

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
      dueDate: toDateInputValue(detail.dueDate),
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
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  }

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
      fd.append("projectId", data.projectId ?? "");
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

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search });
  }

  function applyFilters(next: Partial<KanbanFilters>) {
    const merged = { ...initialFilters, search, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.assignee) params.set("assignee", merged.assignee);
    if (merged.label) params.set("label", merged.label);
    if (merged.priority) params.set("priority", merged.priority);
    if (merged.project) params.set("project", merged.project);
    router.push(`/kanban?${params.toString()}`);
  }

  function setProjectFilter(value: string) {
    setProject(value);
    applyFilters({ project: value });
  }

  return {
    columns,
    sensors,
    collisionDetection,
    activeTaskCard,
    onDragStart,
    onDragOver,
    onDragEnd,
    search,
    setSearch,
    project,
    setProject: setProjectFilter,
    onSearchSubmit,
    applyFilters,
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
  };
}
