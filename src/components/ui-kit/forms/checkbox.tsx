"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  checked,
  indeterminate = false,
  disabled = false,
  className = "",
  ...rest
}: CheckboxProps): React.JSX.Element {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={`sf-check${disabled ? " sf-check--disabled" : ""}${className ? ` ${className}` : ""}`}>
      <input ref={ref} type="checkbox" checked={checked} disabled={disabled} {...rest} />
      <span className="sf-check__box">
        <span className="sf-check__mark">
          <Icon name="check" size={12} strokeWidth={3} />
        </span>
        <span className="sf-check__dash" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
