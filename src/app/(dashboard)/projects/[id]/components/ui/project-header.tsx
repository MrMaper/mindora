"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import type { Translations } from "@/i18n";
import type { ProjectDetail } from "@/features/projects/types";

interface ProjectHeaderProps {
  project: ProjectDetail;
  t: Translations;
  isAdmin: boolean;
  onInviteMember: () => void;
}

export function ProjectHeader({ project, t, isAdmin, onInviteMember }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-semibold text-base">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground truncate">{project.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="users" size={13} />
                {project._count.members} {project._count.members === 1 ? t.projects.member : t.projects.members}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="circle-check" size={13} />
                {project._count.tasks} {project._count.tasks === 1 ? t.projects.task : t.projects.tasks}
              </span>
              <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
                {project.status === "ACTIVE" ? t.projects.active : t.projects.archived}
              </Badge>
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button variant="primary" icon="plus" onClick={onInviteMember} className="flex-shrink-0">
            {t.projects.inviteMember}
          </Button>
        )}
      </div>
      {project.description && (
        <p className="text-base text-muted-foreground max-w-3xl">{project.description}</p>
      )}
    </div>
  );
}