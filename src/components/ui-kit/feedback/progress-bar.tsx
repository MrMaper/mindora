import * as React from "react";

const TONES: Record<string, string> = {
  brand:   "var(--action-primary)",
  success: "var(--green-500)",
  warning: "var(--amber-500)",
  danger:  "var(--red-500)",
  info:    "var(--blue-500)",
  neutral: "var(--gray-500)",
};

export interface ProgressSegment {
  value: number;
  color: string;
}

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  tone?: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  segments?: ProgressSegment[];
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = "brand",
  size = "md",
  label,
  showValue = false,
  segments,
  className = "",
  ...rest
}: ProgressBarProps): React.JSX.Element {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={`sf-prog${className ? ` ${className}` : ""}`} {...rest}>
      {(label || showValue) && (
        <div className="sf-prog__head">
          {label && <span className="sf-prog__label">{label}</span>}
          {showValue && (
            <span className="sf-prog__val">
              {segments ? `${value}/${max}` : `${Math.round(pct)}%`}
            </span>
          )}
        </div>
      )}
      <div
        className={`sf-prog__track${size !== "md" ? ` sf-prog__track--${size}` : ""}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
      >
        {segments ? (
          <div className="sf-prog__seg">
            {segments.map((s, i) => (
              <span key={i} style={{ width: `${(s.value / max) * 100}%`, background: s.color }} />
            ))}
          </div>
        ) : (
          <div className="sf-prog__fill" style={{ width: `${pct}%`, background: TONES[tone] ?? tone }} />
        )}
      </div>
    </div>
  );
}
