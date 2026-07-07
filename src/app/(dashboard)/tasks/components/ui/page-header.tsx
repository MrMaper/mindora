"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import type { Translations } from "@/i18n";
import type { UseTasksReturn } from "./use-tasks";

export interface PageHeaderProps {
  t: Translations["tasks"];
  total: number;
  onLabelDialogOpen: UseTasksReturn["onLabelDialogOpen"];
  onCreate: UseTasksReturn["openCreate"];
}

export function PageHeader({
  t,
  total,
  onLabelDialogOpen,
  onCreate,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {t.title}
        </h1>
        <p className="text-sm text-text-tertiary mt-0.5">
          {total} {t.totalTasks}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon="flag" onClick={onLabelDialogOpen}>
          {t.manageLabels}
        </Button>
        <Button variant="primary" icon="plus" onClick={onCreate}>
          {t.createTaskButton}
        </Button>
      </div>
    </div>
  );
}