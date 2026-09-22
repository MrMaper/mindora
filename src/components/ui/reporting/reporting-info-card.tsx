"use client";
import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Card } from "@/components/ui/card";
import type { Language } from "@/types/db";

interface ReportingInfoCardProps {
  language: Language;
}

export function ReportingInfoCard({ language }: ReportingInfoCardProps) {
  const t = useTranslation();

  return (
    <Card className="p-4 bg-muted/50">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        <Icon name="info" size={16} className="inline-block ml-1" />
        {t.reporting.guideTitle}
      </h3>
      <ul className="text-sm text-text-secondary space-y-2 rtl">
        <li>{t.reporting.guideStep1}</li>
        <li>{t.reporting.guideStep2}</li>
        <li>{t.reporting.guideStep3}</li>
        <li>{t.reporting.guideStep4}</li>
        <li>{t.reporting.guideStep5}</li>
      </ul>
    </Card>
  );
}