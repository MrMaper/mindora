"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { WorkLogForm } from "./work-log-form";
import { WorkLogList } from "./work-log-list";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import type { WorkLogRow } from "@/features/work-logs/types";
import { useLanguage } from "@/i18n/provider";

interface WorkLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  workLogs: WorkLogRow[];
  totalHours: number;
  onRefresh: () => void;
  currentUserId: string;
  isLoading?: boolean;
}

export function WorkLogDrawer({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  workLogs,
  totalHours,
  onRefresh,
  currentUserId,
  isLoading = false,
}: WorkLogDrawerProps) {
  const language = useLanguage();
  const t = language === "FA" ? workLogTranslations.fa : workLogTranslations.en;

  const [activeTab, setActiveTab] = React.useState<"list" | "create">("list");

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      wide
      header={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-text-primary truncate pr-4">
            {t.workLogs} - {taskTitle}
          </span>
          <div className="flex items-center gap-2">
            <div className="text-xs text-text-secondary bg-primary/10 px-2 py-1 rounded-full">
              {t.totalHours}: {totalHours.toFixed(2)}h
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                setActiveTab(activeTab === "list" ? "create" : "list")
              }
              aria-label={activeTab === "list" ? t.addWorkLog : t.backToList}
            >
              <Icon
                name={activeTab === "list" ? "plus" : "chevron-left"}
                size={16}
              />
            </Button>
          </div>
        </div>
      }
    >
      <div className="py-2">
        {activeTab === "list" ? (
          <WorkLogList
            workLogs={workLogs}
            currentUserId={currentUserId}
            onRefresh={onRefresh}
            isLoading={isLoading}
          />
        ) : (
          <WorkLogForm
            taskId={taskId}
            onSubmit={onRefresh}
            onClose={() => setActiveTab("list")}
          />
        )}
      </div>
    </Drawer>
  );
}

const workLogTranslations = {
  en: {
    workLogs: "Work Logs",
    totalHours: "Total",
    addWorkLog: "Add Work Log",
    backToList: "Back to List",
  },
  fa: {
    workLogs: "لاگ‌های کاری",
    totalHours: "مجموع",
    addWorkLog: "افزودن لاگ",
    backToList: "بازگشت به لیست",
  },
};
