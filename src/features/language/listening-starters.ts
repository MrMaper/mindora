/** Curated free YouTube listening starters (BBC Learning English & similar). */

export type ListeningStarter = {
  key: string;
  title: string;
  youtubeId: string;
  level: string;
  topic: string;
  hint: string;
  /** Short original practice lines for dictation (not a full video script). */
  transcript: string;
};

export const LISTENING_STARTERS: ListeningStarter[] = [
  // —— Speaking & learning ——
  {
    key: "bbc-scared-speak",
    title: "Scared to speak English?",
    youtubeId: "YAsDeXcYyTg",
    level: "B1",
    topic: "learning",
    hint: "روی اضطراب صحبت کردن تمرکز کن.",
    transcript:
      "Have you ever been scared of speaking in English? It is OK to make mistakes when you speak a foreign language.",
  },
  {
    key: "bbc-multiple-languages",
    title: "Learning multiple languages",
    youtubeId: "9ifQ3xRz4hM",
    level: "B1–B2",
    topic: "learning",
    hint: "واژه‌های مرتبط با polyglot را بگیر.",
    transcript:
      "Someone who knows multiple languages is called a polyglot. Learning languages can be good for your brain.",
  },
  {
    key: "bbc-best-schools",
    title: "Which country has the best schools?",
    youtubeId: "Xbv4IIqwW-4",
    level: "B1–B2",
    topic: "education",
    hint: "به رتبه‌بندی و واژه‌های education گوش بده.",
    transcript:
      "How do you compare education systems? Rankings try to show which countries are effective at teaching maths, science and reading.",
  },
  // —— Daily life ——
  {
    key: "bbc-housework",
    title: "Who does the housework?",
    youtubeId: "D9jZMLm72a8",
    level: "B1",
    topic: "daily life",
    hint: "یک‌بار بدون متن، بعد دیکته.",
    transcript:
      "We all know there are jobs around the house which have to be done regularly. Who tends to do the most amount of jobs in your household?",
  },
  {
    key: "bbc-mum-friends",
    title: "Making mum friends",
    youtubeId: "mxwJsvMj7JA",
    level: "B1",
    topic: "daily life",
    hint: "روی عبارات اجتماعی تمرکز کن.",
    transcript:
      "Making new friends as an adult can feel difficult. Shared routines and honest conversation help people connect.",
  },
  {
    key: "bbc-taste",
    title: "What decides our taste?",
    youtubeId: "AlrXqakHPuk",
    level: "B1–B2",
    topic: "science",
    hint: "ایدهٔ اصلی را اول بگیر.",
    transcript:
      "What decides our taste in food and music? Culture, memory and biology all play a part.",
  },
  {
    key: "bbc-spot-lie",
    title: "Can you spot a lie?",
    youtubeId: "91liS87P9CY",
    level: "B1–B2",
    topic: "psychology",
    hint: "واژه‌های مرتبط با lying را یادداشت کن.",
    transcript:
      "Lying is something a lot of us do sometimes to avoid trouble. Sometimes we lie just to impress someone.",
  },
  // —— Health ——
  {
    key: "bbc-drinking-water",
    title: "Are you drinking enough water?",
    youtubeId: "7F1iJZr-p4E",
    level: "B1",
    topic: "health",
    hint: "جزئیات عددی و توصیه‌ها را گوش بده.",
    transcript:
      "Are you drinking enough water every day? Staying hydrated helps your body and your concentration.",
  },
  {
    key: "bbc-healthy-old-age",
    title: "The secrets to a healthy old age",
    youtubeId: "rTSSchYtAXk",
    level: "B1–B2",
    topic: "health",
    hint: "عادات سالم را لیست کن.",
    transcript:
      "What are the secrets to a healthy old age? Movement, sleep and social connection matter more than we think.",
  },
  {
    key: "bbc-allergic",
    title: "Are we getting more allergic?",
    youtubeId: "H5BVbrZ64bQ",
    level: "B1–B2",
    topic: "health",
    hint: "واژگان پزشکی ساده را بگیر.",
    transcript:
      "Are we getting more allergic to things around us? Scientists look at environment, diet and our immune system.",
  },
  {
    key: "bbc-immune",
    title: "Can we boost the immune system?",
    youtubeId: "9hus12iCyL8",
    level: "B1–B2",
    topic: "health",
    hint: "ادعای تبلیغاتی را از واقعیت جدا کن.",
    transcript:
      "Can we really boost the immune system with special products? Lifestyle habits often matter more than supplements.",
  },
  {
    key: "bbc-sleep-korea",
    title: "Sleepy in South Korea",
    youtubeId: "NODkUzmamP8",
    level: "B1–B2",
    topic: "health",
    hint: "واژه‌های sleep و stress را بگیر.",
    transcript:
      "Sleep helps our mind and body rest and relax. Going without sleep is bad for our health.",
  },
  {
    key: "bbc-cancer-vaccine",
    title: "A vaccine for cancer",
    youtubeId: "RN6HGltVp2A",
    level: "B2",
    topic: "health",
    hint: "ایدهٔ علمی را خلاصه کن.",
    transcript:
      "Researchers are exploring vaccines that help the body fight cancer. Progress is promising but still complex.",
  },
  // —— Food ——
  {
    key: "bbc-wild-food",
    title: "Finding and eating wild food",
    youtubeId: "Ty3J0XGNpHg",
    level: "B1",
    topic: "food",
    hint: "واژه‌های foraging را یادداشت کن.",
    transcript:
      "Foraging is the activity of searching for wild food. You should remember safety rules if you try it yourself.",
  },
  {
    key: "bbc-meals-budget",
    title: "Healthy meals on a budget",
    youtubeId: "l66TJNGKQFQ",
    level: "B1",
    topic: "food",
    hint: "نکات عملی خرید و پخت را بگیر.",
    transcript:
      "You can eat healthy meals even on a budget. Planning and simple ingredients make a big difference.",
  },
  {
    key: "bbc-less-rice",
    title: "Should we eat less rice?",
    youtubeId: "3hwEplr-g5w",
    level: "B1–B2",
    topic: "food",
    hint: "استدلال‌های محیط‌زیستی را دنبال کن.",
    transcript:
      "Should we eat less rice for the planet? Farming choices affect water use and climate.",
  },
  {
    key: "bbc-coffee-story",
    title: "The story behind coffee",
    youtubeId: "Efi9tB75cZs",
    level: "B1",
    topic: "food",
    hint: "واژگان business و commodity را بگیر.",
    transcript:
      "Coffee is a hugely complicated business. It is one of the biggest commodities in the world after oil.",
  },
  // —— Tech & work ——
  {
    key: "bbc-call-centres-ai",
    title: "Call centres: Are you talking to AI?",
    youtubeId: "KB4Mn5XHdMc",
    level: "B1–B2",
    topic: "tech",
    hint: "تفاوت انسان و AI در مکالمه را گوش بده.",
    transcript:
      "When you call a company, are you talking to a person or to AI? Many services now use automated voices.",
  },
  {
    key: "bbc-tech-refuses-die",
    title: "Tech that refuses to die",
    youtubeId: "RS4MrptnnP8",
    level: "B1–B2",
    topic: "tech",
    hint: "مثال‌های تکنولوژی قدیمی را لیست کن.",
    transcript:
      "Some old technology refuses to die. People keep using tools that still feel useful and familiar.",
  },
  {
    key: "bbc-athletes-drugs",
    title: "What if athletes were allowed to take drugs?",
    youtubeId: "0XccoTXPu_c",
    level: "B2",
    topic: "sport",
    hint: "استدلال موافق و مخالف را جدا کن.",
    transcript:
      "In mainstream sport, taking performance-enhancing drugs is forbidden. Some people debate whether that should change.",
  },
  // —— Society ——
  {
    key: "bbc-happiness-country",
    title: "The country that measures happiness",
    youtubeId: "COB_5wL_xv4",
    level: "B1–B2",
    topic: "society",
    hint: "شاخص‌های happiness را بگیر.",
    transcript:
      "Some countries try to measure happiness, not only money. Wellbeing includes trust, health and community.",
  },
];

export const LISTENING_TOPICS = [
  "learning",
  "education",
  "daily life",
  "psychology",
  "science",
  "health",
  "food",
  "tech",
  "sport",
  "society",
] as const;

export type ListeningTopic = (typeof LISTENING_TOPICS)[number];
