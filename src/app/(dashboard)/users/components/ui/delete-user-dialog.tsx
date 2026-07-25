"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import type { Translations } from "@/i18n";
import type { UserRow } from "@/features/users/types";

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  deleteTarget: UserRow | null;
  isPending: boolean;
  onDeleteConfirm: () => void;
}

export function DeleteUserDialog({
  open,
  onClose,
  t,
  deleteTarget,
  isPending,
  onDeleteConfirm,
}: DeleteUserDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.users.deleteUser}
      description={
        deleteTarget
          ? `${t.users.deleteConfirmPrefix} ${deleteTarget.name} ${t.users.deleteConfirmSuffix}`
          : ""
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" loading={isPending} onClick={onDeleteConfirm}>
            {t.users.deleteUser}
          </Button>
        </>
      }
    />
  );
}