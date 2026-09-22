"use client";

import * as React from "react";
import { useTranslation } from "@/i18n/provider";

type TabId = "overview" | "tasks" | "members";

interface ProjectTabsProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  taskCount: number;
  memberCount: number;
}

export function ProjectTabs({
  activeTab,
  setActiveTab,
  taskCount,
  memberCount,
}: ProjectTabsProps) {
  const t = useTranslation();

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: t.projects.overview },
    { id: "tasks", label: t.projects.tasks, count: taskCount },
    { id: "members", label: t.projects.members, count: memberCount },
  ];

  return (
    <div className="border-b border-border-default mb-4">
      <nav className="flex gap-4" aria-label={t.projects.pathDetail}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-bg-sunken text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </div>
  );
}
