"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { useTranslation } from "@/i18n/provider";
import { isAreaBucketId } from "@/lib/project-namespace";
import type { ProjectDetail } from "@/features/projects/types";
import { useAreaHelpers } from "@/components/member-areas-provider";

interface ProjectHeaderProps {
  project: ProjectDetail;
  isAdmin: boolean;
  onInviteMember: () => void;
}

function boardHref(project: ProjectDetail, hub: "research" | "language" | null): string {
  if (hub === "research") return `/research?project=${project.id}`;
  if (hub === "language") return `/language?project=${project.id}`;
  return `/kanban?project=${project.id}`;
}

function boardLabel(
  hub: "research" | "language" | null,
  t: ReturnType<typeof useTranslation>,
): string {
  if (hub === "research") return t.projects.openResearch;
  if (hub === "language") return t.projects.openLanguage;
  return t.projects.openBoard;
}

export function ProjectHeader({
  project,
  isAdmin,
  onInviteMember,
}: ProjectHeaderProps) {
  const t = useTranslation();
  const router = useRouter();
  const { isHub } = useAreaHelpers();
  const hub = isHub(project.areaId, "research")
    ? "research"
    : isHub(project.areaId, "language")
      ? "language"
      : null;
  const isBucket = isAreaBucketId(project.id);

  return (
    <div className="mb-5">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        ← {t.projects.backToHub}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary truncate">
              {project.name}
            </h1>
            <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
              {project.status === "ACTIVE"
                ? t.projects.active
                : t.projects.archived}
            </Badge>
            {isBucket ? (
              <Badge tone="info">{t.projects.areaBucket}</Badge>
            ) : null}
          </div>

          {project.description ? (
            <p className="text-sm text-text-tertiary mt-1 max-w-2xl">
              {project.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>
              {project._count.members}{" "}
              {project._count.members === 1
                ? t.projects.member
                : t.projects.members}
            </span>
            <span>·</span>
            <span>
              {project._count.tasks}{" "}
              {project._count.tasks === 1 ? t.projects.task : t.projects.tasks}
            </span>
            {project.teamName ? (
              <>
                <span>·</span>
                <span>{project.teamName}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => router.push(`/tasks?project=${project.id}`)}
          >
            {t.projects.openTasks}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(boardHref(project, hub))}
          >
            {boardLabel(hub, t)}
          </Button>
          {isAdmin && !isBucket ? (
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={onInviteMember}
            >
              {t.projects.inviteMember}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
