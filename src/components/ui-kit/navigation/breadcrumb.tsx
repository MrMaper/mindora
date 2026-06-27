import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface CrumbItem {
  label: string;
  href?: string;
  icon?: IconName;
  onClick?: (e: React.MouseEvent) => void;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: CrumbItem[];
}

export function Breadcrumb({
  items = [],
  className = "",
  ...rest
}: BreadcrumbProps): React.JSX.Element {
  return (
    <nav className={`sf-crumbs${className ? ` ${className}` : ""}`} aria-label="Breadcrumb" {...rest}>
      {items.map((item, i) => {
        const current = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            <a
              className={`sf-crumbs__item${current ? " sf-crumbs__item--current" : ""}`}
              href={item.href ?? undefined}
              onClick={item.onClick}
              aria-current={current ? "page" : undefined}
            >
              {item.icon && <Icon name={item.icon} size={14} />}
              {item.label}
            </a>
            {!current && (
              <span className="sf-crumbs__sep">
                <Icon name="chevron-right" size={13} />
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
