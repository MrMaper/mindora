"use client";

import * as React from "react";
import type { Language } from "@/types/db";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function resolveLanguage(): Language {
  if (typeof document === "undefined") return "FA";
  const lang = document.documentElement.lang?.toLowerCase() ?? "";
  if (lang.startsWith("en")) return "EN";
  return "FA";
}

/** Inline copy so the error UI never pulls both locale modules. */
const COPY = {
  FA: {
    error: "خطا",
    errorDescription:
      "مشکلی پیش آمد. صفحه را دوباره بارگذاری کنید یا اگر ادامه داشت با پشتیبانی تماس بگیرید.",
    reloadPage: "بارگذاری مجدد",
    goHome: "بازگشت به داشبورد",
  },
  EN: {
    error: "Error",
    errorDescription:
      "Something went wrong. Reload the page, or contact support if it keeps happening.",
    reloadPage: "Reload page",
    goHome: "Back to dashboard",
  },
} as const;

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const language = resolveLanguage();
      const t = COPY[language];
      const isRtl = language === "FA";

      return (
        <div
          className="relative flex min-h-[min(70dvh,560px)] w-full items-center justify-center overflow-hidden px-4 py-10"
          dir={isRtl ? "rtl" : "ltr"}
          role="alert"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--brand-50)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom,_var(--red-tint)_0%,_transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(var(--gray-300) 0.6px, transparent 0.6px)",
              backgroundSize: "18px 18px",
              maskImage:
                "radial-gradient(ellipse at center, black 20%, transparent 75%)",
            }}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-8 text-center shadow-lg backdrop-blur-sm">
            <div
              className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[var(--red-tint)] text-[var(--status-blocked)] shadow-sm ring-1 ring-[var(--status-blocked)]/15"
              role="img"
              aria-label={t.error}
            >
              <Icon name="alert-triangle" size={28} />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t.error}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t.errorDescription}
            </p>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="primary"
                icon="rotate-ccw"
                onClick={this.handleReload}
                className="min-w-36"
              >
                {t.reloadPage}
              </Button>
              <Button
                variant="subtle"
                onClick={this.handleHome}
                className="min-w-36"
              >
                {t.goHome}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
