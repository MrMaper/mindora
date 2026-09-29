import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
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
      title={t.tasks.title}
      description={
        <>
          {total} {t.tasks.totalTasks}
        </>
      }
      actions={
        <>
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
