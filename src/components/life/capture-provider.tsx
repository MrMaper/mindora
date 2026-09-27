"use client";

import * as React from "react";
import { CaptureDialog } from "@/components/life/capture-dialog";
import {
  openCapture,
  type CaptureOpenDetail,
} from "@/features/capture/open-capture";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"),
  );
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const pageDate = React.useRef<string | undefined>(undefined);
  const openRef = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [fallbackDate, setFallbackDate] = React.useState<string | undefined>();
  const [tick, setTick] = React.useState(0);

  const show = React.useCallback((dueDate?: string) => {
    setFallbackDate(dueDate);
    setTick(value => value + 1);
    setOpen(true);
    openRef.current = true;
  }, []);

  React.useEffect(() => {
    function onContext(event: Event) {
      const detail = (event as CustomEvent<CaptureOpenDetail>).detail;
      pageDate.current = detail?.dueDate;
    }
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<CaptureOpenDetail | null>).detail;
      show(detail?.dueDate ?? pageDate.current);
    }
    function onKey(event: KeyboardEvent) {
      if (event.code !== "KeyN" || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (openRef.current || isTypingTarget(event.target)) return;
      event.preventDefault();
      show(pageDate.current);
    }
    window.addEventListener("mindora:capture-context", onContext);
    window.addEventListener("mindora:open-capture", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mindora:capture-context", onContext);
      window.removeEventListener("mindora:open-capture", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [show]);

  return (
    <>
      {children}
      {open ? (
        <CaptureDialog
          key={tick}
          fallbackDate={fallbackDate}
          onClose={() => {
            openRef.current = false;
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export function CapturePageDate({ dueDate }: { dueDate?: string }) {
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<CaptureOpenDetail>("mindora:capture-context", {
        detail: { dueDate },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent<CaptureOpenDetail>("mindora:capture-context", {
          detail: {},
        }),
      );
    };
  }, [dueDate]);
  return null;
}

export { openCapture };
