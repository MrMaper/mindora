import * as React from "react";
import { Avatar } from "./avatar";

const SIZES: Record<string, number> = { xs: 18, sm: 24, md: 30, lg: 40 };

export interface StackUser {
  name: string;
  src?: string;
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLSpanElement> {
  users: (string | StackUser)[];
  size?: "xs" | "sm" | "md" | "lg" | number;
  max?: number;
}

export function AvatarStack({
  users = [],
  size = "sm",
  max = 4,
  className = "",
  ...rest
}: AvatarStackProps): React.JSX.Element {
  const px = typeof size === "number" ? size : (SIZES[size] ?? 24);
  const overlap = -Math.round(px * 0.32);
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <span
      className={`sf-avstack${className ? ` ${className}` : ""}`}
      style={{ "--_ov": `${overlap}px` } as React.CSSProperties}
      {...rest}
    >
      {shown.map((u, i) => (
        <Avatar
          key={i}
          name={typeof u === "string" ? u : u.name}
          src={typeof u === "string" ? undefined : u.src}
          size={size}
        />
      ))}
      {extra > 0 && (
        <span
          className="sf-avstack__more"
          style={{ width: px, height: px, fontSize: Math.round(px * 0.36), marginLeft: overlap }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
