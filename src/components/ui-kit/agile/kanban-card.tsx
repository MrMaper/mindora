import * as React from "react";
import { Icon } from "../foundation/icon";
import { Avatar } from "../data-display/avatar";
import { Tag } from "../data-display/tag";
import { PriorityIcon } from "./priority-icon";
import type { Priority } from "./priority-icon";

export interface CardLabel {
  name: string;
  color: string;
}

export interface CardUser {
  name: string;
  src?: string;
}

export interface KanbanCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
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
  const cls = ["sf-kcard", state ? `sf-kcard--${state}` : "", className].filter(Boolean).join(" ");

  return (
    <div className={cls} tabIndex={0} role="button" {...rest}>
      <div className="sf-kcard__top">
        <PriorityIcon priority={priority} />
        <span className="sf-kcard__key">{issueKey}</span>
        {blocked && (
          <span className="sf-kcard__blocked-tag">
            <Icon name="alert-triangle" size={11} /> Blocked
          </span>
        )}
      </div>

      <div className="sf-kcard__title">{title}</div>

      {labels.length > 0 && (
        <div className="sf-kcard__labels">
          {labels.map((l, i) => (
            <Tag key={i} color={typeof l === "string" ? undefined : l.color}>
              {typeof l === "string" ? l : l.name}
            </Tag>
          ))}
        </div>
      )}

      <div className="sf-kcard__foot">
        {points != null && <span className="sf-kcard__pts">{points}</span>}
        {checklist && (
          <span className="sf-kcard__meta">
            <Icon name="circle-check" size={12} />
            {checklist.done}/{checklist.total}
          </span>
        )}
        {comments > 0 && (
          <span className="sf-kcard__meta">
            <Icon name="message-square" size={12} />
            {comments}
          </span>
        )}
        {attachments > 0 && (
          <span className="sf-kcard__meta">
            <Icon name="paperclip" size={12} />
            {attachments}
          </span>
        )}
        <div className="sf-kcard__foot-right">
          {due && (
            <span className={`sf-kcard__due${overdue ? " sf-kcard__due--overdue" : ""}`}>
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
