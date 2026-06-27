import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "rect" | "text" | "circle";
  width?: number | string;
  height?: number | string;
  lines?: number;
}

export function Skeleton({
  variant = "rect",
  width,
  height,
  lines,
  className = "",
  style,
  ...rest
}: SkeletonProps): React.JSX.Element {
  if (variant === "text" && lines && lines > 1) {
    return (
      <span className={className} style={{ display: "block", ...style }} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="sf-skel sf-skel--text"
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </span>
    );
  }

  const cls = ["sf-skel", `sf-skel--${variant}`, className].filter(Boolean).join(" ");
  return <span className={cls} style={{ width, height, ...style }} {...rest} />;
}
