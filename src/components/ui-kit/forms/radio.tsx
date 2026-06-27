import * as React from "react";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Radio({
  label,
  disabled = false,
  className = "",
  ...rest
}: RadioProps): React.JSX.Element {
  return (
    <label className={`sf-radio${disabled ? " sf-radio--disabled" : ""}${className ? ` ${className}` : ""}`}>
      <input type="radio" disabled={disabled} {...rest} />
      <span className="sf-radio__dot" />
      {label && <span>{label}</span>}
    </label>
  );
}
