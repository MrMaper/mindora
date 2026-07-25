"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";

interface UsersHeaderProps {
  total: number;
  openCreate: () => void;
}

export function UsersHeader({ total = 0, openCreate }: UsersHeaderProps) {
  const t = useTranslation();

  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {t.users.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? t.users.admin : t.users.totalUsers}
        </p>
      </div>
      <Button variant="primary" icon="plus" onClick={openCreate}>
        {t.common.add} {t.users.title.toLowerCase()}
      </Button>
    </div>
  );
}
