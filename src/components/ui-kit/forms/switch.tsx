"use client";

import * as React from "react";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "checked" | "disabled" | "role"
> {
  label?: string;
  onChange?: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  label,
  checked,
  disabled = false,
  className = "",
  id,
  onChange,
}: SwitchProps): React.JSX.Element {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;
  const isControlled = checked !== undefined && onChange !== undefined;
  // const isControlled = onChange !== undefined;

  return (
    <ShadcnLabel
      className={cn(
        "flex items-center gap-2.5 cursor-pointer",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <ShadcnSwitch
        id={switchId}
        {...(isControlled
          ? { checked, onCheckedChange: onChange }
          : { checked })}
        disabled={disabled}
        role="switch"
      />
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </ShadcnLabel>
  );
}
