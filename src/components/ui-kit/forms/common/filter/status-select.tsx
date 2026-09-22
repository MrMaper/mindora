"use client";

import * as React from "react";
import { Select } from "../../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../../select-utils";
import { useTranslation } from "@/i18n/provider";

export interface FilterStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function FilterStatusSelect({
  value = "",
  onChange,
  className,
  placeholder,
}: FilterStatusSelectProps) {
  const t = useTranslation();
  const options = withEmptyOption(
    getAllOptionsWithLabels(t, "status"),
    t.tasks.allStatuses,
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  );
}
