"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { peyda } from "@/lib/font";
import { I18nProvider } from "@/i18n/provider";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";
import { useToastPosition } from "@/hooks/use-toast-position";

interface ProvidersProps {
  children: React.ReactNode;
  language: Language;
  translations: Translations;
}

export function Providers({
  children,
  language,
  translations,
}: ProvidersProps) {
  const toastPosition = useToastPosition();

  return (
    <I18nProvider language={language} translations={translations}>
      <SessionProvider>
        <TooltipProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster position={toastPosition} richColors style={peyda.style} />
        </TooltipProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
