"use client";

import * as React from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Popover as ShadcnPopover,
  PopoverTrigger as ShadcnPopoverTrigger,
  PopoverContent as ShadcnPopoverContent,
} from "@/components/ui/popover";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
}

export function DatePicker({
  label,
  hint,
  error,
  required = false,
  placeholder = "Select date",
  value,
  onChange,
  disabled = false,
  className = "",
  id,
  ...rest
}: DatePickerProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ? (value instanceof Date ? value : new Date(value)) : null
  );

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onChange?.(date);
    } else {
      setSelectedDate(null);
      onChange?.(null);
    }
    setOpen(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      {label && (
        <ShadcnLabel htmlFor={fieldId} className="mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </ShadcnLabel>
      )}
      <ShadcnPopover open={open} onOpenChange={setOpen}>
        <ShadcnPopoverTrigger>
          <ShadcnInput
            id={fieldId}
            type="text"
            readOnly
            placeholder={placeholder}
            value={formatDate(selectedDate)}
            className={cn(
              "cursor-pointer",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            disabled={disabled}
            onClick={() => !disabled && setOpen(true)}
            {...rest}
          />
        </ShadcnPopoverTrigger>
        <ShadcnPopoverContent className="w-auto p-0" sideOffset={5}>
          <ShadcnCalendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateChange}
            disabled={disabled}
          />
        </ShadcnPopoverContent>
      </ShadcnPopover>
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