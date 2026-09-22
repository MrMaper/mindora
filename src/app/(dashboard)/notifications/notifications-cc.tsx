"use client";
import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { EmptyState } from "@/components/ui-kit/feedback/empty-state";
import { useNotifications } from "./use-notifications";
import type { GetNotificationsResult, NotificationRow } from "@/features/notifications/types";
import type { NotificationType, Language } from "@/types/db";
import type { IconName } from "@/components/ui-kit/foundation/icon";

interface NotificationsCCProps {
  initialData: GetNotificationsResult;
  page: number;
  language: Language;
}

const TYPE_ICON: Record<NotificationType, IconName> = {
  TASK_ASSIGNED: "user",
  TASK_UPDATED: "pencil",
  TASK_COMMENTED: "message-square",
  MENTION: "message-square",
  SPRINT_STARTED: "flag",
  SPRINT_ENDED: "flag",
  DEADLINE_APPROACHING: "clock",
  STATUS_CHANGED: "circle-dot",
  VOCAB_REVIEW_DUE: "language",
};

function formatTimestamp(date: Date, language: Language): string {
  return new Date(date).toLocaleString(language === "FA" ? "fa-IR" : undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsCC({ initialData, page, language }: NotificationsCCProps) {
  const n = useNotifications();
  const t = useTranslation();
  const { notifications, totalPages } = initialData;
  const unreadCount = notifications.filter((item: NotificationRow) => !item.read).length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {t.notifications.title}
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginTop: 2 }}>
              {unreadCount} {t.notifications.unread}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" icon="check" loading={n.isPending} onClick={n.onMarkAllAsRead}>
            {t.notifications.markAllRead}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="bell" title={t.notifications.noNotifications} />
      ) : (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
          {notifications.map(item => {
            const data = item.data as { href?: string; taskId?: string } | null;
            const href =
              data?.href ??
              (data?.taskId
                ? `/tasks?search=${encodeURIComponent(item.title.replace(/^[^:]+:\s*/, ""))}`
                : null);

            return (
            <div
              key={item.id}
              role={href ? "link" : undefined}
              tabIndex={href ? 0 : undefined}
              onClick={() => {
                if (!item.read) n.onMarkAsRead(item.id);
                if (href) window.location.href = href;
              }}
              onKeyDown={e => {
                if (!href) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!item.read) n.onMarkAsRead(item.id);
                  window.location.href = href;
                }
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderBottom: "1px solid var(--border-subtle)",
                background: item.read ? "transparent" : "var(--bg-selected)",
                cursor: href || !item.read ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "var(--radius-control)",
                  background: "var(--bg-sunken)",
                  color: "var(--text-secondary)",
                  flex: "none",
                }}
              >
                <Icon name={TYPE_ICON[item.type] ?? "bell"} size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: item.read ? "var(--weight-regular)" : "var(--weight-medium)", color: "var(--text-primary)" }}>
                  {item.title}
                </div>
                {item.body && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 2 }}>
                    {item.body}
                  </div>
                )}
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)", marginTop: 4 }}>
                  {formatTimestamp(item.createdAt, language)}
                </div>
              </div>
              {!item.read && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--action-primary)", flex: "none", marginTop: 4 }} />
              )}
            </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <Button
            variant="secondary"
            size="sm"
            icon="chevron-left"
            disabled={page <= 1}
            onClick={() => {
              window.location.href = `/notifications?page=${page - 1}`;
            }}
          >
            {t.users.previous}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconRight="chevron-right"
            disabled={page >= totalPages}
            onClick={() => {
              window.location.href = `/notifications?page=${page + 1}`;
            }}
          >
            {t.users.next}
          </Button>
        </div>
      )}
    </>
  );
}
