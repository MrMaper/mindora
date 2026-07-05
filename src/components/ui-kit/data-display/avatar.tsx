import * as React from "react";
import {
  Avatar as ShadcnAvatar,
  AvatarImage as ShadcnAvatarImage,
  AvatarFallback as ShadcnAvatarFallback,
  AvatarGroup as ShadcnAvatarGroup,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#3f4cbb",
  "#2d7ff9",
  "#0a9fbc",
  "#1f9d57",
  "#e8820c",
  "#e0484d",
  "#8a4fd6",
  "#626d7b",
];

const SIZES: Record<string, number> = { xs: 18, sm: 24, md: 30, lg: 40, xl: 56 };

function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeMap = {
  xs: "sm" as const,
  sm: "sm" as const,
  md: "default" as const,
  lg: "lg" as const,
  xl: "lg" as const,
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  status?: "online" | "busy" | "away" | "offline";
}

export function Avatar({
  name = "?",
  src,
  size = "md",
  status,
  className = "",
  style,
  ...rest
}: AvatarProps): React.JSX.Element {
  const px = typeof size === "number" ? size : SIZES[size] ?? 30;
  const bg = PALETTE[hashIndex(name, PALETTE.length)];
  const fontSize = Math.round(px * 0.4);
  const dot = Math.max(7, Math.round(px * 0.28));

  const statusColor =
    status === "online" ? "var(--status-done)"
    : status === "busy" ? "var(--status-blocked)"
    : status === "away" ? "var(--priority-high)"
    : "var(--gray-400)";

  const shadcnSize = sizeMap[size as keyof typeof sizeMap] ?? "default";

  return (
    <ShadcnAvatar
      className={cn("group/avatar", className)}
      size={shadcnSize}
      {...rest}
    >
      {src ? (
        <ShadcnAvatarImage src={src} alt={name} />
      ) : (
        <ShadcnAvatarFallback
          className={cn(
            "font-medium",
            size === "xs" && "text-[10px]",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg",
          )}
          style={{ background: bg, width: px, height: px, fontSize }}
        >
          {initials(name)}
        </ShadcnAvatarFallback>
      )}
      {status && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-background",
            size === "xs" && "size-2.5",
            size === "sm" && "size-3",
            size === "md" && "size-3.5",
            size === "lg" && "size-4",
            size === "xl" && "size-5",
          )}
          style={{ background: statusColor, width: dot, height: dot }}
        />
      )}
    </ShadcnAvatar>
  );
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function AvatarGroup({
  children,
  max,
  size = "md",
  className = "",
  ...rest
}: AvatarGroupProps): React.JSX.Element {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max && childArray.length > max
    ? [...childArray.slice(0, max - 1), childArray[max - 1]]
    : childArray;

  return (
    <ShadcnAvatarGroup
      className={cn("-space-x-2", className)}
      {...rest}
    >
      {visibleChildren.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              key: child.key ?? index,
              size,
            })
          : child
      )}
      {max && childArray.length > max && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background",
            size === "xs" && "size-5",
            size === "sm" && "size-6",
            size === "md" && "size-7",
            size === "lg" && "size-8",
            size === "xl" && "size-10",
          )}
        >
          +{childArray.length - max + 1}
        </div>
      )}
    </ShadcnAvatarGroup>
  );
}