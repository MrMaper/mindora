import type { LifeArea } from "@/types/db";

export type DocTemplateKey =
  | "blank"
  | "daily"
  | "meeting"
  | "researchIdea"
  | "chapterDraft"
  | "sourceNote"
  | "litReview"
  | "weeklyReview"
  | "langSession"
  | "langErrorLog"
  | "langEssay";

export interface DocTemplate {
  key: DocTemplateKey;
  area: LifeArea;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    key: "blank",
    area: "LIFE",
    titleFa: "خالی",
    titleEn: "Blank",
    descriptionFa: "صفحه خالی برای شروع آزاد",
    descriptionEn: "Empty page to start freely",
    content: "<p></p>",
  },
  {
    key: "daily",
    area: "LIFE",
    titleFa: "یادداشت روزانه",
    titleEn: "Daily note",
    descriptionFa: "خلاصه روز، اولویت‌ها و حال",
    descriptionEn: "Day summary, priorities and mood",
    content: `<h2>امروز</h2><h3>اولویت‌ها</h3><ul><li></li><li></li><li></li></ul><h3>اتفاقات</h3><p></p><h3>یادداشت</h3><p></p>`,
  },
  {
    key: "meeting",
    area: "WORK",
    titleFa: "صورت‌جلسه",
    titleEn: "Meeting notes",
    descriptionFa: "تصمیم‌ها و اقدام‌ها",
    descriptionEn: "Decisions and action items",
    content: `<h2>جلسه</h2><p><strong>تاریخ:</strong> </p><p><strong>حاضرین:</strong> </p><h3>بحث</h3><ul><li></li></ul><h3>تصمیم‌ها</h3><ul><li></li></ul><h3>اقدام‌ها</h3><ul><li></li></ul>`,
  },
  {
    key: "researchIdea",
    area: "PHD",
    titleFa: "ایده پژوهش",
    titleEn: "Research idea",
    descriptionFa: "مسئله، سوال و مسیر اولیه",
    descriptionEn: "Problem, question and first direction",
    content: `<h2>ایده</h2><h3>بیان مسئله</h3><p></p><h3>سوال پژوهش</h3><p></p><h3>اهمیت</h3><p></p><h3>منابع اولیه</h3><ul><li></li></ul>`,
  },
  {
    key: "chapterDraft",
    area: "PHD",
    titleFa: "پیش‌نویس فصل",
    titleEn: "Chapter draft",
    descriptionFa: "ساختار فصل رساله یا مقاله",
    descriptionEn: "Structure for a thesis/article chapter",
    content: `<h1>عنوان فصل</h1><h2>مقدمه</h2><p></p><h2>بدنه</h2><h3>بخش ۱</h3><p></p><h3>بخش ۲</h3><p></p><h2>جمع‌بندی</h2><p></p>`,
  },
  {
    key: "sourceNote",
    area: "PHD",
    titleFa: "یادداشت منبع",
    titleEn: "Source note",
    descriptionFa: "خلاصه مقاله و نقل‌قول‌ها",
    descriptionEn: "Paper summary and quotes",
    content: `<h2>منبع</h2><p><strong>عنوان:</strong> </p><p><strong>نویسندگان:</strong> </p><p><strong>لینک:</strong> </p><h3>خلاصه</h3><p></p><h3>نکات کلیدی</h3><ul><li></li></ul><h3>نقل‌قول‌ها</h3><blockquote><p></p></blockquote>`,
  },
  {
    key: "litReview",
    area: "PHD",
    titleFa: "مرور ادبیات",
    titleEn: "Literature review",
    descriptionFa: "تم‌ها، شکاف‌ها و نقل‌قول‌های ساخت‌یافته",
    descriptionEn: "Themes, gaps and structured quotes",
    content: `<h1>مرور ادبیات</h1><h2>سؤال راهنما</h2><p></p><h2>تم‌های اصلی</h2><h3>تم ۱</h3><p></p><blockquote><p></p></blockquote><h3>تم ۲</h3><p></p><blockquote><p></p></blockquote><h2>شکاف پژوهشی</h2><ul><li></li></ul><h2>جمع‌بندی برای فصل بعد</h2><p></p>`,
  },
  {
    key: "weeklyReview",
    area: "LIFE",
    titleFa: "بازبینی هفته",
    titleEn: "Weekly review",
    descriptionFa: "جمع‌بندی هفته و برنامه بعد",
    descriptionEn: "Week wrap-up and next plan",
    content: `<h2>بازبینی هفته</h2><h3>چه تمام شد</h3><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul><h3>چه ماند</h3><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul><h3>یادگرفته‌ها</h3><ul><li></li></ul><h3>هفته بعد</h3><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>`,
  },
  {
    key: "langSession",
    area: "LANG",
    titleFa: "جلسه زبان",
    titleEn: "Language session",
    descriptionFa: "هدف جلسه، منبع و خلاصه",
    descriptionEn: "Session goal, source and notes",
    content: `<h2>جلسه زبان</h2><p><strong>مهارت:</strong> </p><p><strong>مدت:</strong> </p><p><strong>منبع:</strong> </p><h3>هدف جلسه</h3><p></p><h3>نکات</h3><ul><li></li></ul><h3>واژه‌های جدید</h3><ul><li></li></ul>`,
  },
  {
    key: "langErrorLog",
    area: "LANG",
    titleFa: "دفتر خطا",
    titleEn: "Error log",
    descriptionFa: "اشتباهات تکراری و اصلاح",
    descriptionEn: "Recurring mistakes and fixes",
    content: `<h2>دفتر خطا</h2><h3>گرامر</h3><ul><li></li></ul><h3>واژگان / کالوکیشن</h3><ul><li></li></ul><h3>تلفظ</h3><ul><li></li></ul>`,
  },
  {
    key: "langEssay",
    area: "LANG",
    titleFa: "پیش‌نویس Writing",
    titleEn: "Writing draft",
    descriptionFa: "طرح، بدنه و بازبینی",
    descriptionEn: "Outline, body and revision",
    content: `<h2>Writing</h2><h3>Prompt</h3><p></p><h3>Outline</h3><ul><li></li></ul><h3>Draft</h3><p></p><h3>Revision notes</h3><ul><li></li></ul>`,
  },
];

export function getDocTemplate(key: DocTemplateKey): DocTemplate {
  return DOC_TEMPLATES.find(t => t.key === key) ?? DOC_TEMPLATES[0];
}
