"use client";

import * as React from "react";
import { Select } from "../../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../../select-utils";
import { useTranslation } from "@/i18n/provider";

export interface FilterPrioritySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function FilterPrioritySelect({
  value = "",
  onChange,
  className,
  placeholder,
}: FilterPrioritySelectProps) {
  const t = useTranslation();
  const options = withEmptyOption(
    getAllOptionsWithLabels(t, "priority"),
    t.tasks.allPriorities,
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
