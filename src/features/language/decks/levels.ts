import { toLessons, type VocabDeckDef } from "./types";

/** Leveled general English — original bilingual pack (A2 → C1-ish). */
const WORDS = [
  // L1 — A2 core
  {
    front: "achieve",
    back: "به دست آوردن؛ موفق شدن به",
    example: "She achieved her weekly study goal.",
  },
  {
    front: "advice",
    back: "نصیحت؛ مشاوره (اسم غیرقابل‌شمارش)",
    example: "His advice was short and useful.",
  },
  {
    front: "agree",
    back: "موافق بودن",
    example: "I agree with your plan.",
  },
  {
    front: "almost",
    back: "تقریباً",
    example: "We almost finished the chapter.",
  },
  {
    front: "already",
    back: "از قبل؛ دیگر",
    example: "I have already reviewed these cards.",
  },
  {
    front: "although",
    back: "اگرچه",
    example: "Although it was hard, she continued.",
  },
  {
    front: "among",
    back: "در میان",
    example: "He is among the top students.",
  },
  {
    front: "appear",
    back: "ظاهر شدن؛ به‌نظر رسیدن",
    example: "New errors appear after the update.",
  },
  {
    front: "attend",
    back: "شرکت کردن در",
    example: "Please attend the morning lecture.",
  },
  {
    front: "avoid",
    back: "اجتناب کردن از",
    example: "Avoid cramming the night before.",
  },
  {
    front: "become",
    back: "شدن؛ تبدیل شدن به",
    example: "Practice can become a habit.",
  },
  {
    front: "believe",
    back: "باور کردن",
    example: "I believe spaced review works.",
  },
  // L2 — B1 daily academic
  {
    front: "benefit",
    back: "فایده؛ سود بردن",
    example: "You benefit from daily reading.",
  },
  {
    front: "cause",
    back: "باعث شدن؛ علت",
    example: "Stress can cause poor focus.",
  },
  {
    front: "choose",
    back: "انتخاب کردن",
    example: "Choose one weak skill to train.",
  },
  {
    front: "common",
    back: "رایج؛ مشترک",
    example: "This is a common exam mistake.",
  },
  {
    front: "compare",
    back: "مقایسه کردن",
    example: "Compare the two paragraphs carefully.",
  },
  {
    front: "complete",
    back: "کامل کردن؛ کامل",
    example: "Complete the form before the mock.",
  },
  {
    front: "consider",
    back: "در نظر گرفتن",
    example: "Consider changing your schedule.",
  },
  {
    front: "continue",
    back: "ادامه دادن",
    example: "Continue even when progress feels slow.",
  },
  {
    front: "decide",
    back: "تصمیم گرفتن",
    example: "Decide your target score today.",
  },
  {
    front: "describe",
    back: "توصیف کردن",
    example: "Describe the chart in two sentences.",
  },
  {
    front: "develop",
    back: "توسعه دادن؛ رشد کردن",
    example: "Develop a simple writing routine.",
  },
  {
    front: "different",
    back: "متفاوت",
    example: "Try a different practice method.",
  },
  // L3 — B1→B2
  {
    front: "encourage",
    back: "تشویق کردن",
    example: "Good feedback can encourage learners.",
  },
  {
    front: "evidence",
    back: "شواهد؛ مدرک",
    example: "Provide evidence for each claim.",
  },
  {
    front: "expect",
    back: "انتظار داشتن",
    example: "Do not expect overnight fluency.",
  },
  {
    front: "explain",
    back: "توضیح دادن",
    example: "Explain the idea in plain words.",
  },
  {
    front: "express",
    back: "بیان کردن",
    example: "Express disagreement politely.",
  },
  {
    front: "focus",
    back: "تمرکز؛ تمرکز کردن",
    example: "Focus on accuracy first.",
  },
  {
    front: "improve",
    back: "بهبود یافتن / دادن",
    example: "Short drills improve speed.",
  },
  {
    front: "include",
    back: "شامل کردن",
    example: "Include an example in each paragraph.",
  },
  {
    front: "increase",
    back: "افزایش دادن / یافتن",
    example: "Increase reading time gradually.",
  },
  {
    front: "instead",
    back: "به‌جای آن",
    example: "Review notes instead of rereading blindly.",
  },
  {
    front: "intend",
    back: "قصد داشتن",
    example: "I intend to finish lesson three today.",
  },
  {
    front: "involve",
    back: "شامل بودن؛ درگیر کردن",
    example: "The task involves timed listening.",
  },
  // L4 — B2 academic
  {
    front: "accurate",
    back: "دقیق",
    example: "Keep summaries accurate and short.",
  },
  {
    front: "adequate",
    back: "کافی؛ بسنده",
    example: "Seven hours of sleep is adequate for most.",
  },
  {
    front: "approach",
    back: "رویکرد؛ نزدیک شدن",
    example: "A calm approach reduces exam anxiety.",
  },
  {
    front: "assume",
    back: "فرض کردن",
    example: "Do not assume the reader knows jargon.",
  },
  {
    front: "complex",
    back: "پیچیده",
    example: "Break complex ideas into steps.",
  },
  {
    front: "conclude",
    back: "نتیجه‌گیری کردن",
    example: "Conclude with a clear takeaway.",
  },
  {
    front: "contribute",
    back: "مشارکت کردن؛ کمک کردن به",
    example: "Peer review can contribute to better drafts.",
  },
  {
    front: "contrast",
    back: "تضاد؛ در تقابل قرار دادن",
    example: "Contrast the two theories briefly.",
  },
  {
    front: "crucial",
    back: "حیاتی؛ بسیار مهم",
    example: "Timing is crucial in listening sections.",
  },
  {
    front: "decline",
    back: "کاهش یافتن؛ رد کردن",
    example: "Scores may decline without review.",
  },
  {
    front: "demonstrate",
    back: "نشان دادن؛ اثبات کردن",
    example: "Charts demonstrate the trend clearly.",
  },
  {
    front: "distinct",
    back: "متمایز؛ جدا",
    example: "Keep each paragraph on a distinct point.",
  },
  // L5 — B2→C1
  {
    front: "emphasize",
    back: "تأکید کردن بر",
    example: "Emphasize the main finding early.",
  },
  {
    front: "evaluate",
    back: "ارزیابی کردن",
    example: "Evaluate sources before citing them.",
  },
  {
    front: "expand",
    back: "گسترش دادن",
    example: "Expand your outline into full sentences.",
  },
  {
    front: "flexible",
    back: "انعطاف‌پذیر",
    example: "Keep a flexible study calendar.",
  },
  {
    front: "frequent",
    back: "مکرر؛ پرتکرار",
    example: "Make short, frequent review sessions.",
  },
  {
    front: "generate",
    back: "تولید کردن؛ ایجاد کردن",
    example: "Brainstorming can generate useful ideas.",
  },
  {
    front: "highlight",
    back: "برجسته کردن؛ هایلایت",
    example: "Highlight only key terms, not whole pages.",
  },
  {
    front: "imply",
    back: "دلالت کردن؛ اشارهٔ غیرمستقیم",
    example: "What does the author imply here?",
  },
  {
    front: "maintain",
    back: "حفظ کردن؛ نگه داشتن",
    example: "Maintain a steady review streak.",
  },
  {
    front: "obtain",
    back: "به دست آوردن",
    example: "Obtain feedback from a mentor.",
  },
  {
    front: "occur",
    back: "رخ دادن",
    example: "Errors often occur under time pressure.",
  },
  {
    front: "overall",
    back: "در مجموع؛ کلی",
    example: "Overall, the draft is clearer now.",
  },
  // L6 — C1 academic tone
  {
    front: "perceive",
    back: "ادراک کردن؛ دریافتن",
    example: "Students perceive timed tasks as harder.",
  },
  {
    front: "precise",
    back: "دقیق؛ مو به‌مو",
    example: "Use precise verbs in academic writing.",
  },
  {
    front: "prior",
    back: "قبلی؛ پیشین",
    example: "Build on prior knowledge carefully.",
  },
  {
    front: "relevant",
    back: "مرتبط؛ مربوط",
    example: "Keep only relevant examples.",
  },
  {
    front: "significant",
    back: "قابل‌توجه؛ معنادار",
    example: "There was a significant score jump.",
  },
  {
    front: "specific",
    back: "مشخص؛ خاص",
    example: "Give a specific example, not a vague one.",
  },
  {
    front: "subsequent",
    back: "بعدی؛ متعاقب",
    example: "Subsequent lessons reuse these words.",
  },
  {
    front: "sufficient",
    back: "کافی",
    example: "Is this evidence sufficient?",
  },
  {
    front: "tend",
    back: "تمایل داشتن به",
    example: "Learners tend to skip hard cards.",
  },
  {
    front: "undergo",
    back: "دستخوش شدن؛ طی کردن",
    example: "The syllabus will undergo revision.",
  },
  {
    front: "vary",
    back: "متغیر بودن؛ فرق کردن",
    example: "Difficulty can vary by section.",
  },
  {
    front: "whereas",
    back: "در حالی که",
    example: "Listening improved, whereas writing stalled.",
  },
];

export const VOCAB_DECK_LEVELS: VocabDeckDef = {
  key: "levels",
  lessonCount: 6,
  wordsPerLesson: 12,
  category: "general",
  starter: toLessons(WORDS, 12),
};
