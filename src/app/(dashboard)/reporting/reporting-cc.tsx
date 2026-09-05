"use client";

import * as React from "react";
import { getTranslations } from "@/i18n";
import type { UserRow } from "@/features/users/types";
import type { Language } from "@/types/db";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Button } from "@/components/ui-kit/forms/button";

interface ReportingCCProps {
  users: UserRow[];
  language: Language;
}

export function ReportingCC({ users, language }: ReportingCCProps) {
  const t = getTranslations(language);

  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState<{
    from: Date | null;
    to: Date | null;
  } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const userOptions = [
    { value: "", label: t.reporting.selectUser },
    ...users.map(u => ({ value: u.id, label: u.name })),
  ];

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
          dateFrom: dateRange.from.toISOString().split("T")[0],
          dateTo: dateRange.to.toISOString().split("T")[0],
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
      let filename = `گزارش_ساعات_${dateRange.from.toISOString().split("T")[0]}_تا_${dateRange.to.toISOString().split("T")[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename\*=UTF-8''(.+)/,
        );
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

  const handleUserChange = (value: string) => {
    setSelectedUserId(value);
    setError(null);
  };

  const handleDateRangeChange = (
    range: { from: Date | null; to: Date | null } | null,
  ) => {
    setDateRange(range);
    setError(null);
  };

  const canGenerate = selectedUserId && dateRange?.from && dateRange?.to;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t.reporting.title}
          </h1>
          <p className="text-text-secondary mt-1">{t.reporting.subtitle}</p>
        </div>
      </div>

      {/* One-line Form */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 sm:w-48">
            <Select
              label={t.reporting.user}
              options={userOptions}
              value={selectedUserId}
              onChange={handleUserChange}
              placeholder={t.reporting.selectUser}
              required
              error={
                !selectedUserId && error === t.reporting.noUserSelected
                  ? t.reporting.noUserSelected
                  : undefined
              }
            />
          </div>

          <div className="flex-1 sm:w-72">
            <DatePicker
              mode="range"
              value={dateRange}
              onChange={handleDateRangeChange}
              label={t.reporting.dateRange}
              required
              numberOfMonths={2}
              showOutsideDays={false}
              error={
                (!dateRange?.from || !dateRange?.to) &&
                error === t.reporting.noDateRangeSelected
                  ? t.reporting.noDateRangeSelected
                  : undefined
              }
            />
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !canGenerate}
            size="lg"
            className="whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t.reporting.generating}
              </>
            ) : (
              <>
                <Icon name="download" size={16} className="mr-2" />
                {t.reporting.generateReport}
              </>
            )}
          </Button>
        </div>

        {error && (
          <div
            className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-muted/50">
        <h3 className="text-sm font-medium text-text-primary flex gap-2 items-center">
          <Icon name="info" size={16} className="inline-block" />
          راهنما
        </h3>
        <ul className="text-sm text-text-secondary space-y-2 rtl">
          <li>• ابتدا یک کاربر را از لیست انتخاب کنید</li>
          <li>• بازه زمانی مورد نظر را مشخص کنید (از تاریخ تا تاریخ)</li>
          <li>• روی دکمه «تولید گزارش» کلیک کنید</li>
          <li>• فایل اکسل به صورت خودکار دانلود خواهد شد</li>
          <li>
            • گزارش شامل روز هفته، تاریخ، ساعات کاری، ساعات اضافه‌کاری و گزارش
            کار هر روز می‌باشد
          </li>
        </ul>
      </Card>

      {/* Preview of Columns */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">
          ستون‌های گزارش
        </h3>
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
    </div>
  );
}
