import * as React from "react";
import { Icon } from "../foundation/icon";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  onRemove?: () => void;
}

export function Tag({
  color,
  onRemove,
  className = "",
  children,
  ...rest
}: TagProps): React.JSX.Element {
  return (
    <span className={`sf-tag${className ? ` ${className}` : ""}`} {...rest}>
      {color && <span className="sf-tag__dot" style={{ background: color }} />}
      {children}
      {onRemove && (
        <span className="sf-tag__x" role="button" aria-label="Remove" onClick={onRemove}>
          <Icon name="x" size={11} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}
