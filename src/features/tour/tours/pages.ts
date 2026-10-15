import type { TourDef } from "../types";

export const todayTour: TourDef = {
  id: "today",
  paths: ["/dashboard"],
  inviteTitle: { FA: "تور صفحهٔ امروز؟", EN: "Tour Today?" },
  inviteBody: {
    FA: "اولویت‌ها، تمرکز، صف کار و عادت‌ها را یکی‌یکی نشان می‌دهیم.",
    EN: "A short walk through priorities, focus, queues, and habits.",
  },
  steps: [
    {
      id: "t-welcome",
      target: "page-today",
      gate: { kind: "always" },
      title: { FA: "صبح از اینجا", EN: "Start here each morning" },
      body: {
        FA: "سلام و تاریخ/ساعت زنده — نقطهٔ شروع روز توست.",
        EN: "Greeting plus live date/time — your daily starting point.",
      },
    },
    {
      id: "t-attention",
      target: "today-attention",
      gate: { kind: "always" },
      title: { FA: "توجه امروز", EN: "Attention strip" },
      body: {
        FA: "اگر چیزی عقب افتاده یا نیاز به مرور دارد، اینجا خلاصه می‌شود.",
        EN: "Overdue or needs-review items surface here as a calm strip.",
      },
    },
    {
      id: "t-focus",
      target: "today-focus",
      gate: { kind: "always" },
      title: { FA: "تمرکز", EN: "Focus session" },
      body: {
        FA: "تایمر تمرکز برای یک بلوک کار عمیق، کنار لیست امروز.",
        EN: "A focus timer for one deep block, next to today’s list.",
      },
    },
    {
      id: "t-queues",
      target: "today-queues",
      gate: { kind: "always" },
      title: { FA: "صف کارها", EN: "Work queues" },
      body: {
        FA: "امروز، عقب‌افتاده، بدون تاریخ — هر صف یک کار مشخص دارد.",
        EN: "Today, overdue, undated — each queue has one job.",
      },
    },
    {
      id: "t-habits",
      target: "today-habits",
      gate: { kind: "always" },
      title: { FA: "عادت‌ها", EN: "Habits" },
      body: {
        FA: "تیک روزانه و نقشهٔ فعالیت — کنار تعادل هفته.",
        EN: "Daily checks and a heatmap — beside the week balance.",
      },
    },
  ],
};

export const boardTour: TourDef = {
  id: "board",
  paths: ["/kanban"],
  inviteTitle: { FA: "تور بورد؟", EN: "Tour the board?" },
  inviteBody: {
    FA: "ستون‌ها، فیلتر و ساخت کارت را سریع مرور می‌کنیم.",
    EN: "A quick pass over columns, filters, and creating cards.",
  },
  steps: [
    {
      id: "b-header",
      target: "page-board",
      gate: { kind: "always" },
      title: { FA: "بورد کار", EN: "Work board" },
      body: {
        FA: "جریان وضعیت کارها اینجاست. از دکمهٔ ساخت، کارت تازه بساز.",
        EN: "Status flow lives here. Use Create for a new card.",
      },
    },
    {
      id: "b-filters",
      target: "board-filters",
      gate: { kind: "always" },
      title: { FA: "فیلترها", EN: "Filters" },
      body: {
        FA: "پروژه، برچسب، اولویت — بورد را به همان کاری که می‌خواهی محدود کن.",
        EN: "Project, label, priority — narrow the board to what you need.",
      },
    },
    {
      id: "b-columns",
      target: "board-columns",
      gate: { kind: "always" },
      title: { FA: "ستون‌ها", EN: "Columns" },
      body: {
        FA: "کارت را بین ستون‌ها بکش تا وضعیت عوض شود. نیازی به فرم جدا نیست.",
        EN: "Drag cards across columns to change status — no extra form needed.",
      },
    },
  ],
};

