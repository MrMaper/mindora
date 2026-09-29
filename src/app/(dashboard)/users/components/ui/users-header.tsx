"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useTranslation } from "@/i18n/provider";

interface UsersHeaderProps {
  total: number;
  openCreate: () => void;
}

export function UsersHeader({ total = 0, openCreate }: UsersHeaderProps) {
  const t = useTranslation();

  return (
    <PageHeaderBar
      title={t.users.title}
      description={
        <>
          {total} {total === 1 ? t.users.admin : t.users.totalUsers}
        </>
      }
      actions={
        <Button variant="primary" icon="plus" onClick={openCreate}>
          {t.common.add} {t.users.title.toLowerCase()}
        </Button>
      }
    />
  );
}
