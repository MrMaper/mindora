"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  filterTourSteps,
  getTour,
  isTourCompleted,
  tourForPath,
} from "@/features/tour/catalog";
import {
  completeTourAction,
  resetAllToursAction,
  resetTourAction,
} from "@/features/tour/actions";
import {
  clearAllTourLaterFlags,
  clearTourSession,
  laterKey,
  readTourSession,
  writeTourSession,
} from "@/features/tour/session";
import { findTourTarget } from "@/features/tour/targets";
import { pickLang, TOUR_UI } from "@/features/tour/ui-copy";
import type { TourDef, TourId, TourStepDef } from "@/features/tour/types";
import type { NavKey } from "@/lib/ui-profile";
import { TourInvite } from "./tour-invite";
import { TourOverlay } from "./tour-overlay";

const START_EVENT = "mindora:start-tour";
const OPEN_MOBILE_NAV = "mindora:open-mobile-nav";

export type ProductTourProps = {
  language: "FA" | "EN";
  eligibleOverview: boolean;
  completedTourIds: string[];
  overviewCompletedAt: Date | string | null;
  show: Record<NavKey, boolean>;
  captureEnabled: boolean;
  showGuide: boolean;
};

function waitForTarget(
  step: TourStepDef,
  timeoutMs = 5000,
): Promise<HTMLElement | null> {
  if (!step.target) return Promise.resolve(null);
  const started = Date.now();
  return new Promise(resolve => {
    const tick = () => {
      const el = findTourTarget(step.target!);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        resolve(null);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function splitHref(href: string): { path: string; query: string } {
  const qAt = href.indexOf("?");
  if (qAt < 0) return { path: href, query: "" };
  return { path: href.slice(0, qAt), query: href.slice(qAt + 1) };
}

/** Path (+ optional query). Query keys in href must match the current URL. */
function hrefMatches(
  pathname: string,
  search: string,
  href: string | undefined,
): boolean {
  if (!href) return true;
  const { path, query } = splitHref(href);
  if (pathname !== path && !pathname.startsWith(path + "/")) {
    return false;
  }
  if (!query) return true;
  const want = new URLSearchParams(query);
  const have = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  for (const [key, value] of want) {
    if (have.get(key) !== value) return false;
  }
  return true;
}

/** Same-path tour hops merge query (e.g. keep `project` while setting `tab`). */
function resolveTourHref(
  pathname: string,
  search: string,
  href: string,
): string {
  const { path, query } = splitHref(href);
  if (pathname !== path && !pathname.startsWith(path + "/")) {
    return href;
  }
  if (!query) return href;
  const next = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const patch = new URLSearchParams(query);
  for (const [key, value] of patch) next.set(key, value);
  const qs = next.toString();
  return qs ? `${path}?${qs}` : path;
}

function isLater(tourId: TourId): boolean {
  try {
    return sessionStorage.getItem(laterKey(tourId)) === "1";
  } catch {
    return false;
  }
}

function setLater(tourId: TourId, on: boolean) {
  try {
    if (on) sessionStorage.setItem(laterKey(tourId), "1");
    else sessionStorage.removeItem(laterKey(tourId));
  } catch {
    /* ignore */
  }
}

export function ProductTour({
  language,
  eligibleOverview,
  completedTourIds,
  overviewCompletedAt,
  show,
  captureEnabled,
  showGuide,
}: ProductTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const fa = language !== "EN";

  const [activeTourId, setActiveTourId] = React.useState<TourId | null>(null);
  const [index, setIndex] = React.useState(0);
  const [targetEl, setTargetEl] = React.useState<HTMLElement | null>(null);
  const [inviteTour, setInviteTour] = React.useState<TourDef | null>(null);
  /** After «reset all», keep invites honest until layout props catch up. */
  const [completedOverride, setCompletedOverride] = React.useState<
    string[] | null
  >(null);
  const [busy, startTransition] = React.useTransition();
  const navigating = React.useRef(false);
  const restored = React.useRef(false);

  const effectiveCompletedIds = completedOverride ?? completedTourIds;
  const effectiveOverviewAt =
    completedOverride !== null ? null : overviewCompletedAt;

  React.useEffect(() => {
    if (completedOverride === null) return;
    if (completedTourIds.length === 0 && !overviewCompletedAt) {
      setCompletedOverride(null);
    }
  }, [completedTourIds, overviewCompletedAt, completedOverride]);

  const activeDef = activeTourId ? getTour(activeTourId) : null;
  const steps = React.useMemo(() => {
    if (!activeDef) return [];
    return filterTourSteps(activeDef.steps, {
      show,
      captureEnabled,
      showGuide,
    });
  }, [activeDef, show, captureEnabled, showGuide]);

  const safeIndex = Math.min(index, Math.max(0, steps.length - 1));
  const step = steps[safeIndex] ?? null;
  const overviewDone = isTourCompleted(
    "overview",
    effectiveCompletedIds,
    effectiveOverviewAt,
  );

  // Resume mid-tour after remount.
  React.useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = readTourSession();
    if (!saved || !getTour(saved.tourId)) return;
    setActiveTourId(saved.tourId);
    setIndex(saved.index);
  }, []);

  React.useEffect(() => {
    if (!activeTourId) {
      clearTourSession();
      return;
    }
    writeTourSession(activeTourId, safeIndex);
  }, [activeTourId, safeIndex]);

  // Soft invites: overview first; page tours only after overview is done.
  React.useEffect(() => {
    if (activeTourId) {
      setInviteTour(null);
      return;
    }

    if (eligibleOverview && !overviewDone && !isLater("overview")) {
      const overview = getTour("overview");
      setInviteTour(overview ?? null);
      return;
    }

    if (!overviewDone) {
      setInviteTour(null);
      return;
    }

    const page = tourForPath(pathname);
    if (
      page &&
      !isTourCompleted(page.id, effectiveCompletedIds, effectiveOverviewAt) &&
      !isLater(page.id)
    ) {
      setInviteTour(page);
      return;
    }

    setInviteTour(null);
  }, [
    activeTourId,
    eligibleOverview,
    overviewDone,
    pathname,
    effectiveCompletedIds,
    effectiveOverviewAt,
  ]);

  // Manual start: detail = TourId | { tourId, resetAll }.
  React.useEffect(() => {
    function onStart(ev: Event) {
      const raw = (ev as CustomEvent<StartTourDetail | undefined>).detail;
      const resetAll =
        typeof raw === "object" && raw !== null && raw.resetAll === true;
      const id: TourId =
        (typeof raw === "string"
          ? raw
          : typeof raw === "object" && raw !== null
            ? raw.tourId
            : undefined) ?? "overview";
      const def = getTour(id);
      if (!def) return;
      setLater(id, false);
      startTransition(async () => {
        if (resetAll) {
          clearAllTourLaterFlags();
          const res = await resetAllToursAction();
          if (!res.success) {
            toast.error(res.error ?? (fa ? "خطا" : "Error"));
            return;
          }
          setCompletedOverride([]);
        } else {
          const res = await resetTourAction(id);
          if (!res.success) {
            toast.error(res.error ?? (fa ? "خطا" : "Error"));
            return;
          }
          setCompletedOverride(prev => {
            const base = prev ?? completedTourIds;
            return base.filter(x => x !== id);
          });
        }
        setInviteTour(null);
        setIndex(0);
        writeTourSession(id, 0);
        setActiveTourId(id);
      });
    }
    window.addEventListener(START_EVENT, onStart as EventListener);
    return () => window.removeEventListener(START_EVENT, onStart as EventListener);
  }, [fa, completedTourIds]);

  React.useEffect(() => {
    if (!activeTourId || !step) return;
    let cancelled = false;
    setTargetEl(null);

    async function go() {
      const s = step!;
      const shouldNav =
        s.navigate === true &&
        !!s.href &&
        !hrefMatches(pathname, search, s.href);

      if (shouldNav && !navigating.current) {
        navigating.current = true;
        router.push(resolveTourHref(pathname, search, s.href!));
        return;
      }
      navigating.current = false;

      if (shouldNav) {
        await new Promise(r => setTimeout(r, 50));
        if (cancelled) return;
      }

      const needsMobileNav =
        window.innerWidth < 1024 &&
        (s.target?.startsWith("nav-") ||
          s.target === "brand" ||
          s.target === "capture");
      if (needsMobileNav) {
        window.dispatchEvent(new Event(OPEN_MOBILE_NAV));
        await new Promise(r => setTimeout(r, 320));
      }
      if (cancelled) return;

      const el = await waitForTarget(s);
      if (!cancelled) setTargetEl(el);
    }

    void go();
    return () => {
      cancelled = true;
    };
  }, [activeTourId, step, pathname, search, router]);

  function finish(persist: boolean) {
    const id = activeTourId;
    clearTourSession();
    setActiveTourId(null);
    setInviteTour(null);
    setTargetEl(null);
    setIndex(0);
    if (!persist || !id) return;
    setCompletedOverride(prev => {
      const base = prev ?? completedTourIds;
      return base.includes(id) ? base : [...base, id];
    });
    startTransition(async () => {
      await completeTourAction(id);
    });
  }

  function startInvite(def: TourDef) {
    setLater(def.id, false);
    setInviteTour(null);
    setIndex(0);
    writeTourSession(def.id, 0);
    setActiveTourId(def.id);
  }

  function laterInvite(def: TourDef) {
    setLater(def.id, true);
    setInviteTour(null);
  }

  function neverInvite(def: TourDef) {
    setInviteTour(null);
    setCompletedOverride(prev => {
      const base = prev ?? completedTourIds;
      return base.includes(def.id) ? base : [...base, def.id];
    });
    startTransition(async () => {
      await completeTourAction(def.id);
    });
  }

  function onNext() {
    if (!step || !activeTourId) return;
    if (safeIndex >= steps.length - 1) {
      finish(true);
      return;
    }
    const next = safeIndex + 1;
    setIndex(next);
    writeTourSession(activeTourId, next);
  }

  function onBack() {
    if (!activeTourId) return;
    const prev = Math.max(0, safeIndex - 1);
    setIndex(prev);
    writeTourSession(activeTourId, prev);
  }

  return (
    <>
      {inviteTour ? (
        <TourInvite
          language={language}
          variant={inviteTour.id === "overview" ? "modal" : "dock"}
          title={pickLang(inviteTour.inviteTitle, language)}
          body={pickLang(inviteTour.inviteBody, language)}
          busy={busy}
          onStart={() => startInvite(inviteTour)}
          onLater={() => laterInvite(inviteTour)}
          onNever={() => neverInvite(inviteTour)}
        />
      ) : null}

      {activeTourId && step ? (
        <TourOverlay
          target={targetEl}
          title={pickLang(step.title, language)}
          body={pickLang(step.body, language)}
          progressLabel={pickLang(TOUR_UI.progress, language)
            .replace("{current}", String(safeIndex + 1))
            .replace("{total}", String(steps.length))}
          nextLabel={
            safeIndex >= steps.length - 1
              ? pickLang(TOUR_UI.done, language)
              : pickLang(TOUR_UI.next, language)
          }
          backLabel={pickLang(TOUR_UI.back, language)}
          skipLabel={pickLang(TOUR_UI.skip, language)}
          isFirst={safeIndex === 0}
          isLast={safeIndex >= steps.length - 1}
          language={language}
          onNext={onNext}
          onBack={onBack}
          onSkip={() => finish(true)}
        />
      ) : null}
    </>
  );
}

export type StartTourDetail =
  | TourId
  | { tourId?: TourId; resetAll?: boolean };

/** Fire from Guide / Settings / page headers. Pass `{ resetAll: true }` to clear every tour. */
export function requestProductTour(detail: StartTourDetail = "overview") {
  window.dispatchEvent(new CustomEvent(START_EVENT, { detail }));
}

export { OPEN_MOBILE_NAV };
