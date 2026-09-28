"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Menu } from "@/components/ui-kit/overlays/menu";
import type { MenuItem } from "@/components/ui-kit/overlays/menu";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import {
  AREA_COLOR_PRESETS,
  AREA_ICON_PRESETS,
  areaRelatedLinks,
  areaVisualInline,
  resolveAreaVisual,
} from "@/lib/area-visual";
import { getProjectStatusLabel } from "@/components/ui-kit/forms/select-utils";
import type { AreaHubSection, ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";
import type { ProjectStatus } from "@/features/projects/types";

interface AreaSectionProps {
  section: AreaHubSection;
  filterEmpty?: boolean;
  onEditArea: (bucket: ProjectRow) => void;
  onAddPath: (area: LifeArea) => void;
  onView: (project: ProjectRow) => void;
  onEditPath: (project: ProjectRow) => void;
  onArchive: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
  onTogglePin: (project: ProjectRow) => void;
  onUpdatePref: (
    area: LifeArea,
    patch: {
      color?: string | null;
      icon?: string | null;
      archived?: boolean;
    },
  ) => void;
  onMoveArea: (area: LifeArea, direction: "up" | "down") => void;
}

function statusTone(
  status: ProjectStatus,
): "success" | "warning" | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "ON_HOLD" || status === "PLANNED") return "warning";
  return "neutral";
}

function SortablePathRow({
  path,
  visualDot,
  accentColor,
  onView,
  menuItems,
}: {
  path: ProjectRow;
  visualDot: string;
  accentColor?: string;
  onView: () => void;
  menuItems: MenuItem[];
}) {
  const t = useTranslation();
  const language = useLanguage();
  const fmt = (n: number) => formatNumber(n, language);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: path.id,
    data: { type: "path", path, area: path.area },
  });

  const open = path.openTaskCount ?? 0;
  const done = path.doneTaskCount ?? 0;
  const total = path.totalTaskCount ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : null;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-50 z-10 relative")}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex items-start gap-2 px-3.5 py-2.5 cursor-pointer hover:bg-bg-hover"
        onClick={onView}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
      >
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label="Drag"
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
        >
          ⠿
        </button>
        <span
          className={cn("mt-1.5 size-1.5 rounded-full shrink-0", visualDot)}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {path.pinned ? (
              <span className="text-[10px]" title={t.projects.pin}>
                📌
              </span>
            ) : null}
            <span className="text-sm font-medium text-foreground truncate">
              {path.name}
            </span>
            <Badge tone={statusTone(path.status)}>
              {getProjectStatusLabel(t, path.status)}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {fmt(open)} {t.projects.openTasksShort}
            {done > 0 ? ` · ${fmt(done)} ${t.projects.doneTasks}` : null}
            {pct != null ? ` · ${fmt(pct)}%` : null}
          </p>
          {path.nextActionTitle ? (
            <p className="text-[11px] text-foreground/80 mt-1 line-clamp-1">
              <span className="text-muted-foreground">
                {t.projects.nextAction}:{" "}
              </span>
              {path.nextActionTitle}
            </p>
          ) : null}
        </div>
        <Menu
          trigger={
            <IconButton
              icon="more-horizontal"
              aria-label={t.projects.projectActionsLabel}
              size="sm"
              onClick={e => e.stopPropagation()}
            />
          }
          align="end"
          items={menuItems}
        />
      </div>
    </li>
  );
}

