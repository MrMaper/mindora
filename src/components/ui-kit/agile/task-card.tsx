import * as React from "react";
import { Icon } from "../foundation/icon";
import { Avatar } from "../data-display/avatar";
import { Tag } from "../data-display/tag";
import { PriorityIcon } from "./priority-icon";
import { StatusBadge } from "./status-badge";
import type { Priority } from "./priority-icon";
import type { TaskStatus } from "./status-badge";
import type { CardLabel, CardUser } from "./kanban-card";

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
  const cls = [
    "sf-trow",
    selected ? "sf-trow--selected" : "",
    status === "done" ? "sf-trow--done" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} tabIndex={0} role="button" {...rest}>
      {grip && (
        <span className="sf-trow__grip">
          <Icon name="more-vertical" size={14} />
        </span>
      )}
      <PriorityIcon priority={priority} />
      <span className="sf-trow__key">{issueKey}</span>
      <span className="sf-trow__title">{title}</span>
      {labels.length > 0 && (
        <span className="sf-trow__labels">
          {labels.slice(0, 2).map((l, i) => (
            <Tag key={i} color={typeof l === "string" ? undefined : l.color}>
              {typeof l === "string" ? l : l.name}
            </Tag>
          ))}
        </span>
      )}
      {comments > 0 && (
        <span className="sf-trow__meta">
          <Icon name="message-square" size={12} />
          {comments}
        </span>
      )}
      {status && <StatusBadge status={status} />}
      {points != null && <span className="sf-trow__pts">{points}</span>}
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
