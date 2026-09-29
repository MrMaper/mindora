"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import {
  AREA_VISUAL,
  areaRelatedLinks,
  areaVisualInline,
  resolveAreaVisual,
} from "@/lib/area-visual";
import type { AreaDashboardData } from "@/features/projects/types";
import { getProjectStatusLabel } from "@/components/ui-kit/forms/select-utils";

export function AreaDashboardCC({ data }: { data: AreaDashboardData }) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const visual = resolveAreaVisual(data.area, data.pref);
  const related = areaRelatedLinks(data.area);
  const fmt = (n: number) => formatNumber(n, language);
  const inline = areaVisualInline(visual, data.pref);

  const relatedLabels = {
    relatedResearch: t.projects.relatedResearch,
    relatedDocs: t.projects.relatedDocs,
    relatedLanguage: t.projects.relatedLanguage,
    relatedTasks: t.projects.relatedTasks,
    relatedCalendar: t.projects.relatedCalendar,
  } as const;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon="arrow-right"
          onClick={() => router.push("/projects")}
          className="mb-2 -ms-2"
        >
          {t.projects.backToHub}
        </Button>
        <PageHeaderBar
          className="mb-0"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-2xl leading-none" aria-hidden>
                {visual.emoji}
              </span>
              <span className="truncate">{data.bucket.name}</span>
            </span>
          }
          description={
            data.bucket.description ? (
              <p>{data.bucket.description}</p>
            ) : null
          }
          actions={
            <Button
              variant="primary"
              icon="plus"
              onClick={() => router.push(`/projects?create=${data.area}`)}
            >
              {t.projects.newPath}
            </Button>
          }
        />
      </div>

      <section
        className={cn(
          "rounded-xl border border-border-default overflow-hidden",
          visual.borderTop,
          visual.wash,
        )}
        style={inline}
      >
        <div className="px-4 py-3 border-b border-border-subtle">
          <h2 className="text-sm font-semibold">{t.projects.thisWeek}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <Stat label={t.projects.paths} value={fmt(data.stats.pathsTotal)} />
          <Stat
            label={t.projects.openTasksShort}
            value={fmt(data.stats.tasksOpen)}
          />
          <Stat label={t.projects.doneTasks} value={fmt(data.stats.tasksDone)} />
          <Stat
            label={t.projects.completed}
            value={fmt(data.stats.pathsCompleted)}
          />
        </div>
        {data.weekOpenTasks.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-muted-foreground">
            {t.projects.noWeekTasks}
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {data.weekOpenTasks.map(task => (
              <li key={task.id}>
                <Link
                  href={
                    task.projectId
                      ? `/projects/${task.projectId}`
                      : "/tasks"
                  }
                  className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-bg-hover"
                >
                  <span className="truncate font-medium">{task.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.projectName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border-default overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.projects.pathsSection}</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {fmt(data.activePathCount)} {t.projects.activePaths}
            </span>
          </div>
          {data.paths.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {t.projects.noPathsHint}
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {data.paths.map(path => (
                <li key={path.id}>
                  <Link
                    href={`/projects/${path.id}`}
                    className="flex items-start gap-2 px-4 py-2.5 hover:bg-bg-hover"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 rounded-full shrink-0",
                        visual.dot || AREA_VISUAL[data.area].dot,
                      )}
                      style={
                        data.pref.color
                          ? { backgroundColor: visual.cssVar }
                          : undefined
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {path.pinned ? (
                          <span className="text-[10px]" title={t.projects.pin}>
                            📌
                          </span>
                        ) : null}
                        <span className="text-sm font-medium truncate">
                          {path.name}
                        </span>
                        <Badge
                          tone={
                            path.status === "ACTIVE"
                              ? "success"
                              : path.status === "ON_HOLD"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {getProjectStatusLabel(t, path.status)}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {fmt(path.openTaskCount ?? 0)}{" "}
                        {t.projects.openTasksShort}
                        {(path.doneTaskCount ?? 0) > 0
                          ? ` · ${fmt(path.doneTaskCount ?? 0)} ${t.projects.doneTasks}`
                          : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border-default overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="text-sm font-semibold">
              {t.projects.nextActionsSection}
            </h2>
          </div>
          {data.nextActions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {t.projects.noNextActions}
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {data.nextActions.map(item => (
                <li key={`${item.pathId}-${item.title}`}>
                  <Link
                    href={`/projects/${item.pathId}`}
                    className="block px-4 py-2.5 hover:bg-bg-hover"
                  >
                    <div className="text-sm font-medium line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {item.pathName}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {related.length > 0 ? (
            <div className="border-t border-border-subtle px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                {t.projects.relatedNotes}
              </p>
              <div className="flex flex-wrap gap-2">
                {related.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-xs font-medium hover:underline",
                      visual.text || "text-primary",
                    )}
                    style={
                      data.pref.color ? { color: visual.cssVar } : undefined
                    }
                  >
                    {relatedLabels[link.labelKey]} ↗
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
