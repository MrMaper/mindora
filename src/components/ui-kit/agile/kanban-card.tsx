"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { PriorityIcon } from "./priority-icon";
import type { Priority } from "./priority-icon";
import { cn } from "@/lib/utils";

export interface CardLabel {
  name: string;
  color: string;
}

export interface CardUser {
  name: string;
  src?: string;
}

export interface KanbanCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  issueKey: string;
  title: string;
  priority?: Priority;
  labels?: (string | CardLabel)[];
  points?: number;
  assignee?: string | CardUser;
  comments?: number;
  attachments?: number;
  checklist?: { done: number; total: number };
  due?: string;
  overdue?: boolean;
  state?: "selected" | "dragging" | "blocked" | "completed" | "archived";
}

export function KanbanCard({
  issueKey,
  title,
  priority = "none",
  labels = [],
  points,
  assignee,
  comments = 0,
  attachments = 0,
  checklist,
  due,
  overdue = false,
  state,
  className = "",
  ...rest
}: KanbanCardProps): React.JSX.Element {
  const blocked = state === "blocked";
  const completed = state === "completed";
  const archived = state === "archived";

  const cls = cn(
    "flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition-shadow",
    "hover:shadow-md hover:border-border-strong",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    state === "selected" && "border-primary ring-1 ring-primary",
    state === "dragging" && "shadow-lg rotate-1 scale-[1.02] cursor-grabbing",
    blocked && "border-status-blocked-border",
    completed && "opacity-60",
    completed && "line-through text-muted-foreground",
    archived && "opacity-50 bg-muted/50",
    className,
  );

  return (
    <div className={cls} tabIndex={0} role="button" {...rest}>
      <div className="flex items-center gap-2">
        <PriorityIcon priority={priority} />
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {issueKey}
        </span>
        {blocked && (
          <span className="flex items-center gap-1.5 ml-auto text-xs text-destructive">
            <Icon name="alert-triangle" size={11} />
            مسدود
          </span>
        )}
      </div>

      <div className="text-sm font-medium text-foreground">{title}</div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l, i) => (
            <Tag key={i} color={typeof l === "string" ? undefined : l.color}>
              {typeof l === "string" ? l : l.name}
            </Tag>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-1">
        {points != null && (
          <span className="flex items-center justify-center min-w-[18px] h-5 rounded bg-muted px-1.5 text-xs font-mono font-medium">
            {points}
          </span>
        )}
        {checklist && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Icon name="circle-check" size={12} />
            {checklist.done}/{checklist.total}
          </span>
        )}
        {comments > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Icon name="message-square" size={12} />
            {comments}
          </span>
        )}
        {attachments > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-muted-foreground">
            <Icon name="paperclip" size={12} />
            {attachments}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {due && (
            <span
              className={cn(
                "flex items-center gap-1.5 text-[10px]",
                overdue && "text-destructive font-medium",
              )}
            >
              <Icon name="clock" size={11} />
              {due}
            </span>
          )}
          {assignee && (
            <Avatar
              name={typeof assignee === "string" ? assignee : assignee.name}
              src={typeof assignee === "string" ? undefined : assignee.src}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
