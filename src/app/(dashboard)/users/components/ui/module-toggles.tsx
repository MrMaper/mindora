"use client";

import * as React from "react";
import { applyModuleToggle, MODULE_META, PRIMARY_MODULES, type ModuleFlags } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function ModuleToggles({
  value,
  onChange,
  language = "FA",
  disabled,
}: {
  value: ModuleFlags;
  onChange: (next: ModuleFlags) => void;
  language?: "FA" | "EN";
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        {language === "FA" ? "ماژول‌های فعال" : "Enabled modules"}
      </p>
      <div className="grid gap-2">
        {PRIMARY_MODULES.map(key => {
          const meta = MODULE_META[key];
          const checked = value[key];
          const deps = meta.dependsOn ?? [];
          const depBlocked = deps.some(d => !value[d]);
          return (
            <label
              key={key}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm",
                disabled || depBlocked ? "opacity-60" : "hover:bg-accent/40",
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checked}
                disabled={disabled || (depBlocked && !checked)}
                onChange={e => onChange(applyModuleToggle(value, key, e.target.checked))}
              />
              <span className="min-w-0">
                <span className="font-medium text-foreground">
                  {language === "FA" ? meta.fa : meta.en}
                </span>
                {deps.length > 0 && (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {language === "FA"
                      ? `وابسته به: ${deps.map(d => MODULE_META[d].fa).join("، ")}`
                      : `Depends on: ${deps.map(d => MODULE_META[d].en).join(", ")}`}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Hidden inputs for server FormData submit. */
export function ModuleFlagsFields({ value }: { value: ModuleFlags }) {
  return (
    <>
      {PRIMARY_MODULES.map(key => (
        <input
          key={key}
          type="hidden"
          name={`module_${key}`}
          value={value[key] ? "true" : "false"}
        />
      ))}
    </>
  );
}
