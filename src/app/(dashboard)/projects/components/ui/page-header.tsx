"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";

interface PageHeaderProps {
  total: number;
  onCreate: () => void;
}

export function PageHeader({ total, onCreate }: PageHeaderProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {t.projects.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} {total === 1 ? t.projects.project : t.projects.projects}
        </p>
      </div>
      <Button variant="primary" icon="plus" onClick={onCreate}>
        {t.common.add} {t.projects.project.toLowerCase()}
      </Button>
    </div>
  );
}
