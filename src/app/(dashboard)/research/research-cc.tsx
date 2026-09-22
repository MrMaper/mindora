"use client";

import * as React from "react";
import { Suspense } from "react";
import { KanbanCC } from "@/app/(dashboard)/kanban/components/client";
import {
  ResearchPipelineAside,
  ResearchTabBar,
} from "@/components/research/research-aside";
import { ResearchLibraryPanel } from "@/components/research/research-library";
import { ResearchWritingPanel } from "@/components/research/research-writing";
import { ResearchProjectSwitcher } from "@/components/research/research-project-switcher";
import { AREA_PROJECT_IDS } from "@/lib/life";
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
}

export function ResearchCC(props: ResearchCCProps) {
  return (
    <Suspense fallback={<ResearchCCInner {...props} />}>
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
}: ResearchCCProps) {
  const t = useTranslation();
  const [tab, setTab] = React.useState<ResearchTab>("pipeline");

  const docProjectId =
    scope === "all" ? undefined : scope === "inbox" ? null : scope;

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-2">
        <h1 className="text-xl font-semibold">{t.life.researchHubTitle}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.life.researchHubHint}
        </p>
      </div>

      <ResearchProjectSwitcher scope={scope} projects={phdProjects} />

      <ResearchTabBar tab={tab} onChange={setTab} />

      {tab === "pipeline" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 overflow-x-auto">
            <KanbanCC
              key={`board-${scope}`}
              initialColumns={initialColumns}
              users={users}
              labels={labels}
              userProjects={userProjects}
              filters={filters}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              statuses={statuses}
              columnLabels={columnLabels}
              title={t.life.researchTitle}
              basePath="/research"
              urlProjectParam={scope === "all" ? "" : scope}
              showProjectFilter={false}
              showFilters={false}
              formPreset="research"
              createDefaults={{
                projectId:
                  scope === "all" || scope === "inbox"
                    ? AREA_PROJECT_IDS.PHD
                    : scope,
                area: "PHD",
                status: "BACKLOG",
              }}
            />
          </div>
          <ResearchPipelineAside
            phdDocs={hub.phdDocs}
            quotes={hub.quotes}
            projectId={docProjectId}
          />
        </div>
      )}

      {tab === "library" && (
        <ResearchLibraryPanel
          initialSources={hub.sources}
          projectId={docProjectId}
          citeDocs={hub.phdDocs}
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
