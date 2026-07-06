"use client";

import * as React from "react";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "checked" | "disabled" | "role"> {
  label?: string;
  onChange?: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  label,
  checked = false,
  disabled = false,
  className = "",
  id,
  onChange,
}: SwitchProps): React.JSX.Element {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  const handleChange = (newChecked: boolean) => {
    onChange?.(newChecked);
  };

  return (
    <ShadcnLabel className={cn("flex items-center gap-2.5 cursor-pointer", disabled && "opacity-50 pointer-events-none", className)}>
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        disabled={disabled}
        role="switch"
        onCheckedChange={handleChange}
      />
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </ShadcnLabel>
  );
}