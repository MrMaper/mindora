import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { PageTourButton } from "@/components/tour/page-tour-button";
import { useTranslation } from "@/i18n/provider";

export interface PageHeaderProps {
  total: number;
  onLabelDialogOpen: () => void;
  onCreate: () => void;
  currentUserRole: string;
}

export function PageHeader({
  total,
  onLabelDialogOpen,
  onCreate,
  currentUserRole,
}: PageHeaderProps) {
  const t = useTranslation();
  const isAdmin = currentUserRole === "ADMIN";

  return (
    <PageHeaderBar
      tourId="page-tasks"
      title={t.tasks.title}
      meta={
        <>
          {total} {t.tasks.totalTasks}
        </>
      }
      actions={
        <>
          <PageTourButton tourId="tasks" />
          {isAdmin && (
            <Button variant="secondary" icon="flag" onClick={onLabelDialogOpen}>
              {t.tasks.manageLabels}
            </Button>
          )}
          <Button variant="primary" icon="plus" onClick={onCreate}>
            {t.tasks.createTaskButton}
          </Button>
        </>
      }
    />
  );
}
