"use client";

import * as React from "react";

export function Skeleton({ className = "", style = {} }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`sf-skeleton ${className}`}
      style={{
        background: "linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)",
        backgroundSize: "200% 100%",
        animation: "sf-skeleton-shimmer 1.5s infinite",
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = "", style = {} }: { lines?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", ...style }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} style={{ height: "1em", width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`sf-card-skeleton ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        boxShadow: "var(--shadow-xs)",
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: "50%" }} />
        <SkeletonText lines={2} style={{ flex: 1, marginTop: "var(--space-1)" }} />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTableRow({ columns = 6, className = "", style = {} }: { columns?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "var(--space-3)", padding: "var(--space-3)", ...style }}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} style={{ height: "1.25rem" }} />
      ))}
    </div>
  );
}