import * as React from "react";

const PALETTE = [
  "#3f4cbb", "#2d7ff9", "#0a9fbc", "#1f9d57", "#e8820c",
  "#e0484d", "#8a4fd6", "#626d7b",
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
  const px = typeof size === "number" ? size : (SIZES[size] ?? 30);
  const bg = PALETTE[hashIndex(name, PALETTE.length)];
  const fontSize = Math.round(px * 0.4);
  const dot = Math.max(7, Math.round(px * 0.28));

  const statusColor =
    status === "online" ? "var(--status-done)"
    : status === "busy" ? "var(--status-blocked)"
    : status === "away" ? "var(--status-progress)"
    : "var(--gray-400)";

  return (
    <span
      className={`sf-avatar${className ? ` ${className}` : ""}`}
      style={{ width: px, height: px, fontSize, background: src ? "var(--gray-200)" : bg, ...style }}
      title={name}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
      {status && (
        <span className="sf-avatar__status" style={{ width: dot, height: dot, background: statusColor }} />
      )}
    </span>
  );
}
