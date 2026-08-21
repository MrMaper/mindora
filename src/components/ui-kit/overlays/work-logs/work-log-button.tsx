"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { WorkLogDrawer } from "@/components/ui-kit/overlays/work-logs";
import type { WorkLogRow } from "@/features/work-logs/types";
import { useLanguage } from "@/i18n/provider";

interface WorkLogButtonProps {
  taskId: string;
  taskTitle: string;
  assignedToId: string | null;
  currentUserId: string;
  currentUserRole: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function WorkLogButton({
  taskId,
  taskTitle,
  assignedToId,
  currentUserId,
  currentUserRole,
  className = "",
  isOpen = false,
  onClose,
}: WorkLogButtonProps) {
  const language = useLanguage();
  const t = language === "FA" ? buttonTranslations.fa : buttonTranslations.en;

  const [showDrawer, setShowDrawer] = React.useState(isOpen);
  
  React.useEffect(() => {
    setShowDrawer(isOpen);
  }, [isOpen]);
  const [workLogs, setWorkLogs] = React.useState<WorkLogRow[]>([]);
  const [totalHours, setTotalHours] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const isAssignee = assignedToId === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canLogWork = isAdmin || isAssignee;

  const loadWorkLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/work-logs`);
      const result = await response.json();
      if (result.success) {
        setWorkLogs(result.data.workLogs);
        setTotalHours(result.data.totalHours);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  const onRefresh = React.useCallback(() => {
    loadWorkLogs();
  }, [loadWorkLogs]);

  React.useEffect(() => {
    if (showDrawer) {
      loadWorkLogs();
    }
  }, [showDrawer, loadWorkLogs]);

  if (!canLogWork) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDrawer(true)}
        className={className}
        aria-label={t.workLogs}
        title={t.workLogs}
      >
        <Icon name="clock" size={14} />
      </Button>

      <WorkLogDrawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          onClose?.();
        }}
        taskId={taskId}
        taskTitle={taskTitle}
        workLogs={workLogs}
        totalHours={totalHours}
        onRefresh={onRefresh}
        currentUserId={currentUserId}
        isLoading={isLoading}
      />
    </>
  );
}

const buttonTranslations = {
  en: {
    workLogs: "Work Logs",
  },
  fa: {
    workLogs: "لاگ‌های کاری",
  },
};