import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
  ...rest
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className={`sf-empty${className ? ` ${className}` : ""}`} {...rest}>
      <div className="sf-empty__icon">
        <Icon name={icon} size={22} />
      </div>
      {title && <div className="sf-empty__title">{title}</div>}
      {description && <div className="sf-empty__desc">{description}</div>}
      {action && <div className="sf-empty__actions">{action}</div>}
    </div>
  );
}
