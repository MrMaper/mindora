"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { useTranslation } from "@/i18n/provider";
import type { ProjectTaskRow } from "@/features/projects/types";

interface OverviewTabProps {
  tasks: ProjectTaskRow[];
  statusCounts: Record<string, number>;
  onOpenTasks: () => void;
  onViewTask: (task: ProjectTaskRow) => void;
}

const STATUS_ROWS: {
  status: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  labelKey: "backlog" | "todo" | "inProgress" | "done";
}[] = [
  { status: "BACKLOG", tone: "neutral", labelKey: "backlog" },
  { status: "TODO", tone: "info", labelKey: "todo" },
  { status: "IN_PROGRESS", tone: "warning", labelKey: "inProgress" },
  { status: "DONE", tone: "success", labelKey: "done" },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function OverviewTab({
  tasks,
  statusCounts,
  onOpenTasks,
  onViewTask,
}: OverviewTabProps) {
  const t = useTranslation();
  const total = tasks.length;
  const done = statusCounts.DONE ?? 0;
  const open = total - done;
  const overdue = tasks.filter(task => {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate).getTime() < startOfToday().getTime();
  }).length;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;
  const recent = tasks.slice(0, 8);

  const stats = [
    { label: t.projects.totalTasks, value: total },
    { label: t.projects.openTasksCount, value: open },
    { label: t.projects.doneTasks, value: done },
    { label: t.projects.overdueTasks, value: overdue },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-bg-surface border border-border-default rounded-lg px-4 py-3"
          >
            <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </div>
            <div className="text-2xl font-semibold text-foreground mt-1">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t.projects.completion}
          </h3>
          <span className="text-sm text-muted-foreground">{completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-bg-sunken overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-bg-sunken">
            <h3 className="text-sm font-semibold">{t.projects.statusBreakdown}</h3>
          </div>
          <ul className="divide-y divide-border-subtle">
            {STATUS_ROWS.map(row => {
              const count = statusCounts[row.status] ?? 0;
              return (
                <li
                  key={row.status}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-sm text-foreground">
                    {t.projects[row.labelKey]}
                  </span>
                  <Badge tone={count > 0 ? row.tone : "neutral"}>{count}</Badge>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-sunken">
            <h3 className="text-sm font-semibold">{t.projects.recentTasks}</h3>
            <button
              type="button"
              onClick={onOpenTasks}
              className="text-xs text-primary hover:underline"
            >
              {t.projects.tasks}
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t.projects.noRecentTasks}
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recent.map(task => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onViewTask(task)}
                    className="w-full text-start px-4 py-2.5 hover:bg-bg-hover transition-colors"
                  >
                    <div className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {t.projects[
                          STATUS_ROWS.find(r => r.status === task.status)
                            ?.labelKey ?? "todo"
                        ]}
                      </span>
                      {task.assignee ? (
                        <span className="text-xs text-muted-foreground truncate">
                          · {task.assignee.name}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
