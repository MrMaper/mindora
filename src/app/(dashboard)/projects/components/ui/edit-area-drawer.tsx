"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { UpdateAreaBucketInput } from "@/schemas/projects";
import type { AreaPrefRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";
import {
  AREA_COLOR_PRESETS,
  AREA_ICON_PRESETS,
} from "@/lib/area-visual";
import { cn } from "@/lib/utils";

interface EditAreaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: Control<UpdateAreaBucketInput>;
    isPending: boolean;
  };
  areaName: string | null;
  area: LifeArea;
  pref: AreaPrefRow;
  onPrefChange: (patch: {
    color?: string | null;
    icon?: string | null;
  }) => void;
  onSubmit: () => void;
  actionError: string | null;
  isPending: boolean;
}

export function EditAreaDrawer({
  isOpen,
  onClose,
  form,
  areaName,
  pref,
  onPrefChange,
  onSubmit,
  actionError,
  isPending,
}: EditAreaDrawerProps) {
  const t = useTranslation();
  const language = useLanguage();

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
            <ResolvedValidationText text={actionError} />
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

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.projects.colorPreset}
          </p>
          <div className="flex flex-wrap gap-2">
            {AREA_COLOR_PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                title={language === "FA" ? p.labelFa : p.labelEn}
                onClick={() => onPrefChange({ color: p.key })}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform",
                  pref.color === p.key
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: p.cssVar }}
              />
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground underline px-1"
              onClick={() => onPrefChange({ color: null })}
            >
              {language === "FA" ? "پیش‌فرض" : "Default"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.projects.iconPreset}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AREA_ICON_PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPrefChange({ icon: p.key })}
                className={cn(
                  "size-9 rounded-md border text-lg flex items-center justify-center",
                  pref.icon === p.key
                    ? "border-primary bg-primary/10"
                    : "border-border-default hover:bg-bg-hover",
                )}
              >
                {p.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
