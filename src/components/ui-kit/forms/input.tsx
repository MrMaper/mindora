"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

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

  const inputCls = [
    "sf-input",
    icon ? "sf-input--has-icon" : "",
    size === "lg" ? "sf-input--lg" : "",
    error ? "sf-input--error" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className="sf-field">
      {label && (
        <label className="sf-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <div className="sf-input-wrap">
        {icon && (
          <span className="sf-input__icon">
            <Icon name={icon} size={15} />
          </span>
        )}
        <input id={fieldId} className={inputCls} aria-invalid={!!error} {...rest} />
      </div>
      {(hint || error) && (
        <span className={`sf-field__hint${error ? " sf-field__hint--error" : ""}`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
