"use client";

import { useTranslation } from "@/i18n/provider";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Card } from "@/components/ui/card";

export function ReportingInfoCard() {
  const t = useTranslation();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm leading-5 text-text-secondary">
        <Icon name="info" size={15} className="shrink-0 text-current" />
        <p>{t.reporting.tip}</p>
      </div>
    </Card>
  );
}
