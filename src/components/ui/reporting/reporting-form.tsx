"use client";

import { useTranslation } from "@/i18n/provider";
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
  onDateRangeChange: (
    range: { from: Date | null; to: Date | null } | null,
  ) => void;
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
  const t = useTranslation();

  const userOptions = [
    { value: "", label: t.reporting.selectUser },
    ...users.map(u => ({ value: u.id, label: u.name })),
  ];

  const canGenerate = Boolean(selectedUserId && dateRange?.from && dateRange?.to);
  const showUserPicker = users.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {showUserPicker ? (
          <div className="w-full sm:w-48">
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
        ) : null}

        <div className="w-full sm:w-72">
          <DatePicker
            mode="range"
            value={dateRange}
            onChange={onDateRangeChange}
            label={t.reporting.dateRange}
            language={language}
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
          variant="primary"
          icon="download"
          onClick={onGenerate}
          disabled={!canGenerate}
          loading={isGenerating}
          className="whitespace-nowrap"
        >
          {isGenerating ? t.reporting.generating : t.reporting.generateReport}
        </Button>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