export const tasksTour: TourDef = {
  id: "tasks",
  paths: ["/tasks"],
  inviteTitle: { FA: "تور فهرست کارها؟", EN: "Tour the task list?" },
  inviteBody: {
    FA: "جستجو، فیلتر و ساخت کار را در همین صفحه می‌بینیم.",
    EN: "Search, filters, and creating tasks — right on this page.",
  },
  steps: [
    {
      id: "tk-header",
      target: "page-tasks",
      gate: { kind: "always" },
      title: { FA: "فهرست کامل", EN: "Full list" },
      body: {
        FA: "همهٔ کارها با جزئیات؛ وقتی «امروز» کافی نیست اینجا بیا.",
        EN: "Every task with detail — when Today is not enough.",
      },
    },
    {
      id: "tk-filters",
      target: "tasks-filters",
      gate: { kind: "always" },
      title: { FA: "جستجو و فیلتر", EN: "Search & filters" },
      body: {
        FA: "عنوان، حوزه، وضعیت — لیست را سریع تنگ کن.",
        EN: "Title, area, status — tighten the list fast.",
      },
    },
    {
      id: "tk-list",
      target: "tasks-list",
      gate: { kind: "always" },
      title: { FA: "ردیف‌ها", EN: "Rows" },
      body: {
        FA: "روی یک کار بزن تا جزئیات و ویرایش باز شود.",
        EN: "Open a row for detail and edit.",
      },
    },
  ],
};

export const calendarTour: TourDef = {
  id: "calendar",
  paths: ["/calendar"],
  inviteTitle: { FA: "تور تقویم؟", EN: "Tour the calendar?" },
  inviteBody: {
    FA: "نمای روز/هفته/ماه و جابه‌جایی کارها را مرور می‌کنیم.",
    EN: "Day/week/month views and moving dated work.",
  },
  steps: [
    {
      id: "c-header",
      target: "page-calendar",
      gate: { kind: "always" },
      title: { FA: "تقویم", EN: "Calendar" },
      body: {
        FA: "کارهای تاریخ‌دار روی زمان واقعی روز و هفته.",
        EN: "Dated work on real day and week time.",
      },
    },
    {
      id: "c-views",
      target: "calendar-views",
      gate: { kind: "always" },
      title: { FA: "نمایش‌ها", EN: "Views" },
      body: {
        FA: "روز، هفته، ماه — همان کار، زاویهٔ متفاوت.",
        EN: "Day, week, month — same work, different angle.",
      },
    },
    {
      id: "c-grid",
      target: "calendar-grid",
      gate: { kind: "always" },
      title: { FA: "شبکه", EN: "Grid" },
      body: {
        FA: "بکش و رها کن تا تاریخ یا ساعت عوض شود.",
        EN: "Drag and drop to change date or time.",
      },
    },
  ],
};

export const projectsTour: TourDef = {
  id: "projects",
  paths: ["/projects"],
  inviteTitle: { FA: "تور حوزه‌ها؟", EN: "Tour areas & paths?" },
  inviteBody: {
    FA: "حوزه‌های زندگی و مسیرهای داخلشان را کوتاه مرور می‌کنیم.",
    EN: "A short look at life areas and the paths inside them.",
  },
  steps: [
    {
      id: "p-header",
      target: "page-projects",
      gate: { kind: "always" },
      title: { FA: "حوزه‌ها و مسیرها", EN: "Areas & paths" },
      body: {
        FA: "سازمان زندگی اینجاست تا صفحهٔ امروز خلوت بماند.",
        EN: "Organize life here so Today stays uncluttered.",
      },
    },
    {
      id: "p-areas",
      target: "projects-areas",
      gate: { kind: "always" },
      title: { FA: "کارت حوزه‌ها", EN: "Area cards" },
      body: {
        FA: "هر حوزه مسیرها و پیشرفت خودش را دارد. از منوی کارت، ویرایش یا بایگانی کن.",
        EN: "Each area has its own paths and progress. Edit or archive from the card menu.",
      },
    },
  ],
};

