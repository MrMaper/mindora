"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
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

function cloneBoardColumns(cols: BoardColumns): BoardColumns {
  const next = {} as BoardColumns;
  for (const [status, tasks] of Object.entries(cols)) {
    next[status as BoardStatus] = (tasks ?? []).map(task => ({ ...task }));
  }
  return next;
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
  const pendingMoveRef = React.useRef(false);
  const activeDragIdRef = React.useRef<string | null>(null);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    // Don't wipe optimistic board state mid-drag or while a move is saving.
    if (!activeDragIdRef.current && !pendingMoveRef.current) {
      setColumns(initialColumns);
    }
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

  // Mouse: small move to start. Touch: long-press so column scroll still works.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  );
  const collisionDetection = closestCorners;

  const columnsRef = React.useRef(columns);
  columnsRef.current = columns;
  /** Status before this drag — onDragOver mutates columns early. */
  const dragOriginRef = React.useRef<{
    id: string;
    status: BoardStatus;
  } | null>(null);
  /** Full board snapshot at drag start — restore on cancel / drop-outside. */
  const dragSnapshotRef = React.useRef<BoardColumns | null>(null);

  function findContainerIn(
    cols: BoardColumns,
    id: string,
  ): BoardStatus | null {
    if (isBoardStatus(id) && boardStatuses.includes(id)) return id;
    for (const status of boardStatuses) {
      if ((cols[status] ?? []).some(t => t.id === id)) return status;
    }
    return null;
  }

  function findContainer(id: string): BoardStatus | null {
    return findContainerIn(columnsRef.current, id);
  }

  function restoreDragSnapshot() {
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;
    dragOriginRef.current = null;
    activeDragIdRef.current = null;
    setActiveTaskCard(null);
    if (!snapshot) return;
    setColumns(snapshot);
    columnsRef.current = snapshot;
  }

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const status = findContainer(id);
    if (!status) return;
    dragOriginRef.current = { id, status };
    dragSnapshotRef.current = cloneBoardColumns(columnsRef.current);
    activeDragIdRef.current = id;
    setActiveTaskCard(
      (columnsRef.current[status] ?? []).find(t => t.id === id) ?? null,
    );
  }

  function onDragCancel() {
    restoreDragSnapshot();
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns(prev => {
      const activeStatus = findContainerIn(prev, activeId);
      const overStatus = findContainerIn(prev, overId);
      if (!activeStatus || !overStatus || activeStatus === overStatus) return prev;

      const activeItems = [...(prev[activeStatus] ?? [])];
      const overItems = [...(prev[overStatus] ?? [])];
      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      if (activeIndex === -1) return prev;

      const overIndex = overItems.findIndex(t => t.id === overId);
      const [movedRaw] = activeItems.splice(activeIndex, 1);
      if (!movedRaw) return prev;
      const moved = { ...movedRaw, status: overStatus };
      // Dropping on the column shell → append; on a card → insert at that card.
      const insertAt =
        overIndex >= 0
          ? overIndex
          : overItems.length;
      overItems.splice(insertAt, 0, moved);
      return { ...prev, [activeStatus]: activeItems, [overStatus]: overItems };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    activeDragIdRef.current = null;
    setActiveTaskCard(null);
    if (!over) {
      restoreDragSnapshot();
      return;
    }
    dragSnapshotRef.current = null;

    const activeId = String(active.id);
    const overId = String(over.id);
    const prev = columnsRef.current;

    const activeStatus = findContainerIn(prev, activeId);
    if (!activeStatus) return;
    const overStatus = findContainerIn(prev, overId) ?? activeStatus;

    let next: BoardColumns = prev;

    if (activeStatus === overStatus) {
      const items = [...(prev[activeStatus] ?? [])];
      const oldIndex = items.findIndex(t => t.id === activeId);
      let newIndex = items.findIndex(t => t.id === overId);
      if (isBoardStatus(overId) && boardStatuses.includes(overId)) {
        newIndex = Math.max(0, items.length - 1);
      }
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = {
          ...prev,
          [activeStatus]: arrayMove(items, oldIndex, newIndex),
        };
        setColumns(next);
        columnsRef.current = next;
      }
    } else {
      // Touch / missed onDragOver: still move across columns here.
      const sourceItems = [...(prev[activeStatus] ?? [])];
      const destItems = [...(prev[overStatus] ?? [])].filter(
        t => t.id !== activeId,
      );
      const fromIndex = sourceItems.findIndex(t => t.id === activeId);
      if (fromIndex !== -1) {
        const [movedRaw] = sourceItems.splice(fromIndex, 1);
        if (movedRaw) {
          const moved = { ...movedRaw, status: overStatus };
          let insertAt = destItems.findIndex(t => t.id === overId);
          if (insertAt < 0) insertAt = destItems.length;
          destItems.splice(insertAt, 0, moved);
          next = {
            ...prev,
            [activeStatus]: sourceItems,
            [overStatus]: destItems,
          };
          setColumns(next);
          columnsRef.current = next;
        }
      }
    }

    const orderedIds = (next[overStatus] ?? []).map(t => t.id);
    if (!orderedIds.includes(activeId)) {
      orderedIds.push(activeId);
    }

    const fromStatus = origin?.id === activeId ? origin.status : activeStatus;
    const statusChanged = fromStatus !== overStatus;
    const prevIds = (prev[overStatus] ?? []).map(t => t.id);
    const orderChanged =
      statusChanged ||
      prevIds.length !== orderedIds.length ||
      prevIds.some((id, i) => id !== orderedIds[i]);
    if (!statusChanged && !orderChanged) return;

    pendingMoveRef.current = true;
    startTransition(async () => {
      try {
        const result = await moveTask({
          taskId: activeId,
          toStatus: overStatus,
          orderedIds,
        });
        if (!result?.success) {
          toast.error(result?.error || "جابجایی ذخیره نشد");
          router.refresh();
          return;
        }
        // waitingOn remap (or other server remap) can land on a different column.
        if (result.status && result.status !== overStatus) {
          router.refresh();
        }
      } catch (error) {
        console.error("moveTask failed", error);
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : "جابجایی ذخیره نشد",
        );
        router.refresh();
      } finally {
        pendingMoveRef.current = false;
      }
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
    onDragCancel,
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
