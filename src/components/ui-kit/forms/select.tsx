"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: (string | SelectOption)[];
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
  children,
  ...rest
}: SelectProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="sf-field">
      {label && (
        <label className="sf-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <div className="sf-select-wrap">
        <select id={fieldId} className={`sf-select${className ? ` ${className}` : ""}`} aria-invalid={!!error} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => {
            const value = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return <option key={value} value={value}>{lbl}</option>;
          })}
          {children}
        </select>
        <span className="sf-select__chev">
          <Icon name="chevron-down" size={15} />
        </span>
      </div>
      {(hint || error) && (
        <span className={`sf-field__hint${error ? " sf-field__hint--error" : ""}`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
