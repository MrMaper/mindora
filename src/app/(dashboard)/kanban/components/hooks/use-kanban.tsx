"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import {
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createTaskSchema, updateTaskSchema } from "@/schemas/tasks";
import {
  createTask,
  updateTask,
  getTaskDetailAction,
} from "@/features/tasks/actions";
import { moveTask } from "@/features/kanban/actions";
import { BOARD_STATUSES, isBoardStatus } from "@/features/kanban/types";
import type { BoardColumns, BoardStatus } from "@/features/kanban/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/schemas/tasks";
import type { TaskRow, TaskDetail } from "@/features/tasks/types";
import { toFormStatus } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";
import { coerceLifeArea, dueDateToFormValue } from "@/lib/life";
import { useAreaBuckets } from "@/components/area-buckets-provider";

interface KanbanFilters {
  search: string;
  project: string;
  area?: string;
  assignee: string;
  label: string;
  priority: string;
}

export interface KanbanCreateDefaults {
  projectId?: string;
  area?: LifeArea;
  status?: CreateTaskInput["status"];
}

function toDateOnlyValue(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function useKanban(
  initialColumns: BoardColumns,
  initialFilters: KanbanFilters,
  options?: {
    basePath?: string;
    /** When set, filter URL keeps this `project` value (research hub scope). */
    urlProjectParam?: string;
    statuses?: BoardStatus[];
  },
) {
  const router = useRouter();
  const areaIds = useAreaBuckets();
  const basePath = options?.basePath ?? "/kanban";
  const urlProjectParam = options?.urlProjectParam;
  const boardStatuses = options?.statuses ?? BOARD_STATUSES;

  const [prevInitialColumns, setPrevInitialColumns] =
    React.useState(initialColumns);
  const [columns, setColumns] = React.useState<BoardColumns>(initialColumns);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  const [activeTaskCard, setActiveTaskCard] = React.useState<TaskRow | null>(
    null,
  );
  const [search, setSearch] = React.useState(initialFilters.search);
  const [project, setProject] = React.useState(initialFilters.project);

  const [drawerMode, setDrawerMode] = React.useState<"none" | "create" | "edit">(
    "none",
  );
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>([]);
  const [createDefaults, setCreateDefaults] =
    React.useState<KanbanCreateDefaults>({});

  const createForm = useForm<CreateTaskInput>({
    resolver: localizedZodResolver(createTaskSchema),
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
      recurrenceEndsAt: "",
      applyRecurrenceToSeries: "",
    },
  });

  const editForm = useForm<UpdateTaskInput>({
    resolver: localizedZodResolver(updateTaskSchema),
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
      recurrenceEndsAt: "",
      applyRecurrenceToSeries: "",
    },
  }) as import("react-hook-form").UseFormReturn<UpdateTaskInput>;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const collisionDetection = closestCorners;

  function findContainer(id: string): BoardStatus | null {
    if (isBoardStatus(id) && boardStatuses.includes(id)) return id;
    for (const status of boardStatuses) {
      if ((columns[status] ?? []).some(t => t.id === id)) return status;
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
    setDrawerMode("edit");
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
      status: toFormStatus(detail.status),
      priority: detail.priority,
      type: detail.type,
      projectId: detail.projectId ?? "",
      assignedToId: detail.assignedTo?.id ?? "",
      dueDate: dueDateToFormValue(detail.dueDate),
      durationMinutes:
        detail.durationMinutes && detail.durationMinutes > 0
          ? String(detail.durationMinutes)
          : "",
      waitingOn: detail.waitingOn ? "1" : "",
      area: coerceLifeArea(detail.area),
      recurrence: detail.recurrence ?? "NONE",
      recurrenceEndsAt: detail.recurrenceEndsAt
        ? toDateOnlyValue(detail.recurrenceEndsAt)
        : "",
      applyRecurrenceToSeries: detail.recurrenceSeriesId ? "1" : "",
    });
  }

  function openCreate(defaults: KanbanCreateDefaults = {}) {
    const area = coerceLifeArea(
      defaults.area ?? createDefaults.area ?? "LIFE",
    );
    const projectId =
      defaults.projectId ??
      createDefaults.projectId ??
      areaIds[area];
    const status = toFormStatus(
      defaults.status ?? createDefaults.status ?? "BACKLOG",
    );
    setCreateDefaults({ projectId, area, status });
    createForm.reset({
      title: "",
      description: "",
      status,
      priority: "NONE",
      type: "TASK",
      projectId,
      assignedToId: "",
      dueDate: "",
      durationMinutes: "",
      waitingOn: "",
      area,
      recurrence: "NONE",
      recurrenceEndsAt: "",
      applyRecurrenceToSeries: "",
    });
    setSelectedLabelIds([]);
    setActionError(null);
    setEditingTaskId(null);
    setActiveTask(null);
    setDrawerMode("create");
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
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description ?? "");
      fd.append("status", data.status);
      fd.append("priority", data.priority);
      fd.append("type", "TASK");
      fd.append(
        "projectId",
        data.projectId || areaIds[coerceLifeArea(data.area)],
      );
      fd.append("assignedToId", data.assignedToId ?? "");
      fd.append("dueDate", data.dueDate ?? "");
      fd.append("durationMinutes", data.durationMinutes ?? "");
      fd.append(
        "waitingOn",
        data.waitingOn === "1" || data.waitingOn === "true" ? "1" : "",
      );
      fd.append("area", data.area || "LIFE");
      fd.append("recurrence", data.recurrence ?? "NONE");
      if (data.recurrenceEndsAt) fd.append("recurrenceEndsAt", data.recurrenceEndsAt);
      if (data.applyRecurrenceToSeries) {
        fd.append("applyRecurrenceToSeries", data.applyRecurrenceToSeries);
      }
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
      fd.append(
        "waitingOn",
        data.waitingOn === "1" || data.waitingOn === "true" ? "1" : "",
      );
      fd.append("area", data.area ?? "LIFE");
      fd.append("recurrence", data.recurrence ?? "NONE");
      if (data.recurrenceEndsAt) fd.append("recurrenceEndsAt", data.recurrenceEndsAt);
      if (data.applyRecurrenceToSeries) {
        fd.append("applyRecurrenceToSeries", data.applyRecurrenceToSeries);
      }
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
    if (urlProjectParam === undefined && merged.area) params.set("area", merged.area);
    const projectForUrl =
      urlProjectParam !== undefined ? urlProjectParam : merged.project;
    if (projectForUrl) params.set("project", projectForUrl);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
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
    drawerMode,
    editingTaskId,
    activeTask,
    isLoadingDetail,
    actionError,
    isPending,
    createForm,
    editForm,
    selectedLabelIds,
    toggleLabel,
    openTask,
    openCreate,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
  };
}
