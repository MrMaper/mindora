import { useLanguage } from "@/i18n/provider";
import { formatNumber } from "@/lib/utils";

export function usePersianDigits() {
  const language = useLanguage();
  return (value: string | number) => formatNumber(value, language);
}
