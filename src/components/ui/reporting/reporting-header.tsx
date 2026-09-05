"use client";

import * as React from "react";
import { getTranslations } from "@/i18n";
import type { Language } from "@/types/db";

interface ReportingHeaderProps {
  language: Language;
}

export function ReportingHeader({ language }: ReportingHeaderProps) {
  const t = getTranslations(language);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t.reporting.title}</h1>
        <p className="text-text-secondary mt-1">{t.reporting.subtitle}</p>
      </div>
    </div>
  );
}