"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useProjects } from "../hooks/use-projects";
import type {
  AreaHubSection,
  ProjectRow,
  ProjectsHubData,
} from "@/features/projects/types";
import { useTranslation } from "@/i18n/provider";
import { PageHeader, type PathStatusFilter } from "../ui/page-header";
import { AreaSection } from "../ui/area-section";
import { CreateProjectDrawer } from "../ui/create-project-drawer";
import { EditProjectDrawer } from "../ui/edit-project-drawer";
import { EditAreaDrawer } from "../ui/edit-area-drawer";
import { DeleteConfirmationDialog } from "../ui/delete-confirmation-dialog";
import { GlobalError } from "@/components/ui-kit/global";
import {
  movePathToArea,
  reorderAreas,
  reorderPathsInArea,
  togglePathPin,
  updateAreaPreference,
} from "@/features/projects/actions";
import type { LifeArea } from "@/types/db";
import Link from "next/link";

interface ProjectsCCProps {
  initialData: ProjectsHubData;
  search: string;
  initialCreateArea?: string;
}

function filterSection(
  section: AreaHubSection,
  statusFilter: PathStatusFilter,
): AreaHubSection {
  if (statusFilter === "all") return section;
  const paths = section.paths.filter(p => p.status === statusFilter);
  return {
    ...section,
    paths,
    activePathCount: paths.filter(
      p => p.status === "ACTIVE" || p.status === "PLANNED",
    ).length,
    openTaskCount: paths.reduce((n, p) => n + (p.openTaskCount ?? 0), 0),
  };
}

function isActivePathStatus(status: ProjectRow["status"]): boolean {
  return status === "ACTIVE" || status === "PLANNED";
}

