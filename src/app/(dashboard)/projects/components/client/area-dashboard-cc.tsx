"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { cn, formatNumber } from "@/lib/utils";
import {
  areaRelatedLinksFromHub,
  areaVisualInline,
  resolveAreaVisual,
  areaVisualKey,
} from "@/lib/area-visual";
import { areaTagline } from "@/lib/areas";
import type { AreaDashboardData } from "@/features/projects/types";
import { getProjectStatusLabel } from "@/components/ui-kit/forms/select-utils";
import { CreateProjectDrawer } from "../ui/create-project-drawer";
import { createProject } from "@/features/projects/actions";
import { createProjectSchema, type CreateProjectInput } from "@/schemas/projects";
import { localizedZodResolver } from "@/lib/validation-message";

export function AreaDashboardCC({ data }: { data: AreaDashboardData }) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const visual = resolveAreaVisual(
    areaVisualKey({ templateKey: data.templateKey, hubFor: data.hubFor }),
    data.pref,
  );
  const related = areaRelatedLinksFromHub(data.hubFor);
  const fmt = (n: number) => formatNumber(n, language);
  const inline = areaVisualInline(visual, data.pref);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const areaLabel = data.displayName || data.bucket.name;
  const slogan = areaTagline(
    {
      templateKey: data.templateKey,
      nameIsDefault: data.nameIsDefault,
    },
    data.bucket.description,
    language,
  );
  const createForm = useForm<CreateProjectInput>({
    resolver: localizedZodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
      areaId: data.areaId,
    },
  });

  function openCreatePath() {
    createForm.reset({
      name: "",
      description: "",
      teamId: "",
      areaId: data.areaId,
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  const onCreateSubmit = createForm.handleSubmit(values => {
    setCreateError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("description", values.description ?? "");
      fd.append("teamId", values.teamId ?? "");
      fd.append("areaId", data.areaId);
      const result = await createProject(fd);
      if (!result.success) {
        setCreateError(result.error ?? "Failed to create path.");
        return;
      }
      setCreateOpen(false);
      router.refresh();
    });
  });

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
              <span
                className={cn("shrink-0", visual.text)}
                style={data.pref.color ? { color: visual.cssVar } : undefined}
                aria-hidden
              >
                <Icon name={visual.icon} size={22} />
              </span>
              <span className="truncate">{areaLabel}</span>
            </span>
          }
          description={slogan ? <p>{slogan}</p> : null}
          actions={
            <Button variant="primary" icon="plus" onClick={openCreatePath}>
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
            <div className="px-4 py-6 flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                {t.projects.noPathsHint}
              </p>
              <Button
                variant="subtle"
                size="sm"
                icon="plus"
                onClick={openCreatePath}
              >
                {t.projects.createFirstPath}
              </Button>
            </div>
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
                        visual.dot,
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
                          <span
                            title={t.projects.pin}
                            className="inline-flex shrink-0"
                          >
                            <Icon
                              name="flag"
                              size={12}
                              className="text-muted-foreground"
                            />
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

      <CreateProjectDrawer
        isOpen={createOpen}
        onClose={() => {
          if (isPending) return;
          setCreateOpen(false);
          setCreateError(null);
        }}
        form={{
          control: createForm.control,
          isPending,
        }}
        onSubmit={onCreateSubmit}
        actionError={createError}
        isPending={isPending}
        areaOptions={[{ value: data.areaId, label: areaLabel }]}
      />
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
