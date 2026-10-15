"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui-kit/forms/button";
import { placeTourCard, type TourHole } from "@/features/tour/place-card";
import { cn } from "@/lib/utils";

const PAD = 10;
const EDGE = 12;
/** Highlight holes taller than this feel broken; clamp to a band at the top. */
const MAX_HOLE_H = 220;

function readRect(el: HTMLElement | null): TourHole | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  const top = Math.max(0, r.top - PAD);
  const left = Math.max(0, r.left - PAD);
  const width = Math.min(window.innerWidth - left, r.width + PAD * 2);
  const rawH = r.height + PAD * 2;
  const height = Math.min(rawH, MAX_HOLE_H, window.innerHeight - top - EDGE);
  return { top, left, width, height };
}

export function TourOverlay({
  target,
  title,
  body,
  progressLabel,
  nextLabel,
  backLabel,
  skipLabel,
  isFirst,
  isLast,
  language,
  onNext,
  onBack,
  onSkip,
}: {
  target: HTMLElement | null;
  title: string;
  body: string;
  progressLabel: string;
  nextLabel: string;
  backLabel: string;
  skipLabel: string;
  isFirst: boolean;
  isLast: boolean;
  language: "FA" | "EN";
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = React.useState<TourHole | null>(() => readRect(target));
  const [mounted, setMounted] = React.useState(false);
  const [cardSize, setCardSize] = React.useState({ w: 340, h: 200 });
  const cardRef = React.useRef<HTMLDivElement>(null);
  const rtl = language === "FA";

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function sync() {
      setRect(readRect(target));
      const el = cardRef.current;
      if (el) {
        setCardSize({
          w: el.offsetWidth || 340,
          h: el.offsetHeight || 200,
        });
      }
    }
    sync();
    if (!target) return;
    const ro = new ResizeObserver(sync);
    ro.observe(target);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [target, title, body]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onSkip]);

  React.useEffect(() => {
    if (!target) return;
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [target]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;
  const cardW = Math.min(360, vw - EDGE * 2);
  const pos = placeTourCard(rect, cardW, cardSize.h, vw, vh, rtl);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {rect ? (
          <div
            className="absolute rounded-xl ring-2 ring-primary/80 transition-[top,left,width,height] duration-200"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/55" />
        )}
      </div>

      <div className="absolute inset-0" aria-hidden />

      <div
        ref={cardRef}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: cardW,
        }}
        className={cn(
          "z-[81] max-h-[min(70dvh,28rem)] overflow-y-auto rounded-xl border border-border-default bg-bg-surface p-4 shadow-xl",
          "text-start",
        )}
        dir={rtl ? "rtl" : "ltr"}
      >
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {progressLabel}
        </p>
        <h2
          id="product-tour-title"
          className="mt-1 text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={onNext}>
            {nextLabel}
          </Button>
          {!isFirst ? (
            <Button type="button" size="sm" variant="ghost" onClick={onBack}>
              {backLabel}
            </Button>
          ) : null}
          {!isLast ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ms-auto text-muted-foreground"
              onClick={onSkip}
            >
              {skipLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
