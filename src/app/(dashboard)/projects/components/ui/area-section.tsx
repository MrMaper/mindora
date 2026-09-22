"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Menu } from "@/components/ui-kit/overlays/menu";
import type { MenuItem } from "@/components/ui-kit/overlays/menu";
import { useTranslation } from "@/i18n/provider";
import type { AreaHubSection, ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";

interface AreaSectionProps {
  section: AreaHubSection;
  onEditArea: (bucket: ProjectRow) => void;
  onAddPath: (area: LifeArea) => void;
  onView: (project: ProjectRow) => void;
  onEditPath: (project: ProjectRow) => void;
  onArchive: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
}

export function AreaSection({
  section,
  onEditArea,
  onAddPath,
  onView,
  onEditPath,
  onArchive,
  onDelete,
}: AreaSectionProps) {
  const t = useTranslation();
  const router = useRouter();
  const { area, bucket, paths } = section;

  const hubHref =
    area === "PHD" ? "/research" : area === "LANG" ? "/language" : null;
  const hubLabel =
    area === "PHD"
      ? t.projects.openResearch
      : area === "LANG"
        ? t.projects.openLanguage
        : null;

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
    ];

    if (area === "PHD") {
      items.push({
        label: t.projects.openResearch,
        icon: "file-text",
        onClick: e => {
          e.stopPropagation();
          router.push(`/research?project=${path.id}`);
        },
      });
    }
    if (area === "LANG") {
      items.push({
        label: t.projects.openLanguage,
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
          path.status === "ACTIVE" ? t.projects.archive : t.projects.restore,
        icon: path.status === "ACTIVE" ? "archive" : "rotate-ccw",
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

  return (
    <section className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border-subtle bg-bg-sunken">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {bucket.name}
            </h2>
            <Badge tone="count">{paths.length}</Badge>
            {hubHref && hubLabel ? (
              <Link
                href={hubHref}
                className="text-xs text-primary hover:underline"
              >
                {hubLabel}
              </Link>
            ) : null}
          </div>
          {bucket.description ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {bucket.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon="pencil"
            size="sm"
            aria-label={t.projects.editArea}
            onClick={() => onEditArea(bucket)}
          />
          <Button
            variant="subtle"
            size="sm"
            icon="plus"
            onClick={() => onAddPath(area)}
          >
            {t.projects.path}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.5rem] gap-3 px-4 h-9 items-center border-b border-border-subtle">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.projects.name}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.projects.status}
        </span>
        <span />
      </div>

      {paths.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="mb-3">{t.projects.noPaths}</p>
          <Button
            variant="subtle"
            size="sm"
            icon="plus"
            onClick={() => onAddPath(area)}
          >
            {t.projects.addPathInArea}
          </Button>
        </div>
      ) : (
        paths.map(path => (
          <div
            key={path.id}
            role="button"
            tabIndex={0}
            className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.5rem] gap-3 px-4 min-h-13 items-center border-b border-border-subtle last:border-b-0 cursor-pointer hover:bg-bg-hover"
            onClick={() => onView(path)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onView(path);
              }
            }}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {path.name}
              </div>
              {path.description ? (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {path.description}
                </div>
              ) : null}
            </div>

            <Badge tone={path.status === "ACTIVE" ? "success" : "neutral"}>
              {path.status === "ACTIVE"
                ? t.projects.active
                : t.projects.archived}
            </Badge>

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
              items={pathMenuItems(path)}
            />
          </div>
        ))
      )}
    </section>
  );
}
