"use client";

import * as React from "react";
import {
  RadioGroup as ShadcnRadioGroup,
  RadioGroupItem as ShadcnRadioGroupItem,
} from "@/components/ui/radio-group";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface RadioGroupProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  orientation?: "horizontal" | "vertical";
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function RadioGroup({
  label,
  hint,
  error,
  required = false,
  options = [],
  orientation = "vertical",
  value = "",
  onValueChange,
  disabled = false,
  id,
  className = "",
}: RadioGroupProps): React.JSX.Element {
  const generatedId = React.useId();
  const groupId = id ?? generatedId;
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const isControlled = value !== undefined && onValueChange !== undefined;

  return (
    <div className="w-full">
      {label && (
        <ShadcnLabel className="mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </ShadcnLabel>
      )}
      <ShadcnRadioGroup
        {...(isControlled ? { value, onValueChange } : {})}
        disabled={disabled}
        className={cn(
          "gap-2",
          orientation === "horizontal" && "flex flex-wrap",
          orientation === "vertical" && "grid",
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
      >
        {options.map((option) => (
          <ShadcnRadioGroupItem key={option.value} value={option.value}>
            <ShadcnLabel className="flex items-center gap-2 cursor-pointer">
              <span className="sr-only">{option.label}</span>
              {option.label}
            </ShadcnLabel>
          </ShadcnRadioGroupItem>
        ))}
      </ShadcnRadioGroup>
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

export interface RadioProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Radio({
  label,
  value,
  disabled = false,
  className = "",
  id,
  onChange,
}: RadioProps): React.JSX.Element {
  const generatedId = React.useId();
  const radioId = id ?? generatedId;

  return (
    <ShadcnLabel className={cn("flex items-center gap-2 cursor-pointer", disabled && "opacity-50 pointer-events-none", className)}>
      <ShadcnRadioGroupItem
        id={radioId}
        value={value}
        disabled={disabled}
      >
        <span className="sr-only">{label}</span>
      </ShadcnRadioGroupItem>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </ShadcnLabel>
  );
}