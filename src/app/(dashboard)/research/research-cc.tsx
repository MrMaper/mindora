"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { KanbanCC } from "@/app/(dashboard)/kanban/components/client";
import {
  ResearchPipelineAside,
  ResearchTabBar,
} from "@/components/research/research-aside";
import { ResearchLibraryPanel } from "@/components/research/research-library";
import { ResearchWritingPanel } from "@/components/research/research-writing";
import { ResearchProjectSwitcher } from "@/components/research/research-project-switcher";
import { useAreaBuckets } from "@/components/area-buckets-provider";
import type {
  ResearchHubData,
  ResearchProjectItem,
  ResearchProjectScope,
  ResearchTab,
} from "@/features/research/types";
import type { BoardColumns, BoardStatus } from "@/features/kanban/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import { useTranslation } from "@/i18n/provider";

interface ResearchCCProps {
  hub: ResearchHubData;
  scope: ResearchProjectScope;
  phdProjects: ResearchProjectItem[];
  initialColumns: BoardColumns;
  users: UserRow[];
  labels: LabelRow[];
  userProjects: ProjectRow[];
  filters: {
    search: string;
    assignee: string;
    label: string;
    priority: string;
    project: string;
  };
  currentUserId: string;
  currentUserRole: string;
  statuses: BoardStatus[];
  columnLabels: Partial<Record<BoardStatus, string>>;
  initialTab?: ResearchTab;
}

function parseTab(raw: string | null | undefined): ResearchTab {
  if (raw === "library" || raw === "writing" || raw === "pipeline") return raw;
  return "pipeline";
}

export function ResearchCC(props: ResearchCCProps) {
  return (
    <Suspense
      fallback={
        <div
          className="h-40 animate-pulse rounded-xl border bg-muted/30"
          aria-hidden
        />
      }
    >
      <ResearchCCInner {...props} />
    </Suspense>
  );
}

function ResearchCCInner({
  hub,
  scope,
  phdProjects,
  initialColumns,
  users,
  labels,
  userProjects,
  filters,
  currentUserId,
  currentUserRole,
  statuses,
  columnLabels,
  initialTab = "pipeline",
}: ResearchCCProps) {
  const t = useTranslation();
  const areaIds = useAreaBuckets();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTabTransition] = React.useTransition();
  const urlTab = parseTab(searchParams.get("tab") ?? initialTab);
  const [tab, setOptimisticTab] = React.useOptimistic(urlTab);

  function changeTab(next: ResearchTab) {
    startTabTransition(() => {
      setOptimisticTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "pipeline") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const docProjectId =
    scope === "all" ? undefined : scope === "inbox" ? null : scope;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 min-w-0">
        <h1 className="text-xl font-semibold sm:text-2xl">
          {t.life.researchHubTitle}
        </h1>
        <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
          {t.life.researchHubHint}
        </p>
      </div>

      <ResearchProjectSwitcher scope={scope} projects={phdProjects} />

      <ResearchTabBar tab={tab} onChange={changeTab} />

      {tab === "pipeline" && (
        <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="relative min-w-0">
            <KanbanCC
              key={`board-${scope}`}
              embedded
              initialColumns={initialColumns}
              users={users}
              labels={labels}
              userProjects={userProjects}
              filters={filters}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              statuses={statuses}
              columnLabels={columnLabels}
              basePath="/research"
              urlProjectParam={scope === "all" ? "" : scope}
              showProjectFilter={false}
              showFilters={false}
              formPreset="research"
              createDefaults={{
                projectId:
                  scope === "all" || scope === "inbox" ? areaIds.PHD : scope,
                area: "PHD",
                status: "BACKLOG",
              }}
            />
            {/* Peek hint: next column is off-screen on phones */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-8 end-0 w-6 bg-linear-to-l from-background to-transparent sm:hidden"
            />
          </div>
          <details className="rounded-xl border bg-card xl:hidden">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              {t.life.researchWrite} · {t.life.researchQuotes}
            </summary>
            <div className="border-t px-2 pb-2 pt-1">
              <ResearchPipelineAside
                phdDocs={hub.phdDocs}
                quotes={hub.quotes}
                projectId={docProjectId}
              />
            </div>
          </details>
          <div className="hidden min-w-0 xl:block">
            <ResearchPipelineAside
              phdDocs={hub.phdDocs}
              quotes={hub.quotes}
              projectId={docProjectId}
            />
          </div>
        </div>
      )}

      {tab === "library" && (
        <ResearchLibraryPanel
          initialSources={hub.sources}
          projectId={docProjectId}
          citeDocs={hub.phdDocs}
          projects={phdProjects}
        />
      )}

      {tab === "writing" && (
        <ResearchWritingPanel
          phdDocs={hub.phdDocs}
          pulse={hub.pulse}
          projectId={docProjectId}
        />
      )}
    </div>
  );
}
