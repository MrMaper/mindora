"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { cn } from "@/lib/utils";
import { pickLang, TOUR_UI } from "@/features/tour/ui-copy";

export type TourInviteVariant = "modal" | "dock";

export function TourInvite({
  language,
  title,
  body,
  busy,
  variant = "modal",
  onStart,
  onLater,
  onNever,
}: {
  language: "FA" | "EN";
  title: string;
  body: string;
  busy?: boolean;
  /** overview → centered modal; page tours → docked card (page stays usable). */
  variant?: TourInviteVariant;
  onStart: () => void;
  onLater: () => void;
  onNever: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const fa = language === "FA";

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onLater();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLater]);

  if (!mounted) return null;

  const actions = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        variant === "modal" && "mt-5 flex-col sm:flex-row",
        variant === "dock" && "mt-3.5",
      )}
    >
      <Button
        type="button"
        size={variant === "modal" ? "md" : "sm"}
        className={cn(variant === "modal" && "w-full sm:w-auto sm:min-w-36")}
        onClick={onStart}
        disabled={busy}
      >
        {pickLang(TOUR_UI.inviteStart, language)}
      </Button>
      <Button
        type="button"
        size={variant === "modal" ? "md" : "sm"}
        variant="secondary"
        className={cn(variant === "modal" && "w-full sm:w-auto")}
        onClick={onLater}
      >
        {pickLang(TOUR_UI.inviteLater, language)}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "text-muted-foreground",
          variant === "modal" && "w-full sm:ms-auto sm:w-auto",
        )}
        onClick={onNever}
        disabled={busy}
      >
        {pickLang(TOUR_UI.inviteNever, language)}
      </Button>
    </div>
  );

  if (variant === "dock") {
    return createPortal(
      <div
        className={cn(
          "fixed z-[70] w-[min(24rem,calc(100%-1.5rem))]",
          // Physical bottom-left — away from the RTL sidebar on the right.
          "bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 sm:left-6",
        )}
        role="status"
        aria-labelledby="tour-invite-title"
        dir={fa ? "rtl" : "ltr"}
      >
        <div
          className={cn(
            "overflow-hidden rounded-xl bg-bg-surface p-4 shadow-xl",
            // Attention: warm accent edge + soft glow (not a full-screen block)
            "border-2 border-amber-500/80",
            "shadow-[0_12px_40px_rgb(0_0_0/0.18),0_0_0_3px_rgb(245_158_11/0.2)]",
          )}
        >
          <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Icon name="info" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="tour-invite-title"
                className="text-[15px] font-semibold text-foreground"
              >
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground/75">
                {body}
              </p>
              {actions}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-invite-title"
      dir={fa ? "rtl" : "ltr"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={pickLang(TOUR_UI.inviteLater, language)}
        onClick={onLater}
      />

      <div className="relative z-[1] w-full max-w-md rounded-2xl border-2 border-primary/30 bg-bg-surface p-5 shadow-2xl ring-1 ring-black/5 sm:p-6">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Icon name="info" size={22} />
        </div>

        <h2
          id="tour-invite-title"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-7 text-foreground/80">{body}</p>
        {actions}
      </div>
    </div>,
    document.body,
  );
}
