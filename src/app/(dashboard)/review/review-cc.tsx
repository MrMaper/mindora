"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { QuickCapture } from "@/components/life/quick-capture";
import { LifeTaskList } from "@/components/life/life-task-list";
import { usePersonalTaskEditor } from "@/components/life/use-personal-task-editor";
import { formatJalaliShort } from "@/lib/life";
import { formatNumber } from "@/lib/utils";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import type { TaskRow } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";

interface ReviewCCProps {
  weekStart: Date;
  weekEnd: Date;
  hoursThisWeek: number;
  completed: TaskRow[];
  leftover: TaskRow[];
  inbox: TaskRow[];
  weeklyDocId: string | null;
  users: UserRow[];
  labels: LabelRow[];
  userProjects: ProjectRow[];
  currentUserId: string;
  currentUserRole: string;
}

function ReviewColumn({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-bg-surface border border-border-default rounded-lg overflow-hidden min-w-0 flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle bg-bg-sunken">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h2>
          <Badge tone="count">{count}</Badge>
        </div>
        {hint ? (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        ) : null}
      </div>
      <div className="px-3 py-2 min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function ReviewCC({
  weekStart,
  weekEnd,
  hoursThisWeek,
  completed,
  leftover,
  inbox,
  weeklyDocId,
  users,
  labels,
  userProjects,
  currentUserId,
  currentUserRole,
}: ReviewCCProps) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const { openTask, drawer } = usePersonalTaskEditor({
    users,
    labels,
    userProjects,
    currentUserId,
    currentUserRole,
  });

  const listProps = {
    onTaskClick: openTask,
    currentUserId,
    currentUserRole,
    compact: true,
  };

  const stats = [
    {
      label: t.life.reviewStatsDone,
      value: formatNumber(completed.length, language),
    },
    {
      label: t.life.reviewStatsOpen,
      value: formatNumber(leftover.length, language),
    },
    {
      label: t.life.reviewStatsInbox,
      value: formatNumber(inbox.length, language),
    },
    {
      label: t.life.reviewStatsHours,
      value: formatNumber(hoursThisWeek.toFixed(1), language),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-5 min-w-0 overflow-x-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text-primary">
              {t.life.reviewTitle}
            </h1>
            <p className="text-sm text-text-tertiary mt-0.5">
              {t.life.reviewSubtitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatJalaliShort(weekStart, language)} —{" "}
              {formatJalaliShort(weekEnd, language)}
            </p>
          </div>
          {weeklyDocId ? (
            <Button
              variant="subtle"
              size="sm"
              icon="file-text"
              onClick={() => router.push(`/docs?id=${weeklyDocId}`)}
            >
              {t.docs.openWeeklyDoc}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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

        <QuickCapture compact showRecurrence={false} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ReviewColumn title={t.life.completed} count={completed.length}>
            <LifeTaskList
              tasks={completed}
              empty={t.life.reviewEmptyCompleted}
              {...listProps}
            />
          </ReviewColumn>

          <ReviewColumn title={t.life.leftover} count={leftover.length}>
            <LifeTaskList
              tasks={leftover}
              empty={t.life.reviewEmptyLeftover}
              {...listProps}
            />
          </ReviewColumn>

          <ReviewColumn
            title={t.life.planInbox}
            count={inbox.length}
            hint={t.life.reviewPlanHint}
          >
            <LifeTaskList
              tasks={inbox}
              empty={t.life.reviewEmptyInbox}
              showPlan
              {...listProps}
            />
          </ReviewColumn>
        </div>
      </div>
      {drawer}
    </>
  );
}
