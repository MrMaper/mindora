"use client";

import * as React from "react";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Icon, type IconName } from "@/components/ui-kit/foundation/icon";
import { useLanguage, useTranslation } from "@/i18n/provider";
import {
  AREA_COLOR_PRESETS,
  AREA_ICON_PRESETS,
} from "@/lib/area-visual";
import { cn } from "@/lib/utils";

export type CreateAreaInput = {
  name: string;
  description: string;
  color: string | null;
  icon: string | null;
};

interface CreateAreaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAreaInput) => void;
  actionError: string | null;
  isPending: boolean;
  atCap?: boolean;
}

export function CreateAreaDrawer({
  isOpen,
  onClose,
  onSubmit,
  actionError,
  isPending,
  atCap = false,
}: CreateAreaDrawerProps) {
  const t = useTranslation();
  const language = useLanguage();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<string | null>(null);
  const [icon, setIcon] = React.useState<IconName | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setColor(null);
    setIcon(null);
    setNameError(null);
  }, [isOpen]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(
        language === "FA" ? "نام حوزه لازم است" : "Area name is required",
      );
      return;
    }
    if (trimmed.length > 100) {
      setNameError(
        language === "FA" ? "نام خیلی بلند است" : "Name is too long",
      );
      return;
    }
    const desc = description.trim();
    if (desc.length > 500) {
      setNameError(
        language === "FA" ? "توضیحات خیلی بلند است" : "Description is too long",
      );
      return;
    }
    setNameError(null);
    onSubmit({ name: trimmed, description: desc, color, icon });
  }

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      header={
        <span className="text-sm font-semibold text-foreground">
          {t.projects.newArea}
        </span>
      }
      footer={
        <div className="flex flex-col gap-2 w-full">
          {atCap ? (
            <p className="text-xs text-muted-foreground">
              {t.projects.maxAreasReached}
            </p>
          ) : null}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={isPending}
              disabled={atCap || isPending}
              onClick={handleSubmit}
            >
              {t.projects.createArea}
            </Button>
          </div>
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
        <Input
          label={t.projects.name}
          value={name}
          onChange={e => setName(e.target.value)}
          error={nameError ?? undefined}
          disabled={isPending || atCap}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label={t.projects.areaTagline}
            placeholder={t.projects.areaTaglinePlaceholder}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isPending || atCap}
            maxLength={120}
          />
          <p className="text-[11px] text-muted-foreground">
            {t.projects.areaTaglineHint}
          </p>
        </div>

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
                disabled={isPending || atCap}
                onClick={() => setColor(p.key)}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform",
                  color === p.key
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: p.cssVar }}
              />
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground underline px-1"
              disabled={isPending || atCap}
              onClick={() => setColor(null)}
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
                disabled={isPending || atCap}
                onClick={() => setIcon(p.key)}
                className={cn(
                  "aspect-square w-full rounded-md border flex items-center justify-center",
                  icon === p.key
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
