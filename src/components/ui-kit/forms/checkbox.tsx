"use client";

import * as React from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "checked" | "disabled" | "aria-indeterminate"
> {
  label?: string;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Checkbox({
  label,
  checked = false,
  indeterminate = false,
  disabled = false,
  className = "",
  id,
  onChange,
}: CheckboxProps): React.JSX.Element {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;
  const isControlled = checked !== undefined && onChange !== undefined;

  return (
    <ShadcnLabel
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <ShadcnCheckbox
        id={checkboxId}
        {...(isControlled ? { checked, onCheckedChange: onChange } : {})}
        disabled={disabled}
        // eslint-disable-next-line jsx-a11y/aria-props
        aria-indeterminate={indeterminate}
        className={cn(
          indeterminate &&
            "data-indeterminate:bg-action-primary data-indeterminate:border-action-primary",
        )}
      />
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </ShadcnLabel>
  );
}
