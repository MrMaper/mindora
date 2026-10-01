"use client";

import * as React from "react";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { formatOnlineDuration } from "@/lib/presence";
import type { UserActivityStats } from "@/features/users/types";

export function UsersActivityStatsBar({ stats }: { stats: UserActivityStats }) {
  const t = useTranslation();
  const language = useLanguage();

  const cards = [
    {
      key: "online",
      label: t.users.statsOnlineNow,
      value: String(stats.onlineNow),
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "today",
      label: t.users.statsLoggedInToday,
      value: String(stats.loggedInToday),
      accent: "text-foreground",
    },
    {
      key: "active",
      label: t.users.statsActiveAccounts,
      value: String(stats.activeUsers),
      accent: "text-foreground",
    },
    {
      key: "totalTime",
      label: t.users.statsTotalOnline,
      value: formatOnlineDuration(stats.totalOnlineSeconds, language),
      accent: "text-foreground",
    },
  ] as const;

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.key}
          className="rounded-xl border border-border bg-card px-3 py-2.5"
        >
          <div className="text-[11px] font-medium text-muted-foreground">
            {card.label}
          </div>
          <div
            className={`mt-0.5 text-lg font-semibold tabular-nums tracking-tight ${card.accent}`}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
