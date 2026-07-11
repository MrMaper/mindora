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
  error?: string | { message?: string } | undefined;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
}

export function Select({
  label,
  hint,
  error,
  required = false,
  options,
  placeholder,
  id,
  className = "",
  onChange,
  value,
  disabled = false,
  style,
  wrapperClassName,
}: SelectProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const handleChange = (val: string | string[] | null) => {
    const newValue = Array.isArray(val) ? val[0] : val;
    onChange?.(newValue ?? "");
  };

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption?.label ?? placeholder ?? "";

  const errorMessage: string | undefined =
    typeof error === "string" ? error : error?.message;

  return (
    <div className={cn("w-full", wrapperClassName)} style={style}>
      {label && (
        <ShadcnLabel htmlFor={fieldId} className="mb-1.5">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
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
            errorMessage &&
              "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
            className,
          )}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : hint ? hintId : undefined}
        >
          <ShadcnSelectValue placeholder={placeholder}>
            {displayValue}
          </ShadcnSelectValue>
        </ShadcnSelectTrigger>
        <ShadcnSelectContent className="w-full">
          {placeholder && (
            <ShadcnSelectItem value="" disabled>
              {placeholder}
            </ShadcnSelectItem>
          )}
          {options.map(o => (
            <ShadcnSelectItem key={o.value} value={o.value}>
              {o.label}
            </ShadcnSelectItem>
          ))}
        </ShadcnSelectContent>
      </ShadcnSelect>
      {(hint || errorMessage) && (
        <p
          id={errorMessage ? errorId : hintId}
          className={cn(
            "mt-1.5 text-sm",
            errorMessage ? "text-red-500" : "text-text-tertiary",
          )}
          role={errorMessage ? "alert" : undefined}
        >
          {errorMessage ?? hint}
        </p>
      )}
    </div>
  );
}
