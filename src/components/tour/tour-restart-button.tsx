"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/forms/button";
import { requestProductTour } from "@/components/tour/product-tour";
import { pickLang, TOUR_UI } from "@/features/tour/ui-copy";

export function TourRestartButton({
  language,
  variant = "secondary",
}: {
  language: "FA" | "EN";
  variant?: "primary" | "secondary" | "subtle" | "ghost";
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-4">
      <p className="text-sm font-medium text-foreground">
        {language === "FA" ? "بازنشانی همهٔ تورها" : "Reset all tours"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {language === "FA"
          ? "نقشهٔ منو و تورهای تخصصی هر صفحه از نو آماده می‌شوند؛ اول تور کلی شروع می‌شود."
          : "The menu map and every page tour become available again; the overview tour starts first."}
      </p>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className="mt-3"
        disabled={pending}
        onClick={() => {
          startTransition(() => {
            try {
              requestProductTour({ tourId: "overview", resetAll: true });
            } catch {
              toast.error(language === "FA" ? "خطا" : "Error");
            }
          });
        }}
      >
        {pickLang(TOUR_UI.inviteStart, language)}
      </Button>
    </div>
  );
}
