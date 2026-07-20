"use client";

import * as React from "react";

export interface GlobalErrorProps {
  error: string | null;
  drawerMode: "none" | "create" | "edit";
}

export function GlobalError({ error, drawerMode }: GlobalErrorProps) {
  if (!error || drawerMode !== "none") return null;

  return (
    <div
      className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm"
      role="alert"
    >
      {error}
    </div>
  );
}
