"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { LabelRow } from "@/features/labels/types";
import type { Translations } from "@/i18n";

interface LabelManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: ReturnType<typeof import("react-hook-form").useForm>["control"];
    handleSubmit: (fn: (data: any) => void) => (e: React.BaseSyntheticEvent) => void;
    isPending: boolean;
  };
  labels: LabelRow[];
  t: Translations["tasks"];
  onCreateSubmit: (data: any) => void;
  onDeleteLabel: (id: string) => void;
  labelError: string | null;
  isPending: boolean;
}

export function LabelManagementDialog({
  isOpen,
  onClose,
  form,
  labels,
  t,
  onCreateSubmit,
  onDeleteLabel,
  labelError,
  isPending,
}: LabelManagementDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t.manageLabels}
    >
      <div className="flex flex-col gap-4">
        {labelError && (
          <div
            className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm"
            role="alert"
          >
            {labelError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onCreateSubmit)} className="flex gap-2 items-end">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.labelName}
                error={fieldState.error?.message}
                className="flex-1"
              />
            )}
          />
          <Controller
            name="color"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="color"
                label={t.labelColor}
                error={fieldState.error?.message}
                className="w-14 p-[2px]"
              />
            )}
          />
          <Button type="submit" variant="primary" loading={isPending}>
            {t.createLabel}
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {labels.length === 0 ? (
            <div className="text-sm text-text-tertiary">
              {t.noLabels}
            </div>
          ) : (
            labels.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-2 border border-border-subtle rounded-(--radius-control)"
              >
                <Tag color={l.color}>{l.name}</Tag>
                <IconButton
                  icon="trash"
                  aria-label={t.common.delete}
                  size="sm"
                  onClick={() => onDeleteLabel(l.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}