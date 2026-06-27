import * as React from "react";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

export function Switch({
  label,
  disabled = false,
  className = "",
  ...rest
}: SwitchProps): React.JSX.Element {
  return (
    <label
      className={`sf-switch${disabled ? " sf-switch--disabled" : ""}${className ? ` ${className}` : ""}`}
    >
      <input type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="sf-switch__track">
        <span className="sf-switch__thumb" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
