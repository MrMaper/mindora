"use client";

import * as React from "react";
import { Select } from "../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../select-utils";
import { useTranslation } from "@/i18n/provider";

export interface StatusSelectProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function StatusSelect({
  label,
  disabled = false,
  className,
  value = "",
  onChange,
  placeholder,
}: StatusSelectProps) {
  const t = useTranslation();
  const options = withEmptyOption(
    getAllOptionsWithLabels(t, "status"),
    t.tasks.allStatuses,
  );

  return (
    <Select
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}
