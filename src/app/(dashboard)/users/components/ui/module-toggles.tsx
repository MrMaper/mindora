"use client";

import * as React from "react";
import {
  MODULE_META,
  MODULE_PRESETS,
  PRIMARY_MODULES,
  type ModulePolicy,
  type ModulePolicyState,
  type ModulePresetId,
} from "@/lib/modules";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<ModulePolicyState, { fa: string; en: string }> = {
  off: { fa: "خاموش", en: "Off" },
  on: { fa: "روشن (ثابت)", en: "On (locked)" },
  member_choice: { fa: "به انتخاب کاربر", en: "Member's choice" },
};

const PRESET_LABEL: Record<ModulePresetId, { fa: string; en: string }> = {
  starter: { fa: "شروع ساده", en: "Starter" },
  full: { fa: "همه‌چیز", en: "Full" },
};

function samePolicy(a: ModulePolicy, b: ModulePolicy): boolean {
  return PRIMARY_MODULES.every(k => a[k] === b[k]);
}

/** Which preset the value matches, or "custom". */
export function presetOf(value: ModulePolicy): ModulePresetId | "custom" {
  if (samePolicy(value, MODULE_PRESETS.starter)) return "starter";
  if (samePolicy(value, MODULE_PRESETS.full)) return "full";
  return "custom";
}

export function ModulePolicyEditor({
  value,
  onChange,
  language = "FA",
  disabled,
}: {
  value: ModulePolicy;
  onChange: (next: ModulePolicy) => void;
  language?: "FA" | "EN";
  disabled?: boolean;
}) {
  const fa = language === "FA";
  const current = presetOf(value);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          {fa ? "دسترسی به قابلیت‌ها" : "Feature access"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {fa
            ? "«به انتخاب کاربر» یعنی کاربر می‌تواند آن را خودش خاموش یا روشن کند. «ثابت» یعنی کاربر نمی‌تواند خاموشش کند."
            : "“Member's choice” lets the member turn it on or off. “Locked” keeps it on."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="preset">
        {(Object.keys(MODULE_PRESETS) as ModulePresetId[]).map(id => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...MODULE_PRESETS[id] })}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              current === id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {fa ? PRESET_LABEL[id].fa : PRESET_LABEL[id].en}
          </button>
        ))}
        <span
          className={cn(
            "rounded-md border px-3 py-1 text-xs font-medium",
            current === "custom"
              ? "border-primary bg-primary/10 text-primary"
              : "border-dashed border-border text-muted-foreground",
          )}
        >
          {fa ? "سفارشی" : "Custom"}
        </span>
      </div>

      <div className="grid gap-2">
        {PRIMARY_MODULES.map(key => {
          const meta = MODULE_META[key];
          const deps = meta.dependsOn ?? [];
          const blocked = deps.filter(d => value[d] === "off");
          return (
            <label
              key={key}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
                disabled && "opacity-60",
              )}
            >
              <span className="min-w-0">
                <span className="font-medium text-foreground">
                  {fa ? meta.fa : meta.en}
                </span>
                {deps.length > 0 && (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {blocked.length > 0
                      ? fa
                        ? `غیرفعال می‌ماند چون «${blocked.map(d => MODULE_META[d].fa).join("، ")}» خاموش است`
                        : `Stays off because ${blocked.map(d => MODULE_META[d].en).join(", ")} is off`
                      : fa
                        ? `وابسته به: ${deps.map(d => MODULE_META[d].fa).join("، ")}`
                        : `Depends on: ${deps.map(d => MODULE_META[d].en).join(", ")}`}
                  </span>
                )}
              </span>
              <select
                value={value[key]}
                disabled={disabled}
                onChange={e =>
                  onChange({
                    ...value,
                    [key]: e.target.value as ModulePolicyState,
                  })
                }
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                {(Object.keys(STATE_LABEL) as ModulePolicyState[]).map(s => (
                  <option key={s} value={s}>
                    {fa ? STATE_LABEL[s].fa : STATE_LABEL[s].en}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}
