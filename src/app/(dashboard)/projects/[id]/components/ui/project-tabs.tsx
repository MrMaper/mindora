"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { Translations } from "@/i18n";

type TabId = "overview" | "tasks" | "members";

interface ProjectTabsProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  t: Translations;
  taskCount: number;
  memberCount: number;
}

export function ProjectTabs({ activeTab, setActiveTab, t, taskCount, memberCount }: ProjectTabsProps) {
  const tabs = [
    { id: "overview" as TabId, label: t.projects.overview, count: taskCount },
    { id: "tasks" as TabId, label: t.projects.tasks, count: taskCount },
    { id: "members" as TabId, label: t.projects.members, count: memberCount },
  ];

  return (
    <div className="border-b border-border-default">
      <nav className="flex gap-6 px-1" aria-label="Project sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}