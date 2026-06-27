"use client";

import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function Textarea({
  label,
  hint,
  error,
  required = false,
  id,
  className = "",
  rows = 4,
  ...rest
}: TextareaProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const cls = ["sf-textarea", error ? "sf-textarea--error" : "", className].filter(Boolean).join(" ");

  return (
    <div className="sf-field">
      {label && (
        <label className="sf-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <textarea id={fieldId} className={cls} rows={rows} aria-invalid={!!error} {...rest} />
      {(hint || error) && (
        <span className={`sf-field__hint${error ? " sf-field__hint--error" : ""}`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
