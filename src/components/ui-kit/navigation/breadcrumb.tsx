import * as React from "react";
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList as ShadcnBreadcrumbList,
  BreadcrumbItem as ShadcnBreadcrumbItem,
  BreadcrumbLink as ShadcnBreadcrumbLink,
  BreadcrumbPage as ShadcnBreadcrumbPage,
  BreadcrumbSeparator as ShadcnBreadcrumbSeparator,
  BreadcrumbEllipsis as ShadcnBreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";
import { cn } from "@/lib/utils";

export interface CrumbItem {
  label: string;
  href?: string;
  icon?: IconName;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: CrumbItem[];
  maxItems?: number;
}

export function Breadcrumb({
  items = [],
  maxItems = 5,
  className = "",
  ...rest
}: BreadcrumbProps): React.JSX.Element {
  const visibleItems = items.length > maxItems
    ? [
        ...items.slice(0, maxItems - 2),
        { label: "...", href: undefined, disabled: true },
        items[items.length - 1],
      ]
    : items;

  return (
    <ShadcnBreadcrumb className={className} {...rest}>
      <ShadcnBreadcrumbList>
        {visibleItems.map((item, i) => {
          const current = i === visibleItems.length - 1;
          const isEllipsis = item.label === "..." && item.disabled;
          return (
            <React.Fragment key={i}>
              <ShadcnBreadcrumbItem>
                {current ? (
                  <ShadcnBreadcrumbPage className="flex items-center gap-1">
                    {item.icon && <Icon name={item.icon} size={14} />}
                    {item.label}
                  </ShadcnBreadcrumbPage>
                ) : isEllipsis ? (
                  <ShadcnBreadcrumbEllipsis className="flex items-center gap-1" />
                ) : (
                  <ShadcnBreadcrumbLink
                    href={item.href}
                    onClick={(e: React.MouseEvent) => {
                      if (!item.href) e.preventDefault();
                      item.onClick?.(e);
                    }}
                    className={cn(
                      "flex items-center gap-1",
                      !item.href && !item.onClick && "cursor-default pointer-events-none",
                    )}
                  >
                    {item.icon && <Icon name={item.icon} size={14} />}
                    {item.label}
                  </ShadcnBreadcrumbLink>
                )}
              </ShadcnBreadcrumbItem>
              {!current && <ShadcnBreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </ShadcnBreadcrumbList>
    </ShadcnBreadcrumb>
  );
}