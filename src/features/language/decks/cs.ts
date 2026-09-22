import { toLessons, type VocabDeckDef } from "./types";

/** Computer science / software engineering vocabulary (original glosses). */
const WORDS = [
  // L1 — foundations
  {
    front: "algorithm",
    back: "الگوریتم؛ رویهٔ گام‌به‌گام حل مسئله",
    example: "Sort the list with a simple algorithm first.",
  },
  {
    front: "array",
    back: "آرایه؛ ساختار داده‌ای با اندیس",
    example: "Store scores in an array.",
  },
  {
    front: "binary",
    back: "دودویی؛ مربوط به دو حالت ۰/۱",
    example: "Computers store data in binary form.",
  },
  {
    front: "bit",
    back: "بیت؛ کوچک‌ترین واحد داده",
    example: "One bit is either 0 or 1.",
  },
  {
    front: "bug",
    back: "باگ؛ خطا در نرم‌افزار",
    example: "We found a bug in the login flow.",
  },
  {
    front: "byte",
    back: "بایت؛ معمولاً ۸ بیت",
    example: "A character often takes one byte.",
  },
  {
    front: "cache",
    back: "کش؛ حافظهٔ موقت سریع",
    example: "Clear the cache if the page looks stale.",
  },
  {
    front: "client",
    back: "کلاینت؛ سمت درخواست‌کننده",
    example: "The client sends a request to the API.",
  },
  {
    front: "compiler",
    back: "کامپایلر؛ مترجم کد به زبان ماشین",
    example: "The compiler reported a type error.",
  },
  {
    front: "database",
    back: "پایگاه‌داده",
    example: "User profiles live in the database.",
  },
  {
    front: "debug",
    back: "دیباگ کردن؛ رفع اشکال",
    example: "Debug the failing test carefully.",
  },
  {
    front: "deploy",
    back: "دیپلوی کردن؛ استقرار نسخه",
    example: "We deploy to staging every Friday.",
  },
  // L2 — systems & web
  {
    front: "endpoint",
    back: "اندپوینت؛ نقطهٔ دسترسی API",
    example: "Add a new endpoint for search.",
  },
  {
    front: "framework",
    back: "فریمورک؛ چارچوب توسعه",
    example: "Next.js is a React framework.",
  },
  {
    front: "function",
    back: "تابع؛ بلوک قابل‌فراخوانی کد",
    example: "Extract the logic into a function.",
  },
  {
    front: "hardware",
    back: "سخت‌افزار",
    example: "Slow hardware can bottleneck builds.",
  },
  {
    front: "interface",
    back: "رابط؛ واسط برنامه‌نویسی یا UI",
    example: "Define a clear TypeScript interface.",
  },
  {
    front: "latency",
    back: "تأخیر شبکه/پاسخ",
    example: "High latency hurts chat apps.",
  },
  {
    front: "library",
    back: "کتابخانهٔ نرم‌افزاری",
    example: "Use a tested date library.",
  },
  {
    front: "loop",
    back: "حلقهٔ تکرار",
    example: "Avoid infinite loops in rendering.",
  },
  {
    front: "memory",
    back: "حافظه",
    example: "The process ran out of memory.",
  },
  {
    front: "module",
    back: "ماژول؛ واحد قابل‌واردات کد",
    example: "Split auth into its own module.",
  },
  {
    front: "network",
    back: "شبکه",
    example: "Check network errors in the console.",
  },
  {
    front: "packet",
    back: "بستهٔ داده در شبکه",
    example: "Packets may arrive out of order.",
  },
  // L3 — engineering practice
  {
    front: "protocol",
    back: "پروتکل؛ قواعد ارتباط",
    example: "HTTPS is a secure protocol.",
  },
  {
    front: "query",
    back: "کوئری؛ پرس‌وجو",
    example: "Optimize the slow SQL query.",
  },
  {
    front: "queue",
    back: "صف؛ ساختار FIFO",
    example: "Jobs wait in a background queue.",
  },
  {
    front: "refactor",
    back: "بازنویسی تمیز بدون تغییر رفتار",
    example: "Refactor before adding features.",
  },
  {
    front: "repository",
    back: "ریپازیتوری؛ مخزن کد یا داده",
    example: "Push the branch to the repository.",
  },
  {
    front: "runtime",
    back: "زمان اجرا؛ محیط اجرا",
    example: "A runtime error crashed the worker.",
  },
  {
    front: "schema",
    back: "اسکیما؛ ساختار داده/دیتابیس",
    example: "Update the Prisma schema carefully.",
  },
  {
    front: "server",
    back: "سرور؛ سمت سرویس‌دهنده",
    example: "The server returned status 500.",
  },
  {
    front: "software",
    back: "نرم‌افزار",
    example: "Ship reliable software, not just demos.",
  },
  {
    front: "stack",
    back: "پشته؛ یا مجموعهٔ تکنولوژی",
    example: "Our stack is TypeScript and PostgreSQL.",
  },
  {
    front: "thread",
    back: "ترد؛ مسیر اجرای موازی",
    example: "Avoid race conditions across threads.",
  },
  {
    front: "throughput",
    back: "توان عملیاتی؛ نرخ پردازش",
    example: "Caching improved throughput a lot.",
  },
  // L4 — architecture & quality
  {
    front: "abstraction",
    back: "انتزاع؛ پنهان‌کردن جزئیات پیچیده",
    example: "Good abstraction hides storage details.",
  },
  {
    front: "api",
    back: "API؛ رابط برنامه‌نویسی کاربردی",
    example: "Document every public API change.",
  },
  {
    front: "authentication",
    back: "احراز هویت",
    example: "Authentication must run before the route.",
  },
  {
    front: "authorization",
    back: "مجوزدهی؛ کنترل دسترسی",
    example: "Authorization checks the user role.",
  },
  {
    front: "concurrency",
    back: "هم‌زمانی اجرا",
    example: "Concurrency bugs are hard to reproduce.",
  },
  {
    front: "encryption",
    back: "رمزنگاری",
    example: "Use encryption for secrets at rest.",
  },
  {
    front: "idempotent",
    back: "توان‌یکسان؛ تکرار بدون اثر اضافه",
    example: "Payment webhooks should be idempotent.",
  },
  {
    front: "middleware",
    back: "میان‌افزار؛ لایهٔ میانی درخواست",
    example: "Add logging middleware once.",
  },
  {
    front: "migration",
    back: "مایگریشن؛ تغییر ساختار دیتابیس",
    example: "Never edit an applied migration casually.",
  },
  {
    front: "scalability",
    back: "مقیاس‌پذیری",
    example: "Design for scalability from day one.",
  },
  {
    front: "serialization",
    back: "سریال‌سازی؛ تبدیل به فرمت قابل‌انتقال",
    example: "JSON serialization failed on BigInt.",
  },
  {
    front: "transaction",
    back: "تراکنش؛ واحد اتمی عملیات دیتابیس",
    example: "Wrap both writes in one transaction.",
  },
  // L5 — modern product eng
  {
    front: "container",
    back: "کانتینر؛ بسته‌بندی ایزولهٔ اجرا",
    example: "Run the app inside a Docker container.",
  },
  {
    front: "microservice",
    back: "میکروسرویس؛ سرویس کوچک مستقل",
    example: "Do not split into microservices too early.",
  },
  {
    front: "observability",
    back: "قابلیت مشاهده؛ لاگ/متریک/تریس",
    example: "Observability helps find production issues.",
  },
  {
    front: "orchestration",
    back: "ارکستراسیون؛ هماهنگی سرویس‌ها/کانتینرها",
    example: "Kubernetes handles container orchestration.",
  },
  {
    front: "pagination",
    back: "صفحه‌بندی نتایج",
    example: "Add cursor pagination for large lists.",
  },
  {
    front: "pipeline",
    back: "پایپ‌لاین؛ زنجیرهٔ مراحل پردازش",
    example: "The CI pipeline runs tests on every PR.",
  },
  {
    front: "rate limit",
    back: "محدودیت نرخ درخواست",
    example: "Apply a rate limit to public endpoints.",
  },
  {
    front: "rollback",
    back: "بازگردانی به نسخه/وضعیت قبل",
    example: "Prepare a rollback plan before deploy.",
  },
  {
    front: "sharding",
    back: "شاردینگ؛ تقسیم داده بین چند گره",
    example: "Sharding adds operational complexity.",
  },
  {
    front: "snapshot",
    back: "اسنپ‌شات؛ تصویر لحظه‌ای وضعیت",
    example: "Restore from yesterday's snapshot.",
  },
  {
    front: "timeout",
    back: "تایم‌اوت؛ پایان مهلت انتظار",
    example: "Increase the request timeout carefully.",
  },
  {
    front: "validation",
    back: "اعتبارسنجی ورودی/داده",
    example: "Do validation on the server, not only UI.",
  },
];

export const VOCAB_DECK_CS: VocabDeckDef = {
  key: "cs",
  lessonCount: 5,
  wordsPerLesson: 12,
  category: "tech",
  starter: toLessons(WORDS, 12),
};
