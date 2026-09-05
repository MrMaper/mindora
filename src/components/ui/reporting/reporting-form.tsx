"use client";

import * as React from "react";
import { getTranslations } from "@/i18n";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Button } from "@/components/ui-kit/forms/button";
import type { UserRow } from "@/features/users/types";
import type { Language } from "@/types/db";

interface ReportingFormProps {
  users: UserRow[];
  language: Language;
  selectedUserId: string;
  dateRange: { from: Date | null; to: Date | null } | null;
  isGenerating: boolean;
  error: string | null;
  onUserChange: (value: string) => void;
  onDateRangeChange: (range: { from: Date | null; to: Date | null } | null) => void;
  onGenerate: () => void;
}

export function ReportingForm({
  users,
  language,
  selectedUserId,
  dateRange,
  isGenerating,
  error,
  onUserChange,
  onDateRangeChange,
  onGenerate,
}: ReportingFormProps) {
  const t = getTranslations(language);

  const userOptions = [
    { value: "", label: t.reporting.selectUser },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  const canGenerate = selectedUserId && dateRange?.from && dateRange?.to;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-end gap-3">
        <div className="flex-1 sm:w-48">
          <Select
            label={t.reporting.user}
            options={userOptions}
            value={selectedUserId}
            onChange={onUserChange}
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
            onChange={onDateRangeChange}
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
          onClick={onGenerate}
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
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}