export const docsTour: TourDef = {
  id: "docs",
  paths: ["/docs"],
  inviteTitle: { FA: "تور نوشته‌ها؟", EN: "Tour Docs?" },
  inviteBody: {
    FA: "فهرست، ادیتور، پوشه/تگ، منابع و نسخه‌ها را قدم‌به‌قدم می‌بینیم — همان چیزی که واقعاً روی صفحه است.",
    EN: "Walk the library, editor, folders/tags, sources, and versions — what’s actually on this page.",
  },
  steps: [
    {
      id: "d-header",
      target: "page-docs",
      gate: { kind: "always" },
      title: { FA: "نوشته‌ها چیست؟", EN: "What Docs are for" },
      body: {
        FA: "اینجا جای نوشتهٔ بلند است: فصل، یادداشت، پیش‌نویس مقاله — نه کارت کوتاه کار. هر سند می‌تواند به حوزه، پوشه، تگ و کار وصل شود.",
        EN: "Long-form writing lives here: chapters, notes, drafts — not short task cards. Docs can link to areas, folders, tags, and tasks.",
      },
    },
    {
      id: "d-create",
      target: "docs-create",
      gate: { kind: "always" },
      title: { FA: "ساخت سند", EN: "Create a doc" },
      body: {
        FA: "«سند جدید» یک صفحهٔ خالی می‌سازد. «از قالب» با ساختار آماده (مثلاً یادداشت روزانه یا فصل) شروع می‌کند تا از صفر ننویسی.",
        EN: "New Doc starts blank. From template seeds a structure (daily note, chapter, …) so you don’t start from zero.",
      },
    },
    {
      id: "d-areas",
      target: "docs-area-filter",
      gate: { kind: "always" },
      title: { FA: "فیلتر حوزه و آرشیو", EN: "Area filter & archive" },
      body: {
        FA: "با تراشه‌های حوزه فقط نوشته‌های همان قسمت زندگی را ببین. «آرشیو» سندهای کنارگذاشته و «سطل زباله» حذف‌شده‌ها را تا ۳۰ روز نگه می‌دارد.",
        EN: "Area chips narrow the library to one life area. Archive holds set-aside docs; Trash keeps deletes for 30 days.",
      },
    },
    {
      id: "d-library",
      target: "docs-library",
      gate: { kind: "always" },
      title: { FA: "ستون فهرست", EN: "The library column" },
      body: {
        FA: "جستجو، فیلتر پوشه و تگ، و فهرست اسناد اینجاست. از «مدیریت پوشه و تگ» ساختار را بساز. روی یک ردیف بزن تا در ادیتور باز شود.",
        EN: "Search, folder/tag filters, and the doc list live here. Manage folders & tags to organize. Click a row to open it in the editor.",
      },
    },
    {
      id: "d-editor",
      target: "docs-editor",
      gate: { kind: "always" },
      title: { FA: "ادیتور", EN: "The editor" },
      body: {
        FA: "عنوان بالا و متن در بدنه. ذخیره خودکار است (وضعیت ذخیره کنار عنوان). اگر سندی باز نیست، یکی بساز یا از فهرست انتخاب کن تا این بخش پر شود.",
        EN: "Title on top, body below. Saves automatically (status next to the title). If nothing is open, create or pick a doc so this pane fills in.",
      },
    },
    {
      id: "d-toolbar",
      target: "docs-toolbar",
      gate: { kind: "always" },
      title: { FA: "نوار قالب‌بندی", EN: "Formatting bar" },
      body: {
        FA: "پررنگ، عنوان، فهرست، چک‌لیست، جدول، تصویر، پاورقی — از نوار یا با تایپ / در متن (دستورهای سریع). وقتی سند باز باشد دیده می‌شود.",
        EN: "Bold, headings, lists, checklist, table, image, footnote — from the bar or by typing / in the body. Appears when a doc is open.",
      },
    },
    {
      id: "d-chrome",
      target: "docs-editor-chrome",
      gate: { kind: "always" },
      title: { FA: "تمرکز و خروجی", EN: "Focus & export" },
      body: {
        FA: "حالت تمرکز حواس‌پرتی را کم می‌کند. از منوی دانلود، Markdown / PDF / Word بگیر؛ لینک سند را هم می‌توانی کپی کنی. سنجاق و آرشیو برای نظم فهرست‌اند.",
        EN: "Focus mode clears chrome. Export Markdown / PDF / Word from the download menu; copy the doc link anytime. Pin and archive keep the library tidy.",
      },
    },
    {
      id: "d-side",
      target: "docs-side",
      gate: { kind: "always" },
      title: { FA: "پنل ابزار سند", EN: "Doc tools panel" },
      body: {
        FA: "چهار تب: سرفصل (از H1–H3)، کارها (وصل یا ساخت از سند/چک‌لیست)، منابع و PDF با حاشیه‌نویسی، نسخه‌ها (ذخیره دستی، بازیابی، مقایسه). با باز بودن سند معنا دارد.",
        EN: "Four tabs: outline (H1–H3), tasks (link or create from doc/checklist), sources & PDF annotate, versions (manual save, restore, compare). Meaningful once a doc is open.",
      },
    },
    {
      id: "d-finish",
      target: "page-docs",
      gate: { kind: "always" },
      title: { FA: "جمع‌بندی", EN: "You’re set" },
      body: {
        FA: "چرخهٔ معمول: سند بساز → در ادیتور بنویس → با پوشه/تگ منظم کن → منبع و نسخه نگه دار → اگر لازم است به کار وصل کن. هر وقت خواستی از «تور این صفحه» دوباره ببین.",
        EN: "Usual loop: create → write → organize with folder/tags → keep sources & versions → link tasks when needed. Restart anytime via Tour this page.",
      },
    },
  ],
};

