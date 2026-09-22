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

/** Base UI forbids Item value=""; map empty option/value through this sentinel. */
const EMPTY = "__empty__";

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
  wrapperClassName,
}: SelectProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const handleChange = (val: string | string[] | null) => {
    const newValue = Array.isArray(val) ? val[0] : val;
    if (newValue == null || newValue === EMPTY) {
      onChange?.("");
      return;
    }
    onChange?.(newValue);
  };

  const selectedOption = options.find(o => o.value === (value ?? ""));
  const displayValue = selectedOption?.label ?? placeholder ?? "";

  const errorMessage: string | undefined =
    typeof error === "string" ? error : error?.message;

  const rootValue = (value ?? "") === "" ? EMPTY : (value as string);
  const knownValues = new Set(
    options.map(o => (o.value === "" ? EMPTY : o.value)),
  );
  knownValues.add(EMPTY);
  const safeRootValue = knownValues.has(rootValue) ? rootValue : EMPTY;

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
        value={safeRootValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <ShadcnSelectTrigger
          id={fieldId}
          className={cn(
            "ps-3 pe-2.5 border-border hover:border-gray-400 hover:dark:border-gray-600 focus-visible:border-ring h-8!",
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
          {/* Always provide EMPTY item so rootValue="" mapping never points at a missing item */}
          {!options.some(o => o.value === "") && (
            <ShadcnSelectItem value={EMPTY} disabled className="hidden">
              {placeholder ?? "—"}
            </ShadcnSelectItem>
          )}
          {options.map(o => (
            <ShadcnSelectItem
              key={o.value === "" ? EMPTY : o.value}
              value={o.value === "" ? EMPTY : o.value}
            >
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
