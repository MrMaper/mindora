"use client";

import * as React from "react";
import { faIR, enUS } from "date-fns/locale";
import { toJalaali } from "jalaali-js";
import { Clock as ClockIcon } from "lucide-react";

import type { Language } from "@/types/db";
import { cn } from "@/lib/utils";
import { Calendar as GregorianCalendar } from "@/components/ui/calendar";
import { CalendarPersian } from "@/components/ui/calendar-persian";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const PERSIAN_DIGITS = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
] as const;

function toPersianDigits(n: number): string {
  return String(n)
    .split("")
    .map(d => PERSIAN_DIGITS[parseInt(d)] ?? d)
    .join("");
}

function formatGregorianDate(date: Date, showTime: boolean): string {
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (!showTime) return dateStr;
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} ${timeStr}`;
}

function formatPersianDate(date: Date, showTime: boolean): string {
  const { jy, jm, jd } = toJalaali(date);
  const dateStr = `${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
  if (!showTime) return dateStr;
  const hours = toPersianDigits(date.getHours());
  const minutes = toPersianDigits(date.getMinutes());
  return `${dateStr} ${hours}:${minutes}`;
}

export type DatePickerMode = "single" | "range";

interface DatePickerBaseProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  captionLayout?: "label" | "dropdown";
  language?: Language;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  showTimePicker?: boolean;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: "range";
  value?: { from: Date | null; to: Date | null } | null;
  onChange?: (date: { from: Date | null; to: Date | null } | null) => void;
  showTimePicker?: never;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

export function DatePicker(props: DatePickerSingleProps): React.JSX.Element;
export function DatePicker(props: DatePickerRangeProps): React.JSX.Element;
export function DatePicker({
  captionLayout = "label",
  className = "",
  disabled = false,
  error,
  hint,
  id,
  label,
  language = "FA",
  mode = "single",
  placeholder = "Select date",
  required = false,
  value,
  onChange,
  showTimePicker = false,
}: DatePickerProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const [open, setOpen] = React.useState(false);

  const isPersian = language === "FA";
  const dateLocale = isPersian ? faIR : enUS;
  const CalendarComponent = isPersian ? CalendarPersian : GregorianCalendar;

  const [localDate, setLocalDate] = React.useState<Date | null>(() => {
    if (mode === "range" || !value) return null;
    return value instanceof Date ? value : null;
  });

  const [localRangeFrom, setLocalRangeFrom] = React.useState<Date | null>(
    () => {
      if (mode !== "range" || !value) return null;
      const v = value as { from: Date | null; to: Date | null };
      return v.from ?? null;
    },
  );

  const [localRangeTo, setLocalRangeTo] = React.useState<Date | null>(() => {
    if (mode !== "range" || !value) return null;
    const v = value as { from: Date | null; to: Date | null };
    return v.to ?? null;
  });

  const [localHours, setLocalHours] = React.useState<number>(0);
  const [localMinutes, setLocalMinutes] = React.useState<number>(0);

  React.useEffect(() => {
    if (mode === "single") {
      const d = value instanceof Date ? value : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalDate(d);
      if (d) {
        setLocalHours(d.getHours());
        setLocalMinutes(d.getMinutes());
      }
    } else {
      const v = value as { from: Date | null; to: Date | null } | null;
      setLocalRangeFrom(v?.from ?? null);
      setLocalRangeTo(v?.to ?? null);
    }
  }, [value, mode]);

  const handleSingleSelect = (date: Date | undefined) => {
    if (mode !== "single") return;
    const newDate = date ?? null;
    if (newDate) {
      newDate.setHours(localHours, localMinutes, 0, 0);
    }
    setLocalDate(newDate);
    (onChange as ((date: Date | null) => void) | undefined)?.(newDate);
    if (date) setOpen(false);
  };

  const handleRangeSelect = (
    range: { from: Date | undefined; to?: Date | undefined } | undefined,
  ) => {
    if (mode !== "range") return;
    const newFrom = range?.from ?? null;
    const newTo = range?.to ?? null;
    setLocalRangeFrom(newFrom);
    setLocalRangeTo(newTo);
    (
      onChange as (date: { from: Date | null; to: Date | null } | null) => void
    )?.({ from: newFrom, to: newTo });
    if (newFrom && newTo) setOpen(false);
  };

  const handleTimeChange = (type: "hours" | "minutes", raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;

    if (type === "hours") {
      const clamped = Math.min(23, Math.max(0, num));
      setLocalHours(clamped);
      if (localDate) {
        const newDate = new Date(localDate);
        newDate.setHours(clamped, localMinutes, 0, 0);
        setLocalDate(newDate);
        (onChange as ((date: Date | null) => void) | undefined)?.(newDate);
      }
    } else {
      const clamped = Math.min(59, Math.max(0, num));
      setLocalMinutes(clamped);
      if (localDate) {
        const newDate = new Date(localDate);
        newDate.setHours(localHours, clamped, 0, 0);
        setLocalDate(newDate);
        (onChange as ((date: Date | null) => void) | undefined)?.(newDate);
      }
    }
  };

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return "";
    if (isPersian)
      return formatPersianDate(date, mode === "single" && showTimePicker);
    return formatGregorianDate(date, mode === "single" && showTimePicker);
  };

  const formatRangeForDisplay = (): string => {
    if (!localRangeFrom && !localRangeTo) return "";
    if (localRangeFrom && localRangeTo) {
      return `${formatDateForDisplay(localRangeFrom)} – ${formatDateForDisplay(localRangeTo)}`;
    }
    if (localRangeFrom) return `${formatDateForDisplay(localRangeFrom)} – ...`;
    return `... – ${formatDateForDisplay(localRangeTo)}`;
  };

  const displayValue =
    mode === "range"
      ? formatRangeForDisplay()
      : formatDateForDisplay(localDate);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={fieldId} className="mb-1.5">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Input
            id={fieldId}
            type="text"
            readOnly
            placeholder={placeholder}
            value={displayValue}
            className={cn(
              "cursor-pointer",
              error &&
                "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            disabled={disabled}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" sideOffset={5}>
          {mode === "single" ? (
            <CalendarComponent
              mode="single"
              captionLayout={captionLayout}
              selected={localDate ?? undefined}
              onSelect={handleSingleSelect}
              disabled={disabled}
              required={false}
            />
          ) : (
            <CalendarComponent
              mode="range"
              captionLayout={captionLayout}
              selected={
                localRangeFrom && localRangeTo
                  ? { from: localRangeFrom, to: localRangeTo }
                  : localRangeFrom
                    ? { from: localRangeFrom, to: localRangeFrom }
                    : undefined
              }
              onSelect={handleRangeSelect}
              disabled={disabled}
              required={false}
            />
          )}
          {mode === "single" && showTimePicker && (
            <div className="flex items-center gap-2 border-t border-border p-3">
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex items-center gap-1" dir="ltr">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={String(localHours).padStart(2, "0")}
                  onChange={e => handleTimeChange("hours", e.target.value)}
                  className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={!localDate}
                  aria-label="Hours"
                />
                <span className="text-muted-foreground select-none">:</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={String(localMinutes).padStart(2, "0")}
                  onChange={e => handleTimeChange("minutes", e.target.value)}
                  className="w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={!localDate}
                  aria-label="Minutes"
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
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
