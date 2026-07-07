"use client";

import * as React from "react";
import { Select } from "../../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../../select-utils";
import { getTranslations } from "@/i18n";
import { useSelectLanguage } from "../select-provider";

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
  const language = useSelectLanguage();
  const t = getTranslations(language);
  const options = withEmptyOption(
    getAllOptionsWithLabels(language, "priority"),
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