export const researchTour: TourDef = {
  id: "research",
  paths: ["/research"],
  inviteTitle: { FA: "تور پژوهش؟", EN: "Tour research?" },
  inviteBody: {
    FA: "خط لوله، کتابخانه منابع و نوشتن را قدم‌به‌قدم روی همین صفحه می‌بینیم.",
    EN: "Walk pipeline, source library, and writing — what’s actually on this page.",
  },
  steps: [
    {
      id: "r-header",
      target: "page-research",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "هاب پژوهش چیست؟", EN: "What the research hub is for" },
      body: {
        FA: "اینجا پژوهش از کار روزمره جداست: بورد مسیر، کتابخانه منابع (DOI/BibTeX)، و نوشتن دکتری — همه در یک هاب با محدودهٔ پروژه.",
        EN: "Research lives apart from daily work: path board, source library (DOI/BibTeX), and PhD writing — one hub with project scope.",
      },
    },
    {
      id: "r-project",
      target: "research-project",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "پروژهٔ پژوهش", EN: "Research project" },
      body: {
        FA: "با سوئیچر، همه / اینباکس / یک مسیر را فیلتر کن تا منابع و کارها قاطی نشوند. پروژهٔ جدید هم از همین‌جا ساخته می‌شود.",
        EN: "Filter All / Inbox / one path so sources and tasks stay scoped. Create a new research project here too.",
      },
    },
    {
      id: "r-tabs",
      target: "research-tabs",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "تب‌های هاب", EN: "Hub tabs" },
      body: {
        FA: "خط لوله · کتابخانه · نوشتن. هر تب همان بخش را باز می‌کند؛ محدودهٔ پروژه روی هر سه اعمال می‌شود.",
        EN: "Pipeline · Library · Writing. Each tab opens that section; project scope applies to all three.",
      },
    },
    {
      id: "r-pipeline",
      target: "research-pipeline",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "خط لوله", EN: "Pipeline board" },
      body: {
        FA: "بورد کانبان پژوهش: کارها را بین ستون‌ها بکش. «کار جدید» در هدر همین تب را باز می‌کند. فیلتر پروژه از سوئیچر بالاست.",
        EN: "Research kanban: drag tasks across columns. New task in the header opens create. Project filter comes from the switcher above.",
      },
    },
    {
      id: "r-aside",
      target: "research-aside",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "کنار خط لوله", EN: "Beside the board" },
      body: {
        FA: "امروز بنویس (یادداشت روزانه و قالب‌ها)، اسناد دکتری اخیر، و نقل‌قول‌های تازه — میان‌بر به نوشته‌ها بدون ترک هاب. روی موبایل داخل «جزئیات» جمع می‌شود.",
        EN: "Write today (daily note & templates), recent PhD docs, and fresh quotes — shortcuts into Docs without leaving the hub. On mobile it folds into a details panel.",
      },
    },
    {
      id: "r-library",
      target: "research-library",
      href: "/research?tab=library",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "کتابخانه منابع", EN: "Source library" },
      body: {
        FA: "منابع را با DOI بگیر، وضعیت مطالعه بگذار، PDF حاشیه‌نویسی کن، نقل‌قول بساز، به کار وصل کن، و BibTeX خروجی بگیر.",
        EN: "Fetch by DOI, set reading status, annotate PDFs, capture quotes, link to tasks, and export BibTeX.",
      },
    },
    {
      id: "r-writing",
      target: "research-writing",
      href: "/research?tab=writing",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "نوشتن", EN: "Writing" },
      body: {
        FA: "ادامهٔ پیش‌نویس، قالب مرور ادبیات/فصل، ساخت پوشه‌های دکتری، نبض نوشتن، و فهرست پیش‌نویس‌های باز — مسیر به ادیتور نوشته‌ها.",
        EN: "Resume a draft, lit-review/chapter templates, ensure PhD folders, writing pulse, and open drafts — into the Docs editor.",
      },
    },
    {
      id: "r-finish",
      target: "page-research",
      href: "/research?tab=pipeline",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "جمع‌بندی", EN: "You’re set" },
      body: {
        FA: "چرخهٔ معمول: مسیر را انتخاب کن → در خط لوله کار بچین → منبع به کتابخانه اضافه کن → در نوشتن پیش‌نویس را جلو ببر. هر وقت خواستی از «تور این صفحه» دوباره ببین.",
        EN: "Usual loop: pick a path → plan on the pipeline → add sources in the library → advance drafts in Writing. Restart anytime via Tour this page.",
      },
    },
  ],
};

