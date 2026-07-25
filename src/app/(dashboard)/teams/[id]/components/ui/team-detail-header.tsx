"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
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
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {name}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon name="users" size={13} />
            {memberCount} {t.teams.members.toLowerCase()}
          </span>
          <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
            {status === "ACTIVE" ? t.teams.active : t.teams.archived}
          </Badge>
        </div>
      </div>

      {canManage && (
        <Button variant="primary" icon="plus" onClick={onInvite}>
          {t.teams.inviteMember}
        </Button>
      )}
    </div>
  );
}
