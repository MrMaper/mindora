import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
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
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {t.tasks.title}
        </h1>
        <p className="text-sm text-text-tertiary mt-0.5">
          {total} {t.tasks.totalTasks}
        </p>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <Button variant="secondary" icon="flag" onClick={onLabelDialogOpen}>
            {t.tasks.manageLabels}
          </Button>
        )}
        <Button variant="primary" icon="plus" onClick={onCreate}>
          {t.tasks.createTaskButton}
        </Button>
      </div>
    </div>
  );
}
