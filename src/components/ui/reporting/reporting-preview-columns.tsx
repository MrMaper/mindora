"use client";

import * as React from "react";
import { getTranslations } from "@/i18n";
import { Card } from "@/components/ui/card";
import type { Language } from "@/types/db";

interface ReportingPreviewColumnsProps {
  language: Language;
}

export function ReportingPreviewColumns({ language }: ReportingPreviewColumnsProps) {
  const t = getTranslations(language);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">ستون‌های گزارش</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-border">
              {[
                t.reporting.columns.dayOfWeek,
                t.reporting.columns.date,
                t.reporting.columns.totalWorkingHours,
                t.reporting.columns.totalOvertimeHours,
                t.reporting.columns.workReport,
              ].map((col, i) => (
                <th key={i} className="p-2 font-medium text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="p-2 text-center text-text-tertiary">شنبه</td>
              <td className="p-2 text-center text-text-tertiary">۱۵ خرداد</td>
              <td className="p-2 text-center text-text-tertiary">08:00</td>
              <td className="p-2 text-center text-text-tertiary">00:00</td>
              <td className="p-2 text-text-tertiary">
                1. انجام تسک فرانت‌اند (04:00)
                <br />
                2. کد ریویو (02:00)
                <br />
                3. میتینگ تیم (02:00)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}