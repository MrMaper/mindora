"use client";

import { useTranslation } from "@/i18n/provider";

export function ReportingHeader() {
  const t = useTranslation();

  return (
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
        {t.reporting.title}
      </h1>
      <p className="text-text-secondary mt-1 text-sm">{t.reporting.subtitle}</p>
    </div>
  );
}
