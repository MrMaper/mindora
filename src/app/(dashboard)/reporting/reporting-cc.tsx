"use client";

import { useTranslation } from "@/i18n/provider";
import * as React from "react";
import type { UserRow } from "@/features/users/types";
import type { Language } from "@/types/db";
import { Card } from "@/components/ui/card";
import {
  ReportingHeader,
  ReportingForm,
  ReportingInfoCard,
  ReportingPreviewColumns,
} from "@/components/ui/reporting";
import { zonedDateKey } from "@/lib/life";

interface ReportingCCProps {
  users: UserRow[];
  language: Language;
  currentUserId: string;
}

export function ReportingCC({
  users,
  language,
  currentUserId,
}: ReportingCCProps) {
  const t = useTranslation();

  const [selectedUserId, setSelectedUserId] = React.useState<string>(
    () => users.find(u => u.id === currentUserId)?.id ?? users[0]?.id ?? "",
  );
  const [dateRange, setDateRange] = React.useState<{
    from: Date | null;
    to: Date | null;
  } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!selectedUserId) {
      setError(t.reporting.noUserSelected);
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      setError(t.reporting.noDateRangeSelected);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/reporting/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          dateFrom: zonedDateKey(dateRange.from),
          dateTo: zonedDateKey(dateRange.to),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.reporting.downloadError);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `گزارش_ساعات_${zonedDateKey(dateRange.from)}_تا_${zonedDateKey(dateRange.to)}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.reporting.downloadError);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      <ReportingHeader />

      <Card className="p-4">
        <ReportingForm
          users={users}
          language={language}
          selectedUserId={selectedUserId}
          dateRange={dateRange}
          isGenerating={isGenerating}
          error={error}
          onUserChange={value => {
            setSelectedUserId(value);
            setError(null);
          }}
          onDateRangeChange={range => {
            setDateRange(range);
            setError(null);
          }}
          onGenerate={handleGenerateReport}
        />
      </Card>

      <ReportingInfoCard />
      <ReportingPreviewColumns />
    </div>
  );
}
