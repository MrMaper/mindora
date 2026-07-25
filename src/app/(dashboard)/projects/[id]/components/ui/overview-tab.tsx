"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { Translations } from "@/i18n";

interface StatusStatCardProps {
  status: string;
  count: number;
  label: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
}

export function StatusStatCard({ status, count, label, tone }: StatusStatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-tertiary">{label}</span>
        <Badge tone={tone} className="text-xs">
          {status}
        </Badge>
      </div>
      <div className="text-3xl font-bold text-foreground">{count}</div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  count: number;
  total: number;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
}

export function ProgressBar({ label, count, total, tone }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorMap: Record<string, string> = {
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    info: "var(--color-info)",
    neutral: "var(--color-neutral)",
    danger: "var(--color-danger)",
  };

  return (
    <div className="flex items-center gap-3">
      <Badge tone={tone} className="w-24 text-xs">
        {label}
      </Badge>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: colorMap[tone] }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground w-10 text-right">{percentage}%</span>
    </div>
  );
}

interface OverviewTabProps {
  t: Translations;
  tasks: any[];
  statusCounts: Record<string, number>;
}

export function OverviewTab({ t, tasks, statusCounts }: OverviewTabProps) {
  const statusConfig = [
    { status: "BACKLOG", tone: "neutral" as const, label: t.tasks.backlog },
    { status: "TODO", tone: "info" as const, label: t.tasks.todo },
    { status: "IN_PROGRESS", tone: "warning" as const, label: t.tasks.inProgress },
    { status: "REVIEW", tone: "warning" as const, label: t.tasks.review },
    { status: "TESTING", tone: "info" as const, label: t.tasks.testing },
    { status: "DONE", tone: "success" as const, label: t.tasks.done },
    { status: "BLOCKED", tone: "danger" as const, label: t.tasks.blocked },
  ];

  const progressConfig = [
    { status: "DONE", label: t.tasks.done, tone: "success" as const },
    { status: "IN_PROGRESS", label: t.tasks.inProgress, tone: "warning" as const },
    { status: "REVIEW", label: t.tasks.review, tone: "info" as const },
    { status: "TODO", label: t.tasks.todo, tone: "neutral" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusConfig.map((item) => (
          <StatusStatCard
            key={item.status}
            status={item.status}
            count={statusCounts[item.status] || 0}
            label={item.label}
            tone={item.tone}
          />
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">{t.projects.progress}</h3>
        <div className="space-y-4">
          {progressConfig.map((item) => (
            <ProgressBar
              key={item.status}
              label={item.label}
              count={statusCounts[item.status] || 0}
              total={tasks.length || 1}
              tone={item.tone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}