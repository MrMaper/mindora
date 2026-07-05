import * as React from "react";
import { Avatar, AvatarGroup } from "./avatar";

const SIZES: Record<string, number> = { xs: 18, sm: 24, md: 30, lg: 40 };

export interface StackUser {
  name: string;
  src?: string;
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLSpanElement> {
  users: (string | StackUser)[];
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  max?: number;
}

export function AvatarStack({
  users = [],
  size = "sm",
  max = 4,
  className = "",
  ...rest
}: AvatarStackProps): React.JSX.Element {
  const avatarSize = typeof size === "number" ? size : (SIZES[size] ?? 24);
  
  return (
    <AvatarGroup
      max={max}
      size={typeof size === "number" ? "md" : size}
      className={className}
      {...rest}
    >
      {users.map((u, i) => (
        <Avatar
          key={i}
          name={typeof u === "string" ? u : u.name}
          src={typeof u === "string" ? undefined : u.src}
          size={size}
        />
      ))}
    </AvatarGroup>
  );
}