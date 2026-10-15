import type { TourDef } from "../types";
import { TOUR_STEPS as steps } from "../content";

/** First-run menu map — stays on Today; spotlights sidebar items. */
export const overviewTour: TourDef = {
  id: "overview",
  inviteTitle: {
    FA: "تور کوتاه بخش‌ها؟",
    EN: "A quick tour of the sections?",
  },
  inviteBody: {
    FA: "از روی منو نشان می‌دهیم هر بخش چیست — بدون جابه‌جایی سنگین بین صفحه‌ها.",
    EN: "A map of the menu — what each section is for, without heavy page hops.",
  },
  steps,
};
