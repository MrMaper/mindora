"use client";

import * as React from "react";
import { Select } from "../../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../../select-utils";
import { getTranslations } from "@/i18n";
import { useSelectLanguage } from "../select-provider";

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
  const language = useSelectLanguage();
  const t = getTranslations(language);
  const options = withEmptyOption(
    getAllOptionsWithLabels(language, "status"),
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
