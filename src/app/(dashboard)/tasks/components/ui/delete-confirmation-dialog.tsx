"use client";

import * as React from "react";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import type { Translations } from "@/i18n";
import type { TaskRow } from "@/features/tasks/types";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskRow | null;
  t: Translations["tasks"];
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  task,
  t,
  onConfirm,
  isPending,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t.deleteTask}
      description={`${t.deleteConfirmPrefix} ${task?.title} ${t.deleteConfirmSuffix}`}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={onConfirm}
          >
            {t.deleteTask}
          </Button>
        </>
      }
    />
  );
}