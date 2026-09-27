"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import type { WorkLogRow } from "@/features/work-logs/types";
import { useLanguage } from "@/i18n/provider";

interface WorkLogListProps {
  workLogs: WorkLogRow[];
  currentUserId: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function WorkLogList({ workLogs, currentUserId, onRefresh, isLoading = false }: WorkLogListProps) {
  const language = useLanguage();
  const t = language === "FA" ? listTranslations.fa : listTranslations.en;
  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const formatDate = (date: Date, locale: string, options?: Intl.DateTimeFormatOptions) => {
    return new Date(date).toLocaleDateString(locale, options ?? {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/work-logs/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        alert(result.error || t.deleteFailed);
      }
    } catch {
      alert(t.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-tertiary text-sm">
        {t.loading}
      </div>
    );
  }

  if (workLogs.length === 0) {
    return (
      <div className="p-8 text-center text-text-tertiary text-sm">
        {t.noWorkLogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {workLogs.map(log => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <Avatar name={log.user.name} src={log.user.avatar ?? undefined} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium text-text-primary">{log.user.name}</div>
              <div className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {log.hours}h
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <Icon name="calendar" size={12} className="text-text-tertiary" />
                {formatDate(log.date, dateLocale)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="clock" size={12} className="text-text-tertiary" />
                {formatDate(log.createdAt, dateLocale, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {log.description && (
              <div className="mt-2 text-sm text-text-secondary line-clamp-2">
                {log.description}
              </div>
            )}
          </div>

          {log.userId === currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-500/10"
              onClick={() => handleDelete(log.id)}
              disabled={deletingId === log.id}
              aria-label={t.delete}
            >
              <Icon name="trash" size={14} />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

const listTranslations = {
  en: {
    loading: "Loading...",
    noWorkLogs: "No time logged yet. Use “Log time” to start.",
    confirmDelete: "Delete this time entry?",
    deleteFailed: "Could not delete this time entry",
    delete: "Delete",
  },
  fa: {
    loading: "در حال بارگذاری...",
    noWorkLogs: "هنوز ساعتی ثبت نشده. برای شروع «ثبت ساعت» را بزن.",
    confirmDelete: "این ثبت ساعت حذف شود؟",
    deleteFailed: "حذف ثبت ساعت انجام نشد",
    delete: "حذف",
  },
};