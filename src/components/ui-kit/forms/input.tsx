"use client";

import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  required?: boolean;
  size?: "md" | "lg";
}

export function Input({
  label,
  hint,
  error,
  icon,
  required = false,
  size = "md",
  id,
  className = "",
  ...rest
}: InputProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="w-full">
      {label && (
        <ShadcnLabel htmlFor={fieldId} className="mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </ShadcnLabel>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <Icon name={icon} size={size === "lg" ? 18 : 15} />
          </div>
        )}
        <ShadcnInput
          id={fieldId}
          className={cn(
            icon && "pl-9",
            size === "lg" && "h-10 text-base px-4",
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        />
      </div>
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