export function AreaSection({
  section,
  filterEmpty = false,
  onEditArea,
  onAddPath,
  onView,
  onEditPath,
  onArchive,
  onDelete,
  onTogglePin,
  onUpdatePref,
  onMoveArea,
}: AreaSectionProps) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const { area, bucket, paths, openTaskCount, activePathCount, pref } = section;
  const visual = resolveAreaVisual(area, pref);
  const related = areaRelatedLinks(area);
  const isEmpty = paths.length === 0;
  const showCreateEmpty = isEmpty && !filterEmpty;
  const fmt = (n: number) => formatNumber(n, language);
  const inline = areaVisualInline(visual, pref);

  const { setNodeRef, isOver } = useDroppable({
    id: `area-drop-${area}`,
    data: { type: "area", area },
  });

  const relatedLabels: Record<(typeof related)[number]["labelKey"], string> = {
    relatedResearch: t.projects.relatedResearch,
    relatedDocs: t.projects.relatedDocs,
    relatedLanguage: t.projects.relatedLanguage,
    relatedTasks: t.projects.relatedTasks,
    relatedCalendar: t.projects.relatedCalendar,
  };

  function pathMenuItems(path: ProjectRow): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: t.projects.view,
        icon: "eye",
        onClick: e => {
          e.stopPropagation();
          onView(path);
        },
      },
      {
        label: path.pinned ? t.projects.unpin : t.projects.pin,
        icon: "flag",
        onClick: e => {
          e.stopPropagation();
          onTogglePin(path);
        },
      },
    ];

    if (area === "PHD") {
      items.push({
        label: t.projects.relatedResearch,
        icon: "file-text",
        onClick: e => {
          e.stopPropagation();
          router.push(`/research?project=${path.id}`);
        },
      });
    }
    if (area === "LANG") {
      items.push({
        label: t.projects.relatedLanguage,
        icon: "language",
        onClick: e => {
          e.stopPropagation();
          router.push(`/language?project=${path.id}`);
        },
      });
    }

    items.push(
      { divider: true },
      {
        label: t.common.edit,
        icon: "pencil",
        onClick: e => {
          e.stopPropagation();
          onEditPath(path);
        },
      },
      {
        label:
          path.status === "ARCHIVED" ? t.projects.restore : t.projects.archive,
        icon: path.status === "ARCHIVED" ? "rotate-ccw" : "archive",
        onClick: e => {
          e.stopPropagation();
          onArchive(path);
        },
      },
      { divider: true },
      {
        label: t.common.delete,
        icon: "trash",
        danger: true,
        onClick: e => {
          e.stopPropagation();
          onDelete(path);
        },
      },
    );

    return items;
  }

  const areaMenuItems: MenuItem[] = [
    {
      label: t.projects.openArea,
      icon: "eye",
      onClick: () => router.push(`/projects/areas/${area.toLowerCase()}`),
    },
    {
      label: t.projects.editArea,
      icon: "pencil",
      onClick: () => onEditArea(bucket),
    },
    {
      label: t.projects.changeColor,
      icon: "sliders",
      onClick: () => {
        const keys = AREA_COLOR_PRESETS.map(p => p.key);
        const cur = pref.color && keys.includes(pref.color) ? pref.color : keys[0]!;
        const next = keys[(keys.indexOf(cur) + 1) % keys.length]!;
        onUpdatePref(area, { color: next });
      },
    },
    {
      label: t.projects.changeIcon,
      icon: "zap",
      onClick: () => {
        const keys = AREA_ICON_PRESETS.map(p => p.key);
        const cur =
          pref.icon && keys.includes(pref.icon) ? pref.icon : visual.emoji;
        const idx = Math.max(0, keys.indexOf(cur));
        const next = keys[(idx + 1) % keys.length]!;
        onUpdatePref(area, { icon: next });
      },
    },
    {
      label: t.projects.moveUp,
      icon: "arrow-up",
      onClick: () => onMoveArea(area, "up"),
    },
    {
      label: t.projects.moveDown,
      icon: "arrow-down",
      onClick: () => onMoveArea(area, "down"),
    },
    { divider: true },
    {
      label: pref.archived ? t.projects.restoreArea : t.projects.archiveArea,
      icon: pref.archived ? "rotate-ccw" : "archive",
      onClick: () => onUpdatePref(area, { archived: !pref.archived }),
    },
  ];

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-bg-surface border border-border-default rounded-xl overflow-hidden flex flex-col",
        visual.borderTop,
        isOver && "ring-2 ring-primary/40",
        pref.archived && "opacity-70",
      )}
      style={inline}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 px-3.5 py-3",
          !isEmpty && "border-b border-border-subtle",
          visual.wash,
        )}
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-start"
          onClick={() => router.push(`/projects/areas/${area.toLowerCase()}`)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>
              {visual.emoji}
            </span>
            <span
              className={cn("size-2 rounded-full shrink-0", visual.dot)}
              style={
                pref.color ? { backgroundColor: visual.cssVar } : undefined
              }
            />
            <h2 className="text-sm font-semibold text-foreground truncate">
              {bucket.name}
            </h2>
          </div>
          {bucket.description ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ps-7">
              {bucket.description}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground mt-1.5 ps-7 tabular-nums">
            {fmt(activePathCount)} {t.projects.activePaths} ·{" "}
            {fmt(openTaskCount)} {t.projects.openTasksShort}
          </p>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          {!isEmpty || filterEmpty ? (
            <IconButton
              icon="plus"
              size="sm"
              aria-label={t.projects.newPath}
              onClick={() => onAddPath(area)}
            />
          ) : null}
          <Menu
            trigger={
              <IconButton
                icon="more-horizontal"
                size="sm"
                aria-label={t.projects.areaActionsLabel}
              />
            }
            align="end"
            items={areaMenuItems}
          />
        </div>
      </div>

      {related.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-1.5 border-b border-border-subtle bg-bg-sunken/50">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t.projects.relatedSpace}
          </span>
          {related.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs font-medium hover:underline inline-flex items-center gap-0.5",
                visual.text || "text-primary",
              )}
              style={pref.color ? { color: visual.cssVar } : undefined}
            >
              {relatedLabels[link.labelKey]}
              <span aria-hidden>↗</span>
            </Link>
          ))}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="px-3.5 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {showCreateEmpty
              ? t.projects.noPathsHint
              : t.projects.noFilterPaths}
          </p>
          {showCreateEmpty ? (
            <Button
              variant="subtle"
              size="sm"
              icon="plus"
              onClick={() => onAddPath(area)}
            >
              {t.projects.createFirstPath}
            </Button>
          ) : null}
        </div>
      ) : (
        <SortableContext
          items={paths.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-border-subtle">
            {paths.map(path => (
              <SortablePathRow
                key={path.id}
                path={path}
                visualDot={visual.dot}
                accentColor={pref.color ? visual.cssVar : undefined}
                onView={() => onView(path)}
                menuItems={pathMenuItems(path)}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  );
}
