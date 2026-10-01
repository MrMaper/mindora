"use client";

import { useTranslation } from "@/i18n/provider";
import { Card } from "@/components/ui/card";

export function ReportingPreviewColumns() {
  const t = useTranslation();
  const columns = [
    t.reporting.columns.dayOfWeek,
    t.reporting.columns.date,
    t.reporting.columns.totalWorkingHours,
    t.reporting.columns.workReport,
  ];
  const sampleCells = [
    t.reporting.sampleDay,
    t.reporting.sampleDate,
    t.reporting.sampleHours,
    t.reporting.sampleReport,
  ];

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {t.reporting.columnsTitle}
        </h3>
        <p className="text-xs text-text-tertiary">{t.reporting.columnsHint}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th
                  key={col}
                  className="px-2 py-2 text-start font-medium text-text-secondary"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {sampleCells.map((cell, index) => (
                <td
                  key={columns[index]}
                  className={
                    index === 3
                      ? "px-2 py-3 text-start text-text-secondary whitespace-pre-line"
                      : "px-2 py-3 text-start text-text-tertiary tabular-nums"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
