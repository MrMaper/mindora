"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useTranslation } from "@/i18n/provider";

interface TeamDetailHeaderProps {
  name: string;
  description: string | null;
  memberCount: number;
  status: "ACTIVE" | "ARCHIVED";
  canManage: boolean;
  onInvite: () => void;
}

export function TeamDetailHeader({
  name,
  description,
  memberCount,
  status,
  canManage,
  onInvite,
}: TeamDetailHeaderProps) {
  const t = useTranslation();

  return (
    <PageHeaderBar
      className="mb-6"
      title={
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
          <span>{name}</span>
        </span>
      }
      description={
        <>
          {description ? <p className="mb-1">{description}</p> : null}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="users" size={13} />
              {memberCount} {t.teams.members.toLowerCase()}
            </span>
            <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
              {status === "ACTIVE" ? t.teams.active : t.teams.archived}
            </Badge>
          </div>
        </>
      }
      actions={
        canManage ? (
          <Button variant="primary" icon="plus" onClick={onInvite}>
            {t.teams.inviteMember}
          </Button>
        ) : null
      }
    />
  );
}