export const languageTour: TourDef = {
  id: "language",
  paths: ["/language"],
  inviteTitle: { FA: "تور هاب زبان؟", EN: "Tour language hub?" },
  inviteBody: {
    FA: "امروز، مهارت‌ها، واژگان، شنیداری، آزمون و یادداشت را قدم‌به‌قدم روی همین صفحه می‌بینیم.",
    EN: "Walk Today, skills, vocab, listening, exams, and notes — what’s actually on this page.",
  },
  steps: [
    {
      id: "l-header",
      target: "page-language",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "هاب زبان چیست؟", EN: "What the language hub is for" },
      body: {
        FA: "اینجا تمرین زبان از کار روزمره جداست: جلسه ثبت کن، واژگان مرور کن، شنیداری کار کن، موک آزمون بزن، و یادداشت بساز — همه در یک هاب.",
        EN: "Language practice lives apart from daily work: log sessions, review vocab, train listening, run mocks, and start notes — one hub.",
      },
    },
    {
      id: "l-project",
      target: "language-project",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "پروژهٔ زبان", EN: "Language project" },
      body: {
        FA: "با سوئیچر، همه / اینباکس / یک پروژه را فیلتر کن تا واژگان و جلسات قاطی نشوند. پروژهٔ جدید هم از همین‌جا ساخته می‌شود.",
        EN: "Filter All / Inbox / one project so vocab and sessions stay scoped. Create a new project here too.",
      },
    },
    {
      id: "l-tabs",
      target: "language-tabs",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "تب‌های هاب", EN: "Hub tabs" },
      body: {
        FA: "امروز · مهارت‌ها · واژگان · شنیداری · آزمون‌ها · یادداشت. عدد کنار واژگان یعنی کارت سررسید؛ کنار شنیداری یعنی کلیپ آماده.",
        EN: "Today · Skills · Vocab · Listening · Exams · Notes. Vocab badge = due cards; listening badge = clips ready.",
      },
    },
    {
      id: "l-pulse",
      target: "language-today-pulse",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "نبض هفته", EN: "Week pulse" },
      body: {
        FA: "دقیقه‌های هفته، زنجیرهٔ روزها، پیشرفت هدف هفتگی، و پیشنهاد مهارت بعدی — خلاصهٔ اینکه امروز از کجا شروع کنی.",
        EN: "Week minutes, streak, goal progress, and the next skill suggestion — a snapshot of where to start today.",
      },
    },
    {
      id: "l-practice",
      target: "language-today-practice",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "میان‌بر تمرین", EN: "Practice shortcuts" },
      body: {
        FA: "یک ضربه برو سراغ مرور واژگان، شنیداری، یا تب آزمون (اگر تاریخ آزمون یا موک اخیر داری). میان‌برها همان تب‌ها را باز می‌کنند.",
        EN: "One tap into vocab review, listening, or exams (when you have an exam date or recent mock). Shortcuts open those same tabs.",
      },
    },
    {
      id: "l-session",
      target: "language-session",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "ثبت جلسه", EN: "Log a session" },
      body: {
        FA: "مهارت + دقیقه (+ یادداشت اختیاری) را بزن تا تمرین واقعی در آمار هفته و تب مهارت‌ها دیده شود. پایین‌تر، جلسات اخیر را می‌بینی.",
        EN: "Pick skill + minutes (+ optional note) so real practice shows in week stats and Skills. Recent sessions list below.",
      },
    },
    {
      id: "l-target",
      target: "language-target",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "هدف آزمون", EN: "Exam target" },
      body: {
        FA: "نوع آزمون، نمرهٔ هدف، تاریخ، و هدف دقیقهٔ هفتگی را اینجا تنظیم کن. این پروفایل پیشنهادات امروز و تب آزمون را جهت می‌دهد.",
        EN: "Set exam type, target score, date, and weekly minutes. This profile steers Today suggestions and the Exams tab.",
      },
    },
    {
      id: "l-skills",
      target: "language-skills",
      href: "/language?tab=skills",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "مهارت‌ها", EN: "Skills" },
      body: {
        FA: "توزیع تمرین روی مهارت‌ها، ثبت سریع جلسه، و دریل‌های کوتاه (جایی که فعال باشد). برای دیدن ضعف‌ها و تعادل هفته اینجاست.",
        EN: "Practice split by skill, quick session logging, and short drills where available — balance and weak spots for the week.",
      },
    },
    {
      id: "l-vocab",
      target: "language-vocab",
      href: "/language?tab=vocab",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "واژگان", EN: "Vocab" },
      body: {
        FA: "مرور SRS کارت‌های سررسید، افزودن کارت، و نصب دسته. فیلتر سخت/همه برای تمرکز روی موارد مشکل‌دار.",
        EN: "SRS review for due cards, add cards, install decks. Hard/all filters focus on tough items.",
      },
    },
    {
      id: "l-listening",
      target: "language-listening",
      href: "/language?tab=listening",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "شنیداری", EN: "Listening" },
      body: {
        FA: "کلیپ‌ها (مثلاً یوتیوب)، دیکته، و ثبت جلسهٔ شنیداری. استارترها را نصب کن یا لینک خودت را اضافه کن.",
        EN: "Clips (e.g. YouTube), dictation, and logging listening sessions. Install starters or add your own link.",
      },
    },
    {
      id: "l-exams",
      target: "language-exams",
      href: "/language?tab=exams",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "آزمون‌ها", EN: "Exams" },
      body: {
        FA: "مسیر آزمون (MSRT/IELTS/…)، شروع موک، و ذخیرهٔ نتیجه. با هدف آزمون در ستون امروز هماهنگ است.",
        EN: "Exam tracks (MSRT/IELTS/…), start a mock, save results — aligned with the Today target profile.",
      },
    },
    {
      id: "l-notes",
      target: "language-notes",
      href: "/language?tab=notes",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "یادداشت زبان", EN: "Language notes" },
      body: {
        FA: "سندهای اخیر زبان و قالب‌های شروع (جلسه، خطایابی، انشا) که در نوشته‌ها باز می‌شوند — برای نوشتن کنار تمرین.",
        EN: "Recent language docs and starters (session, error log, essay) that open in Docs — writing beside practice.",
      },
    },
    {
      id: "l-finish",
      target: "page-language",
      href: "/language?tab=today",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "جمع‌بندی", EN: "You’re set" },
      body: {
        FA: "چرخهٔ معمول: هدف بگذار → امروز تمرین کن / جلسه ثبت کن → واژگان و شنیداری را منظم مرور کن → موک بزن → یادداشت نگه دار. هر وقت خواستی از «تور این صفحه» دوباره ببین.",
        EN: "Usual loop: set a target → practice / log today → keep vocab & listening regular → run mocks → keep notes. Restart anytime via Tour this page.",
      },
    },
  ],
};

