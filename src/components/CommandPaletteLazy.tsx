"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const CommandPaletteWrapperImpl = dynamic(
  () =>
    import("./CommandPaletteWrapper").then(m => m.CommandPaletteWrapper),
  { ssr: false },
);

/**
 * Keeps Ctrl/Cmd+K and mindora:open-search listeners tiny until the palette
 * is actually opened — then loads the command UI chunk.
 */
export function CommandPaletteLazy() {
  const [armed, setArmed] = React.useState(false);

  React.useEffect(() => {
    const arm = () => setArmed(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        arm();
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("mindora:open-search", arm);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("mindora:open-search", arm);
    };
  }, []);

  if (!armed) return null;
  return <CommandPaletteWrapperImpl initialOpen />;
}
