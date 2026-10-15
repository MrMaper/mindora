"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { requestProductTour } from "@/components/tour/product-tour";
import { pickLang, TOUR_UI } from "@/features/tour/ui-copy";
import type { TourId } from "@/features/tour/types";
import { useLanguage } from "@/i18n/provider";

/** Compact control to restart the specialized tour for the current page. */
export function PageTourButton({
  tourId,
  className,
}: {
  tourId: TourId;
  className?: string;
}) {
  const language = useLanguage() === "EN" ? "EN" : "FA";
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={className}
      onClick={() => requestProductTour(tourId)}
    >
      {pickLang(TOUR_UI.pageRestart, language)}
    </Button>
  );
}
