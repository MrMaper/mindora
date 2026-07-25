import * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Icon } from "../foundation/icon";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  onRemove?: () => void;
}

export function Tag({
  color,
  onRemove,
  className = "",
  children,
  ...rest
}: TagProps): React.JSX.Element {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "gap-1 h-5 px-2 py-0.5 text-xs font-medium rounded-full",
        "border-transparent bg-muted hover:bg-muted/80",
        className,
      )}
      {...rest}
    >
      {color && (
        <span className="size-1.5 rounded-full" style={{ background: color }} />
      )}
      {children}
      {onRemove && (
        <span
          className="flex items-center justify-center size-3.5 -ml-0.5 rounded-full hover:bg-muted-foreground/10 transition-colors"
          role="button"
          tabIndex={0}
          aria-label="Remove"
          onClick={onRemove}
          onKeyDown={e => e.key === "Enter" && onRemove()}
        >
          <Icon name="x" size={10} strokeWidth={2.5} />
        </span>
      )}
    </ShadcnBadge>
  );
}
