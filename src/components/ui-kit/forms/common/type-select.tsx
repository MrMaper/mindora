"use client";

import * as React from "react";
import { Select } from "../select";
import { getAllOptionsWithLabels, withEmptyOption } from "../select-utils";
import { getTranslations } from "@/i18n";
import { useSelectLanguage } from "./select-provider";

export interface TypeSelectProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function TypeSelect({
  label,
  disabled = false,
  className,
  value = "",
  onChange,
  placeholder,
}: TypeSelectProps) {
  const language = useSelectLanguage();
  const t = getTranslations(language);
  const options = withEmptyOption(
    getAllOptionsWithLabels(language, "type"),
    t.tasks.type,
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
