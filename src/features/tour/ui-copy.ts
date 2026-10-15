import type { TourUiCopy } from "./types";

export const TOUR_UI: TourUiCopy = {
  progress: { FA: "گام {current} از {total}", EN: "Step {current} of {total}" },
  next: { FA: "بعدی", EN: "Next" },
  back: { FA: "قبلی", EN: "Back" },
  skip: { FA: "رد کردن تور", EN: "Skip tour" },
  done: { FA: "تمام", EN: "Done" },
  inviteStart: { FA: "شروع تور", EN: "Start tour" },
  inviteLater: { FA: "بعداً", EN: "Later" },
  inviteNever: { FA: "نه، لازم نیست", EN: "No thanks" },
  pageRestart: { FA: "تور این صفحه", EN: "Tour this page" },
};

export function pickLang<T extends { FA: string; EN: string }>(
  field: T,
  language: "FA" | "EN",
): string {
  return language === "EN" ? field.EN : field.FA;
}
