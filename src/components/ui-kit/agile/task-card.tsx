"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { PriorityIcon } from "./priority-icon";
import { StatusBadge } from "./status-badge";
import type { Priority } from "./priority-icon";
import type { TaskStatus } from "./status-badge";
import type { CardLabel, CardUser } from "./kanban-card";
import { cn } from "@/lib/utils";

export interface TaskCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  issueKey: string;
  title: string;
  priority?: Priority;
  status?: TaskStatus;
  labels?: (string | CardLabel)[];
  points?: number;
  assignee?: string | CardUser;
  comments?: number;
  selected?: boolean;
  grip?: boolean;
}

export function TaskCard({
  issueKey,
  title,
  priority = "none",
  status,
  labels = [],
  points,
  assignee,
  comments = 0,
  selected = false,
  grip = false,
  className = "",
  ...rest
}: TaskCardProps): React.JSX.Element {
  const cls = cn(
    "flex items-center gap-3 h-10 px-2 rounded-lg text-sm transition-colors",
    "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected && "bg-accent",
    status === "done" && "text-muted-foreground line-through",
    className,
  );

  return (
    <div className={cls} tabIndex={0} role="button" {...rest}>
      {grip && (
        <span className="flex opacity-0 cursor-grab transition-opacity hover:opacity-100 text-muted-foreground">
          <Icon name="more-vertical" size={14} />
        </span>
      )}
      <PriorityIcon priority={priority} />
      <span className="font-mono text-[10px] text-muted-foreground w-[86px] flex-none">{issueKey}</span>
      <span className="truncate flex-1">{title}</span>
      {labels.length > 0 && (
        <span className="flex gap-1.5 flex-none">
          {labels.slice(0, 2).map((l, i) => (
            <Tag key={i} color={typeof l === "string" ? undefined : l.color}>
              {typeof l === "string" ? l : l.name}
            </Tag>
          ))}
        </span>
      )}
      {comments > 0 && (
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Icon name="message-square" size={12} />
          {comments}
        </span>
      )}
      {status && <StatusBadge status={status} />}
      {points != null && (
        <span className="font-mono text-[10px] font-semibold text-muted-foreground">{points}</span>
      )}
      {assignee && (
        <Avatar
          name={typeof assignee === "string" ? assignee : assignee.name}
          src={typeof assignee === "string" ? undefined : assignee.src}
          size="sm"
        />
      )}
    </div>
  );
}