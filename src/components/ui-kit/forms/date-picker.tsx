"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n/provider";
import { TimeRoller } from "@/components/ui-kit/forms/time-roller";

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

function toPersianDigits(n: number | string): string {
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
  const hours = toPersianDigits(String(date.getHours()).padStart(2, "0"));
  const minutes = toPersianDigits(String(date.getMinutes()).padStart(2, "0"));
  return `${dateStr} ${hours}:${minutes}`;
}

function isDateOnly(d: Date | null): boolean {
  return !!d && d.getHours() === 12 && d.getMinutes() === 0;
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
  numberOfMonths?: number;
  showOutsideDays?: boolean;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Always show hour/minute inputs under the calendar. */
  showTimePicker?: boolean;
  /**
   * Low-clutter optional clock: hidden until the user adds time.
   * Noon is treated as “no time” (date-only).
   */
  timeOptional?: boolean;
  /** Keeps a noon meeting timed when duration is set. */
  durationMinutes?: number | null;
  /** Fires when optional time is turned on/off. */
  onTimeEnabledChange?: (enabled: boolean) => void;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: "range";
  value?: { from: Date | null; to: Date | null } | null;
  onChange?: (date: { from: Date | null; to: Date | null } | null) => void;
  showTimePicker?: never;
  timeOptional?: never;
  durationMinutes?: never;
  onTimeEnabledChange?: never;
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
  placeholder,
  required = false,
  value,
  onChange,
  showTimePicker = false,
  timeOptional = false,
  durationMinutes = null,
  onTimeEnabledChange,
  numberOfMonths = 1,
  showOutsideDays = true,
}: DatePickerProps): React.JSX.Element {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const [open, setOpen] = React.useState(false);
  const isPersian = language === "FA";
  const t = useTranslation();
  const CalendarComponent = isPersian ? CalendarPersian : GregorianCalendar;
  const hasDuration =
    typeof durationMinutes === "number" && durationMinutes > 0;

  const isTimedDate = (d: Date | null) =>
    !!d && (!isDateOnly(d) || hasDuration);

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

  const [timeEnabled, setTimeEnabled] = React.useState(() => {
    if (mode === "range" || !timeOptional) return showTimePicker;
    const d = value instanceof Date ? value : null;
    return isTimedDate(d);
  });

  const [localHours, setLocalHours] = React.useState<number>(() => {
    const d = mode === "single" && value instanceof Date ? value : null;
    if (d && isTimedDate(d)) return d.getHours();
    return 9;
  });
  const [localMinutes, setLocalMinutes] = React.useState<number>(() => {
    const d = mode === "single" && value instanceof Date ? value : null;
    if (d && isTimedDate(d)) return d.getMinutes();
    return 0;
  });

  React.useEffect(() => {
    if (mode === "single") {
      const d = value instanceof Date ? value : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalDate(d);
      if (d) {
        if (isTimedDate(d)) {
          setLocalHours(d.getHours());
          setLocalMinutes(d.getMinutes());
          if (timeOptional) setTimeEnabled(true);
        } else if (timeOptional && !open) {
          // Keep the roller open while editing 12:00; noon is date-only once closed.
          setTimeEnabled(false);
        }
      } else if (timeOptional) {
        setTimeEnabled(false);
      }
    } else {
      const v = value as { from: Date | null; to: Date | null } | null;
      setLocalRangeFrom(v?.from ?? null);
      setLocalRangeTo(v?.to ?? null);
    }
  }, [value, mode, timeOptional, hasDuration, open]);

  const emitSingle = (date: Date | null) => {
    (onChange as ((date: Date | null) => void) | undefined)?.(date);
  };

  const applyClock = (base: Date, hours: number, minutes: number) => {
    const next = new Date(base);
    if (timeOptional && !timeEnabled) {
      next.setHours(12, 0, 0, 0);
    } else if (showTimePicker || (timeOptional && timeEnabled)) {
      next.setHours(hours, minutes, 0, 0);
    } else {
      next.setHours(12, 0, 0, 0);
    }
    return next;
  };

  const handleSingleSelect = (date: Date | undefined) => {
    if (mode !== "single") return;
    if (!date) {
      setLocalDate(null);
      emitSingle(null);
      return;
    }
    const newDate = applyClock(date, localHours, localMinutes);
    setLocalDate(newDate);
    emitSingle(newDate);
    // Keep open so optional clock / roller stay reachable after picking a day.
    if (!timeOptional && !showTimePicker) setOpen(false);
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
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    setLocalHours(hours);
    setLocalMinutes(minutes);
    if (localDate) {
      const newDate = applyClock(localDate, hours, minutes);
      setLocalDate(newDate);
      emitSingle(newDate);
    }
  };

  const enableTime = () => {
    setTimeEnabled(true);
    onTimeEnabledChange?.(true);
    const hours = 9;
    const minutes = 0;
    setLocalHours(hours);
    setLocalMinutes(minutes);
    if (localDate) {
      const newDate = new Date(localDate);
      newDate.setHours(hours, minutes, 0, 0);
      setLocalDate(newDate);
      emitSingle(newDate);
    }
  };

  const clearTime = () => {
    setTimeEnabled(false);
    onTimeEnabledChange?.(false);
    setLocalHours(9);
    setLocalMinutes(0);
    if (localDate) {
      const newDate = new Date(localDate);
      newDate.setHours(12, 0, 0, 0);
      setLocalDate(newDate);
      emitSingle(newDate);
    }
  };

  const showClockInLabel =
    mode === "single" &&
    (showTimePicker || (timeOptional && timeEnabled && !!localDate));

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return "";
    if (isPersian) return formatPersianDate(date, showClockInLabel);
    return formatGregorianDate(date, showClockInLabel);
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

  const showTimeRow =
    mode === "single" && (showTimePicker || (timeOptional && timeEnabled));
  const showAddTime =
    mode === "single" && timeOptional && !timeEnabled && !!localDate;

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
        <PopoverTrigger
          disabled={disabled}
          render={
            <button
              type="button"
              id={fieldId}
              className={cn(
                "flex h-8 w-full min-w-0 items-center rounded-md border border-input bg-bg-surface px-2.5 text-start text-sm outline-none transition-colors",
                "hover:border-gray-400 dark:hover:border-gray-600",
                "focus-visible:border-ring",
                !displayValue && "text-muted-foreground",
                disabled && "pointer-events-none cursor-not-allowed opacity-50",
                error && "border-destructive",
                className,
              )}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? errorId : hint ? hintId : undefined}
            />
          }
        >
          <span className="truncate">
            {displayValue || (placeholder ?? t.tasks.selectDate)}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-h-(--available-height) gap-0 overflow-y-auto p-0"
          sideOffset={5}
        >
          {mode === "single" ? (
            <CalendarComponent
              mode="single"
              captionLayout={captionLayout}
              selected={localDate ?? undefined}
              onSelect={handleSingleSelect}
              disabled={disabled}
              required={false}
              numberOfMonths={numberOfMonths}
              showOutsideDays={showOutsideDays}
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
              numberOfMonths={numberOfMonths}
              showOutsideDays={showOutsideDays}
            />
          )}
          {showAddTime ? (
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={enableTime}
              >
                <ClockIcon className="size-3.5" />
                {t.tasks.addDueTime}
              </button>
            </div>
          ) : null}
          {showTimeRow ? (
            <div className="border-t border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
                {timeOptional ? (
                  <button
                    type="button"
                    className="ms-auto text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearTime}
                  >
                    {t.tasks.clearDueTime}
                  </button>
                ) : null}
              </div>
              <div className="flex justify-center">
                <TimeRoller
                  hours={localHours}
                  minutes={localMinutes}
                  onChange={handleTimeChange}
                  disabled={!localDate}
                />
              </div>
            </div>
          ) : null}
          <div className="flex justify-end border-t border-border px-3 py-2">
            <button
              type="button"
              className="inline-flex h-9 min-w-[5.5rem] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={
                mode === "single"
                  ? !localDate
                  : !localRangeFrom || !localRangeTo
              }
              onClick={() => setOpen(false)}
            >
              {t.common.confirm}
            </button>
          </div>
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