export function ProjectsCC({
  initialData,
  search,
  initialCreateArea,
}: ProjectsCCProps) {
  const u = useProjects(search);
  const t = useTranslation();
  const router = useRouter();
  const [statusFilter, setStatusFilter] =
    React.useState<PathStatusFilter>("all");
  const [sections, setSections] = React.useState(initialData.sections);
  const [pinnedPaths, setPinnedPaths] = React.useState(initialData.pinnedPaths);
  const [activeDrag, setActiveDrag] = React.useState<ProjectRow | null>(null);

  React.useEffect(() => {
    setSections(initialData.sections);
    setPinnedPaths(initialData.pinnedPaths);
  }, [initialData]);

  React.useEffect(() => {
    if (!initialCreateArea) return;
    if (["PHD", "WORK", "LIFE", "LANG"].includes(initialCreateArea)) {
      u.openCreate(initialCreateArea as LifeArea);
    }
    // deep-link from area dashboard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const pathCount = sections.reduce((n, s) => n + s.paths.length, 0);
  const showSearch =
    pathCount > 6 || Boolean(u.search.trim()) || Boolean(search.trim());

  const displaySections =
    statusFilter === "all"
      ? sections.map(s => ({ section: s, filterEmpty: false }))
      : sections.map(s => {
          const filtered = filterSection(s, statusFilter);
          return {
            section: filtered,
            filterEmpty: s.paths.length > 0 && filtered.paths.length === 0,
          };
        });

  const areaOptions = sections.map(s => ({
    value: s.area,
    label: s.bucket.name,
  }));

  function findPath(id: string): { path: ProjectRow; area: LifeArea } | null {
    for (const s of sections) {
      const path = s.paths.find(p => p.id === id);
      if (path) return { path, area: s.area };
    }
    return null;
  }

  function onDragStart(event: DragStartEvent) {
    const found = findPath(String(event.active.id));
    setActiveDrag(found?.path ?? null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findPath(activeId);
    if (!from) return;

    let toArea = from.area;
    let toIndex: number | undefined;

    if (overId.startsWith("area-drop-")) {
      toArea = overId.replace("area-drop-", "") as LifeArea;
      const dest = sections.find(s => s.area === toArea);
      toIndex = dest?.paths.length ?? 0;
    } else {
      const overPath = findPath(overId);
      if (overPath) {
        toArea = overPath.area;
        const dest = sections.find(s => s.area === toArea);
        toIndex = dest?.paths.findIndex(p => p.id === overId) ?? 0;
        if (toIndex < 0) toIndex = dest?.paths.length ?? 0;
      }
    }

    if (toArea === from.area) {
      const section = sections.find(s => s.area === from.area);
      if (!section) return;
      const oldIndex = section.paths.findIndex(p => p.id === activeId);
      const newIndex =
        toIndex ?? section.paths.findIndex(p => p.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const nextPaths = arrayMove(section.paths, oldIndex, newIndex).map(
        (p, i) => ({ ...p, sortOrder: i }),
      );
      setSections(prev =>
        prev.map(s =>
          s.area === from.area ? { ...s, paths: nextPaths } : s,
        ),
      );
      const result = await reorderPathsInArea(
        from.area,
        nextPaths.map(p => p.id),
      );
      if (!result.success) router.refresh();
      return;
    }

    // Cross-area move
    const countsAsActive = isActivePathStatus(from.path.status);
    setSections(prev => {
      const without = prev.map(s =>
        s.area === from.area
          ? {
              ...s,
              paths: s.paths.filter(p => p.id !== activeId),
              activePathCount: countsAsActive
                ? Math.max(0, s.activePathCount - 1)
                : s.activePathCount,
              openTaskCount: Math.max(
                0,
                s.openTaskCount - (from.path.openTaskCount ?? 0),
              ),
            }
          : s,
      );
      return without.map(s => {
        if (s.area !== toArea) return s;
        const moved = { ...from.path, area: toArea };
        const paths = [...s.paths];
        const idx = Math.min(toIndex ?? paths.length, paths.length);
        paths.splice(idx, 0, moved);
        return {
          ...s,
          paths: paths.map((p, i) => ({ ...p, sortOrder: i })),
          activePathCount: countsAsActive
            ? s.activePathCount + 1
            : s.activePathCount,
          openTaskCount: s.openTaskCount + (from.path.openTaskCount ?? 0),
        };
      });
    });

    const result = await movePathToArea({
      pathId: activeId,
      toArea,
      toIndex,
    });
    if (!result.success) router.refresh();
  }

  async function onTogglePin(project: ProjectRow) {
    const next = !project.pinned;
    setSections(prev =>
      prev.map(s => ({
        ...s,
        paths: s.paths
          .map(p => (p.id === project.id ? { ...p, pinned: next } : p))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return a.sortOrder - b.sortOrder;
          }),
      })),
    );
    setPinnedPaths(prev => {
      if (next) {
        return [...prev.filter(p => p.id !== project.id), { ...project, pinned: true }];
      }
      return prev.filter(p => p.id !== project.id);
    });
    const result = await togglePathPin(project.id, next);
    if (!result.success) router.refresh();
  }

  async function onUpdatePref(
    area: LifeArea,
    patch: {
      color?: string | null;
      icon?: string | null;
      archived?: boolean;
    },
  ) {
    setSections(prev =>
      prev.map(s =>
        s.area === area
          ? { ...s, pref: { ...s.pref, ...patch } }
          : s,
      ),
    );
    const result = await updateAreaPreference({ area, ...patch });
    if (!result.success) router.refresh();
    else if (patch.archived === true) router.refresh();
  }

  async function onMoveArea(area: LifeArea, direction: "up" | "down") {
    const order = sections.map(s => s.area);
    const idx = order.indexOf(area);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= order.length) return;
    const next = [...order];
    [next[idx], next[swapWith]] = [next[swapWith]!, next[idx]!];
    setSections(prev => {
      const map = new Map(prev.map(s => [s.area, s]));
      return next.map((a, i) => {
        const s = map.get(a)!;
        return { ...s, pref: { ...s.pref, sortOrder: i } };
      });
    });
    const result = await reorderAreas(next);
    if (!result.success) router.refresh();
  }

  return (
    <>
      <PageHeader
        pathCount={pathCount}
        search={u.search}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
        onCreate={() => u.openCreate()}
        showSearch={showSearch}
      />

      {pinnedPaths.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t.projects.pinnedPaths}:
          </span>
          {pinnedPaths.map(p => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="text-xs font-medium px-2 py-1 rounded-md bg-bg-sunken border border-border-default hover:bg-bg-hover"
            >
              📌 {p.name}
            </Link>
          ))}
        </div>
      ) : null}

      <GlobalError
        error={u.actionError}
        drawerMode={u.drawerMode === "edit-area" ? "edit" : u.drawerMode}
      />

      {displaySections.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg p-10 text-center text-sm text-muted-foreground">
          {t.projects.noResults}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
            {displaySections.map(({ section, filterEmpty }) => (
              <AreaSection
                key={section.area}
                section={section}
                filterEmpty={filterEmpty}
                onEditArea={u.openEditArea}
                onAddPath={u.openCreate}
                onView={u.onView}
                onEditPath={u.openEdit}
                onArchive={u.onArchive}
                onDelete={u.setDeleteTarget}
                onTogglePin={onTogglePin}
                onUpdatePref={onUpdatePref}
                onMoveArea={onMoveArea}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm shadow-lg">
                {activeDrag.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateProjectDrawer
        isOpen={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        form={{
          control: u.createForm.control,
          isPending: u.isPending,
        }}
        onSubmit={u.onCreateSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
        areaOptions={areaOptions}
      />

      <EditProjectDrawer
        isOpen={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        form={{
          control: u.editForm.control,
          isPending: u.isPending,
        }}
        editingProject={
          u.editingProject
            ? {
                name: u.editingProject.name,
                memberCount: u.editingProject.memberCount,
              }
            : null
        }
        onSubmit={u.onEditSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
      />

      <EditAreaDrawer
        isOpen={u.drawerMode === "edit-area"}
        onClose={u.closeDrawer}
        form={{
          control: u.areaForm.control,
          isPending: u.isPending,
        }}
        areaName={u.editingProject?.name ?? null}
        area={u.editingArea ?? "LIFE"}
        pref={
          sections.find(s => s.area === u.editingArea)?.pref ?? {
            area: u.editingArea ?? "LIFE",
            color: null,
            icon: null,
            sortOrder: 0,
            archived: false,
          }
        }
        onPrefChange={patch => {
          if (u.editingArea) void onUpdatePref(u.editingArea, patch);
        }}
        onSubmit={u.onAreaSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
      />

      <DeleteConfirmationDialog
        isOpen={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        t={{
          deleteProject: t.projects.deleteProject,
          deleteConfirmPrefix: t.projects.deleteConfirmPrefix,
          deleteConfirmSuffix: t.projects.deleteConfirmSuffix,
          common: { cancel: t.common.cancel },
        }}
        projectName={u.deleteTarget?.name ?? null}
        onConfirm={u.onDeleteConfirm}
        isPending={u.isPending}
      />
    </>
  );
}
