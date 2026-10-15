import type { TourStepDef } from "./types";

/**
 * Overview (menu-map) steps. After Today/Capture, only sidebar spotlights —
 * no route hops between tabs.
 */
export const TOUR_STEPS: TourStepDef[] = [
  {
    id: "welcome",
    target: null,
    href: "/dashboard",
    navigate: true,
    gate: { kind: "always" },
    title: {
      FA: "به مایندورا خوش آمدی",
      EN: "Welcome to Mindora",
    },
    body: {
      FA: "این تور نقشهٔ منوست. هر تب بعداً تور تخصصی خودش را دارد؛ اینجا فقط می‌بینیم منو چه چیزهایی دارد.",
      EN: "This is the menu map. Each tab has its own deeper tour later — here we only learn what is in the menu.",
    },
  },
  {
    id: "today",
    target: "page-today",
    href: "/dashboard",
    navigate: true,
    gate: { kind: "always" },
    title: { FA: "امروز", EN: "Today" },
    body: {
      FA: "هر روز از اینجا شروع کن. برای جزئیات بیشتر، بعداً تور همین صفحه را ببین.",
      EN: "Start each day here. For a deeper walkthrough, take the Today page tour later.",
    },
  },
  {
    id: "capture",
    target: "capture",
    href: "/dashboard",
    navigate: true,
    gate: { kind: "capture" },
    title: { FA: "ثبت سریع", EN: "Quick capture" },
    body: {
      FA: "با N یا این دکمه هر چیزی را سریع بنویس — کار، یادداشت، یا چیزی برای بعد.",
      EN: "Press N or use this button to jot anything fast — a task, a note, or later.",
    },
  },
  {
    id: "board",
    target: "nav-board",
    gate: { kind: "nav", key: "kanban" },
    title: { FA: "بورد", EN: "Board" },
    body: {
      FA: "از منو: جریان وضعیت کارها. وقتی واردش شدی، تور بورد جزئیات ستون‌ها را می‌گوید.",
      EN: "In the menu: status flow. Open it later for the board-specific tour of columns.",
    },
  },
  {
    id: "tasks",
    target: "nav-tasks",
    gate: { kind: "nav", key: "tasks" },
    title: { FA: "کارها", EN: "Tasks" },
    body: {
      FA: "از منو: فهرست کامل. تور صفحهٔ کارها فیلتر و ساخت را عمیق‌تر می‌کند.",
      EN: "In the menu: the full list. The Tasks page tour goes deeper on filters and create.",
    },
  },
  {
    id: "calendar",
    target: "nav-calendar",
    gate: { kind: "nav", key: "calendar" },
    title: { FA: "تقویم", EN: "Calendar" },
    body: {
      FA: "از منو: کارهای تاریخ‌دار. تور تقویم نماها و کشیدن کار را نشان می‌دهد.",
      EN: "In the menu: dated work. The Calendar tour covers views and drag-and-drop.",
    },
  },
  {
    id: "projects",
    target: "nav-projects",
    gate: { kind: "nav", key: "projects" },
    title: { FA: "حوزه‌ها و مسیرها", EN: "Areas & paths" },
    body: {
      FA: "از منو: سازمان زندگی. تور همان صفحه حوزه‌ها را باز می‌کند.",
      EN: "In the menu: organize life. The Areas page tour opens the cards.",
    },
  },
  {
    id: "docs",
    target: "nav-docs",
    gate: { kind: "nav", key: "docs" },
    title: { FA: "اسناد", EN: "Docs" },
    body: {
      FA: "از منو: نوشته‌های بلند. با ورود، تور کوتاه اسناد را می‌بینی.",
      EN: "In the menu: long-form writing. Opening Docs offers a short page tour.",
    },
  },
  {
    id: "research",
    target: "nav-research",
    gate: { kind: "nav", key: "research" },
    title: { FA: "پژوهش", EN: "Research" },
    body: {
      FA: "از منو: هاب پژوهش — وقتی روشن باشد.",
      EN: "In the menu: research hub — when enabled.",
    },
  },
  {
    id: "language",
    target: "nav-language",
    gate: { kind: "nav", key: "language" },
    title: { FA: "زبان", EN: "Language" },
    body: {
      FA: "از منو: هاب زبان — واژگان و تمرین.",
      EN: "In the menu: language hub — vocab and practice.",
    },
  },
  {
    id: "review",
    target: "nav-review",
    gate: { kind: "nav", key: "review" },
    title: { FA: "بازبینی", EN: "Review" },
    body: {
      FA: "از منو: جمع‌بندی هفته.",
      EN: "In the menu: week wrap-up.",
    },
  },
  {
    id: "work-logs",
    target: "nav-work-logs",
    gate: { kind: "nav", key: "workLogs" },
    title: { FA: "ساعات کار", EN: "Work logs" },
    body: {
      FA: "از منو: ثبت زمان روی کارها.",
      EN: "In the menu: log time on tasks.",
    },
  },
  {
    id: "reporting",
    target: "nav-reporting",
    gate: { kind: "nav", key: "reporting" },
    title: { FA: "گزارش", EN: "Reporting" },
    body: {
      FA: "از منو: خلاصه و خروجی.",
      EN: "In the menu: summaries and exports.",
    },
  },
  {
    id: "notifications",
    target: "nav-notifications",
    gate: { kind: "always" },
    title: { FA: "اعلان‌ها", EN: "Notifications" },
    body: {
      FA: "از منو: یادآورها و خبرهای خودت.",
      EN: "In the menu: your reminders and updates.",
    },
  },
  {
    id: "settings",
    target: "nav-settings",
    gate: { kind: "settings" },
    title: { FA: "تنظیمات", EN: "Settings" },
    body: {
      FA: "از منو: پروفایل و قابلیت‌ها. تور تنظیمات تب‌ها را نشان می‌دهد.",
      EN: "In the menu: profile and capabilities. The Settings tour covers the tabs.",
    },
  },
  {
    id: "guide",
    target: "nav-guide",
    gate: { kind: "guide" },
    title: { FA: "راهنما", EN: "Guide" },
    body: {
      FA: "از منو: مرجع نوشته‌شده و شروع دوبارهٔ تورها.",
      EN: "In the menu: written reference and a place to restart tours.",
    },
  },
  {
    id: "finish",
    target: null,
    href: "/dashboard",
    navigate: true,
    gate: { kind: "always" },
    title: { FA: "آمادهٔ کار", EN: "You’re set" },
    body: {
      FA: "نقشهٔ منو تمام شد. با ورود به هر تب، اگر بخواهی تور تخصصی همان صفحه پیشنهاد می‌شود.",
      EN: "Menu map done. Opening each tab can offer that page’s own specialized tour.",
    },
  },
];