export const reviewTour: TourDef = {
  id: "review",
  paths: ["/review"],
  inviteTitle: { FA: "تور بازبینی؟", EN: "Tour review?" },
  inviteBody: {
    FA: "جمع‌بندی هفته و برنامه‌ریزی بعد را می‌بینیم.",
    EN: "Week wrap-up and planning what is next.",
  },
  steps: [
    {
      id: "rv-header",
      target: "page-review",
      gate: { kind: "always" },
      title: { FA: "بازبینی", EN: "Review" },
      body: {
        FA: "چه تمام شد، چه ماند — برای چیدن هفتهٔ بعد.",
        EN: "What finished, what remained — to plan the next week.",
      },
    },
  ],
};

export const settingsTour: TourDef = {
  id: "settings",
  paths: ["/settings"],
  inviteTitle: { FA: "تور تنظیمات؟", EN: "Tour settings?" },
  inviteBody: {
    FA: "پروفایل، امنیت، قابلیت‌ها، اعلان و ظاهر را قدم‌به‌قدم روی همین صفحه می‌بینیم.",
    EN: "Walk profile, security, capabilities, notifications, and appearance — what’s on this page.",
  },
  steps: [
    {
      id: "s-header",
      target: "page-settings",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "تنظیمات چیست؟", EN: "What Settings is for" },
      body: {
        FA: "اینجا هویت، امنیت، ماژول‌ها، اعلان‌ها و ظاهر اپ را کنترل می‌کنی — جدا از کار روزمرهٔ Today.",
        EN: "Identity, security, modules, notifications, and look & feel — apart from day-to-day Today work.",
      },
    },
    {
      id: "s-tabs",
      target: "settings-tabs",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "تب‌های تنظیمات", EN: "Settings tabs" },
      body: {
        FA: "پروفایل · امنیت · قابلیت‌ها (برای اعضا) · اعلان‌ها · ظاهر. هر تب همان بخش را باز می‌کند.",
        EN: "Profile · Security · Capabilities (members) · Notifications · Appearance. Each tab opens that section.",
      },
    },
    {
      id: "s-profile",
      target: "settings-profile",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "کارت پروفایل", EN: "Profile card" },
      body: {
        FA: "آواتار (آپلود یا از پیش‌فرض‌ها)، نام و ایمیل. این همان چیزی است که در اپ دیده می‌شود.",
        EN: "Avatar (upload or presets), name, and email — how you appear in the app.",
      },
    },
    {
      id: "s-profile-form",
      target: "settings-profile-form",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "اطلاعات شخصی", EN: "Personal info" },
      body: {
        FA: "نام، تلفن و بیو را ویرایش کن. ایمیل ثابت است؛ تاریخ عضویت و آخرین ورود کنارش خلاصه می‌شود.",
        EN: "Edit name, phone, and bio. Email is fixed; member-since and last login sit beside it.",
      },
    },
    {
      id: "s-bale",
      target: "settings-bale",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "اتصال بله", EN: "Bale link" },
      body: {
        FA: "برای یادآور و خلاصه در بله، کد را کپی کن و در ربات بفرست. وصل‌شده باشی می‌توانی قطع کنی.",
        EN: "For Bale digests/reminders, copy the code into the bot. Unlink anytime once connected.",
      },
    },
    {
      id: "s-security",
      target: "settings-security",
      href: "/settings?tab=security",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "نمای امنیت", EN: "Security overview" },
      body: {
        FA: "آخرین ورود، وضعیت رمز، و قفل موقت حساب — یک نگاه سریع که همه‌چیز سالم است.",
        EN: "Last login, password status, and temporary lock — a quick health check.",
      },
    },
    {
      id: "s-password",
      target: "settings-password",
      href: "/settings?tab=security",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "تغییر رمز", EN: "Change password" },
      body: {
        FA: "رمز فعلی و رمز جدید را بزن. اگر رمز نداری (مثلاً ورود خاص)، این فرم بعداً معنا پیدا می‌کند.",
        EN: "Enter current and new password. If you have no password yet, this form matters once you set one.",
      },
    },
    {
      id: "s-sessions",
      target: "settings-sessions",
      href: "/settings?tab=security",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "نشست‌ها و تاریخچه", EN: "Sessions & history" },
      body: {
        FA: "«خروج از همه دستگاه‌ها» همهٔ نشست‌ها را می‌بندد. پایین‌تر، ورودهای اخیر با دستگاه و IP دیده می‌شود.",
        EN: "Log out everywhere ends all sessions. Below: recent logins with device and IP.",
      },
    },
    {
      id: "s-capabilities",
      target: "settings-capabilities",
      href: "/settings?tab=capabilities",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "قابلیت‌ها و نما", EN: "Capabilities & view" },
      body: {
        FA: "نما ساده/کامل منو را خلوت یا پُر می‌کند. ماژول‌های روشن/خاموش (زبان، پژوهش، …) را اینجا تنظیم کن؛ داده پاک نمی‌شود. از همین‌جا تور نقشهٔ منو را هم دوباره شروع کن.",
        EN: "Starter/Full toggles menu density. Turn modules on/off (language, research, …) without deleting data. Restart the menu-map tour from here too.",
      },
    },
    {
      id: "s-notifications",
      target: "settings-notifications",
      href: "/settings?tab=notifications",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "اعلان‌ها", EN: "Notifications" },
      body: {
        FA: "کلید اصلی، ایمیل/صدا، رویدادهای کار، مجوز مرورگر، و ساعت خلاصه/عادت بله — هر کانال جدا تنظیم می‌شود.",
        EN: "Master switch, email/sound, task events, browser permission, and Bale digest/habit hours — each channel is separate.",
      },
    },
    {
      id: "s-appearance",
      target: "settings-appearance",
      href: "/settings?tab=appearance",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "ظاهر و زبان", EN: "Theme & language" },
      body: {
        FA: "روشن / تیره / سیستم، و فارسی یا انگلیسی برای کل رابط. همان لحظه اعمال می‌شود.",
        EN: "Light / dark / system, plus FA or EN for the whole UI — applied immediately.",
      },
    },
    {
      id: "s-finish",
      target: "page-settings",
      href: "/settings?tab=profile",
      navigate: true,
      gate: { kind: "always" },
      title: { FA: "جمع‌بندی", EN: "You’re set" },
      body: {
        FA: "چرخهٔ معمول: پروفایل را درست کن → امنیت را چک کن → قابلیت‌های لازم را روشن کن → اعلان‌ها را تنظیم کن → ظاهر را انتخاب کن. هر وقت خواستی از «تور این صفحه» دوباره ببین.",
        EN: "Usual loop: fix profile → check security → enable needed modules → tune notifications → pick appearance. Restart anytime via Tour this page.",
      },
    },
  ],
};

export const PAGE_TOURS: TourDef[] = [
  todayTour,
  boardTour,
  tasksTour,
  calendarTour,
  projectsTour,
  docsTour,
  researchTour,
  languageTour,
  reviewTour,
  settingsTour,
];
