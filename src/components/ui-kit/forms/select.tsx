"use client";

import * as React from "react";
import {
  Select as ShadcnSelect,
  SelectTrigger as ShadcnSelectTrigger,
  SelectContent as ShadcnSelectContent,
  SelectItem as ShadcnSelectItem,
  SelectValue as ShadcnSelectValue,
} from "@/components/ui/select";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: (string | SelectOption)[];
  onChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Select({
  label,
  hint,
  error,
  required = false,
  options = [],
  placeholder,
  id,
  className = "",
  onChange,
  value,
  disabled = false,
  style,
}: SelectProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const handleChange = (val: string | string[] | null) => {
    const newValue = Array.isArray(val) ? val[0] : val;
    onChange?.(newValue ?? "");
  };

  return (
    <div className="w-full" style={style}>
      {label && (
        <ShadcnLabel htmlFor={fieldId} className="mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </ShadcnLabel>
      )}
      <ShadcnSelect
        value={value ?? ""}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <ShadcnSelectTrigger
          id={fieldId}
          className={cn(
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
        >
          <ShadcnSelectValue placeholder={placeholder} />
        </ShadcnSelectTrigger>
        <ShadcnSelectContent>
          {placeholder && (
            <ShadcnSelectItem value="" disabled>
              {placeholder}
            </ShadcnSelectItem>
          )}
          {options.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return (
              <ShadcnSelectItem key={val} value={val}>
                {lbl}
              </ShadcnSelectItem>
            );
          })}
        </ShadcnSelectContent>
      </ShadcnSelect>
      {(hint || error) && (
        <p
          id={error ? errorId : hintId}
          className={cn(
            "mt-1.5 text-sm",
            error ? "text-red-500" : "text-text-tertiary",
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}