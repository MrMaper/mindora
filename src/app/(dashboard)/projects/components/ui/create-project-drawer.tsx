"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "@/i18n/provider";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import type { CreateProjectInput } from "@/schemas/projects";
import type { LifeArea } from "@/types/db";

interface CreateProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: Control<CreateProjectInput>;
    isPending: boolean;
  };
  onSubmit: () => void;
  actionError: string | null;
  isPending: boolean;
  areaOptions: { value: LifeArea; label: string }[];
}

export function CreateProjectDrawer({
  isOpen,
  onClose,
  form,
  onSubmit,
  actionError,
  isPending,
  areaOptions,
}: CreateProjectDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.projects.newPath}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" loading={isPending} onClick={onSubmit}>
            {t.projects.createProject}
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
            <ResolvedValidationText text={actionError} />
          </div>
        )}
        <Controller
          name="area"
          control={form.control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              label={t.projects.selectArea}
              options={areaOptions.map(o => ({
                value: o.value,
                label: o.label,
              }))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.projects.name}
              placeholder={t.projects.namePlaceholder}
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
