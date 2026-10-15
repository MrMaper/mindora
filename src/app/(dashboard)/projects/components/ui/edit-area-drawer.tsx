"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { UpdateAreaBucketInput } from "@/schemas/projects";
import type { AreaPrefRow } from "@/features/projects/types";
import {
  AREA_COLOR_PRESETS,
  AREA_ICON_PRESETS,
  resolveAreaIconName,
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
  const selectedIcon = resolveAreaIconName(pref.icon, "home");

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
            <div className="flex flex-col gap-1.5">
              <Input
                {...field}
                label={t.projects.areaTagline}
                placeholder={t.projects.areaTaglinePlaceholder}
                error={fieldState.error?.message}
                maxLength={120}
              />
              <p className="text-[11px] text-muted-foreground">
                {t.projects.areaTaglineHint}
              </p>
            </div>
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
          <div className="grid w-full grid-cols-7 gap-1.5">
            {AREA_ICON_PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                title={language === "FA" ? p.labelFa : p.labelEn}
                onClick={() => onPrefChange({ icon: p.key })}
                className={cn(
                  "aspect-square w-full rounded-md border flex items-center justify-center",
                  selectedIcon === p.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-default text-foreground/80 hover:bg-bg-hover hover:text-foreground",
                )}
              >
                <Icon name={p.key} size={17} strokeWidth={2.1} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
