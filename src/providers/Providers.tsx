"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { peyda } from "@/lib/font";
import { I18nProvider } from "@/i18n/provider";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";
import { useToastPosition } from "@/hooks/use-toast-position";
import { AppDialogsProvider } from "@/components/ui-kit/overlays/app-dialogs";

interface ProvidersProps {
  children: React.ReactNode;
  language: Language;
  translations: Translations;
}

/**
 * Clear a prior page error on navigation — without remounting the tree.
 * Remounting via key={pathname} used to wipe in-flight UI (product tour, etc.).
 */
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

export function Providers({
  children,
  language,
  translations,
}: ProvidersProps) {
  const toastPosition = useToastPosition();

  return (
    <I18nProvider language={language} translations={translations}>
      <AppDialogsProvider>
        <SessionProvider>
          <TooltipProvider>
            <RouteErrorBoundary>{children}</RouteErrorBoundary>
            <Toaster position={toastPosition} richColors style={peyda.style} />
          </TooltipProvider>
        </SessionProvider>
      </AppDialogsProvider>
    </I18nProvider>
  );
}
