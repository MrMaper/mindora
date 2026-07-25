"use client";

import * as React from "react";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  t: {
    deleteProject: string;
    deleteConfirmPrefix: string;
    deleteConfirmSuffix: string;
    common: {
      cancel: string;
    };
  };
  projectName: string | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  t,
  projectName,
  onConfirm,
  isPending,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t.deleteProject}
      description={`${t.deleteConfirmPrefix} ${projectName} ${t.deleteConfirmSuffix}`}
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
            {t.deleteProject}
          </Button>
        </>
      }
    />
  );
}