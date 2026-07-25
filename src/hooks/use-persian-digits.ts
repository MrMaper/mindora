import * as React from "react";
import { I18nContext } from "@/i18n/provider";
import { formatNumber } from "@/lib/utils";

export function usePersianDigits() {
  const language = React.useContext(I18nContext);
  return (value: string | number) => formatNumber(value, language);
}
