"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";
import type { UpdateAreaBucketInput } from "@/schemas/projects";

interface EditAreaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: Control<UpdateAreaBucketInput>;
    isPending: boolean;
  };
  areaName: string | null;
  onSubmit: () => void;
  actionError: string | null;
  isPending: boolean;
}

export function EditAreaDrawer({
  isOpen,
  onClose,
  form,
  areaName,
  onSubmit,
  actionError,
  isPending,
}: EditAreaDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.projects.editArea}
          {areaName ? ` — ${areaName}` : ""}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" loading={isPending} onClick={onSubmit}>
            {t.projects.saveChanges}
          </Button>
        </div>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {actionError && (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
          >
            {actionError}
          </div>
        )}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.projects.name}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.projects.description}
              placeholder={t.projects.descriptionPlaceholder}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </Drawer>
  );
}
