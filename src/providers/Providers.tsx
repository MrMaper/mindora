"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { peyda } from "@/lib/font";
import { I18nProvider } from "@/i18n/provider";
import type { Language } from "@/types/db";
import { useToastPosition } from "@/hooks/use-toast-position";

interface ProvidersProps {
  children: React.ReactNode;
  language: Language;
}

export function Providers({ children, language }: ProvidersProps) {
  const toastPosition = useToastPosition();

  return (
    <I18nProvider language={language}>
      <SessionProvider>
        <TooltipProvider>
          <QueryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </QueryProvider>
          <Toaster position={toastPosition} richColors style={peyda.style} />
        </TooltipProvider>
      </SessionProvider>
    </I18nProvider>
  );
}
