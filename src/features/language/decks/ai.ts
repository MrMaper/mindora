import { toLessons, type VocabDeckDef } from "./types";

/** AI / ML / LLM vocabulary (original bilingual glosses). */
const WORDS = [
  // L1 — core ML
  {
    front: "dataset",
    back: "مجموعهٔ دادهٔ آموزش/ارزیابی",
    example: "Split the dataset into train and test.",
  },
  {
    front: "feature",
    back: "ویژگی؛ ورودی مدل",
    example: "Add a new feature for word length.",
  },
  {
    front: "label",
    back: "برچسب؛ خروجی مورد انتظار",
    example: "Each sample needs a correct label.",
  },
  {
    front: "model",
    back: "مدل؛ نگاشت آموخته‌شده از داده به پیش‌بینی",
    example: "Save the trained model to disk.",
  },
  {
    front: "training",
    back: "آموزش مدل روی داده",
    example: "Training took two hours on the GPU.",
  },
  {
    front: "inference",
    back: "استنتاج؛ اجرای مدل برای پیش‌بینی",
    example: "Inference should stay under 100ms.",
  },
  {
    front: "accuracy",
    back: "دقت؛ درصد پیش‌بینی درست",
    example: "Accuracy alone can mislead on imbalanced data.",
  },
  {
    front: "overfitting",
    back: "بیش‌برازش؛ حفظ طوطی‌وار دادهٔ آموزش",
    example: "Overfitting shows high train score, low test score.",
  },
  {
    front: "underfitting",
    back: "کم‌برازش؛ مدل بیش از حد ساده",
    example: "Underfitting means the model learns too little.",
  },
  {
    front: "epoch",
    back: "ایپاک؛ یک عبور کامل از دادهٔ آموزش",
    example: "Loss dropped after the third epoch.",
  },
  {
    front: "batch",
    back: "بچ؛ دستهٔ نمونه‌ها در یک گام آموزش",
    example: "Use a smaller batch if memory is tight.",
  },
  {
    front: "loss",
    back: "تابع/مقدار خطا که مدل کمینه‌اش می‌کند",
    example: "Watch the validation loss, not only train loss.",
  },
  // L2 — learning types & eval
  {
    front: "supervised learning",
    back: "یادگیری نظارت‌شده با برچسب",
    example: "Classification is a supervised learning task.",
  },
  {
    front: "unsupervised learning",
    back: "یادگیری بدون برچسب (مثل خوشه‌بندی)",
    example: "Clustering is unsupervised learning.",
  },
  {
    front: "reinforcement learning",
    back: "یادگیری تقویتی با پاداش/تنبیه",
    example: "Game agents often use reinforcement learning.",
  },
  {
    front: "baseline",
    back: "خط پایه؛ مدل ساده برای مقایسه",
    example: "Beat a strong baseline before claiming gains.",
  },
  {
    front: "benchmark",
    back: "بنچمارک؛ مجموعهٔ استاندارد ارزیابی",
    example: "Report results on a public benchmark.",
  },
  {
    front: "precision",
    back: "دقت مثبت‌ها؛ از پیش‌بینی‌های مثبت چندتا درست‌اند",
    example: "High precision means fewer false positives.",
  },
  {
    front: "recall",
    back: "فراخوانی؛ از موارد واقعی مثبت چندتا پیدا شدند",
    example: "High recall matters in medical screening.",
  },
  {
    front: "f1 score",
    back: "میانگین همساز precision و recall",
    example: "The F1 score balances precision and recall.",
  },
  {
    front: "confusion matrix",
    back: "ماتریس درهم‌ریختگیِ پیش‌بینی‌ها",
    example: "Inspect the confusion matrix by class.",
  },
  {
    front: "cross-validation",
    back: "اعتبارسنجی متقابل",
    example: "Use cross-validation for small datasets.",
  },
  {
    front: "hyperparameter",
    back: "هایپرپارامتر؛ تنظیم دستی/جستجویی نه آموخته از گرادیان",
    example: "Learning rate is a key hyperparameter.",
  },
  {
    front: "regularization",
    back: "منظم‌سازی؛ جلوگیری از پیچیدگی زیاد مدل",
    example: "Dropout is a form of regularization.",
  },
  // L3 — deep learning
  {
    front: "neural network",
    back: "شبکهٔ عصبی",
    example: "A neural network stacks learnable layers.",
  },
  {
    front: "layer",
    back: "لایهٔ شبکه",
    example: "Add a dropout layer after attention.",
  },
  {
    front: "activation",
    back: "تابع فعال‌سازی (مثل ReLU)",
    example: "ReLU is a common activation function.",
  },
  {
    front: "gradient",
    back: "گرادیان؛ شیب خطا نسبت به پارامترها",
    example: "Exploding gradients break training.",
  },
  {
    front: "backpropagation",
    back: "پس‌انتشار؛ محاسبهٔ گرادیان در شبکه",
    example: "Backpropagation updates the weights.",
  },
  {
    front: "embedding",
    back: "امبدینگ؛ بردار عددی معنا/هویت",
    example: "Word embeddings capture semantic similarity.",
  },
  {
    front: "attention",
    back: "توجه؛ وزن‌دهی به بخش‌های ورودی",
    example: "Attention helps the model focus on key tokens.",
  },
  {
    front: "transformer",
    back: "ترانسفورمر؛ معماری مبتنی بر attention",
    example: "Most LLMs are transformer models.",
  },
  {
    front: "tokenizer",
    back: "توکنایزر؛ تبدیل متن به توکن",
    example: "The tokenizer splits text into tokens.",
  },
  {
    front: "token",
    back: "توکن؛ واحد متنی مدل زبانی",
    example: "Long prompts consume more tokens.",
  },
  {
    front: "parameter",
    back: "پارامتر؛ وزن آموخته‌شدهٔ مدل",
    example: "Billion-parameter models need lots of memory.",
  },
  {
    front: "fine-tuning",
    back: "تنظیم‌ریز؛ آموزش اضافه روی مدل ازپیش‌آموزش‌دیده",
    example: "Fine-tuning adapts the model to your domain.",
  },
  // L4 — LLM & generative AI
  {
    front: "large language model",
    back: "مدل زبانی بزرگ (LLM)",
    example: "A large language model can draft emails.",
  },
  {
    front: "prompt",
    back: "پرامپت؛ ورودی متنی راهنما برای مدل",
    example: "Write a clear prompt with constraints.",
  },
  {
    front: "prompt engineering",
    back: "مهندسی پرامپت؛ طراحی ورودی مؤثر",
    example: "Prompt engineering often beats random wording.",
  },
  {
    front: "context window",
    back: "پنجرهٔ زمینه؛ حداکثر توکن قابل‌دیدن مدل",
    example: "The context window limits long documents.",
  },
  {
    front: "hallucination",
    back: "توهم مدل؛ خروجی قاطع اما نادرست",
    example: "Cite sources to reduce hallucination risk.",
  },
  {
    front: "temperature",
    back: "دما؛ کنترل تصادفی بودن نمونه‌برداری",
    example: "Lower temperature for more deterministic answers.",
  },
  {
    front: "retrieval-augmented generation",
    back: "RAG؛ تولید با بازیابی اسناد مرتبط",
    example: "RAG grounds answers in your documents.",
  },
  {
    front: "vector database",
    back: "دیتابیس برداری برای جستجوی شباهت",
    example: "Store embeddings in a vector database.",
  },
  {
    front: "agent",
    back: "ایجنت؛ سیستم تصمیم‌گیر با ابزار/حلقهٔ عمل",
    example: "The agent calls tools step by step.",
  },
  {
    front: "tool calling",
    back: "فراخوانی ابزار توسط مدل",
    example: "Tool calling lets the model query a database.",
  },
  {
    front: "multimodal",
    back: "چندوجهی؛ متن+تصویر+صدا و ...",
    example: "Multimodal models accept images and text.",
  },
  {
    front: "alignment",
    back: "هم‌راستاسازی رفتار مدل با اهداف انسانی",
    example: "Alignment research reduces harmful outputs.",
  },
  // L5 — practice & production ML
  {
    front: "data leakage",
    back: "نشت اطلاعات آزمون به آموزش",
    example: "Data leakage inflates offline metrics.",
  },
  {
    front: "feature engineering",
    back: "مهندسی ویژگی؛ ساخت ورودی‌های مفید",
    example: "Feature engineering still matters in tabular ML.",
  },
  {
    front: "transfer learning",
    back: "یادگیری انتقالی از مدل ازپیش‌آموزش‌دیده",
    example: "Transfer learning saves training time.",
  },
  {
    front: "zero-shot",
    back: "بدون نمونهٔ آموزش وظیفه؛ فقط دستور",
    example: "Try zero-shot before collecting labels.",
  },
  {
    front: "few-shot",
    back: "با چند نمونه در پرامپت/داده",
    example: "Few-shot examples improve classification.",
  },
  {
    front: "latent space",
    back: "فضای نهانِ نمایش‌های فشرده",
    example: "Similar concepts cluster in latent space.",
  },
  {
    front: "diffusion model",
    back: "مدل انتشار؛ تولید تصویر با نویززدایی تدریجی",
    example: "Many image generators are diffusion models.",
  },
  {
    front: "evaluation harness",
    back: "چارچوب ارزیابی سیستماتیک مدل",
    example: "Build an evaluation harness before shipping.",
  },
  {
    front: "guardrail",
    back: "گاردریل؛ محدودیت ایمنی/سیاست خروجی",
    example: "Add guardrails for user-facing chat.",
  },
  {
    front: "mlops",
    back: "MLOps؛ عملیات استقرار و نگهداری مدل",
    example: "MLOps covers monitoring and retraining.",
  },
  {
    front: "drift",
    back: "دریفت؛ تغییر توزیع داده در زمان",
    example: "Detect data drift in production features.",
  },
  {
    front: "ground truth",
    back: "حقیقت مبنا؛ برچسب/مرجع صحیح",
    example: "Create ground truth with expert review.",
  },
];

export const VOCAB_DECK_AI: VocabDeckDef = {
  key: "ai",
  lessonCount: 5,
  wordsPerLesson: 12,
  category: "tech",
  starter: toLessons(WORDS, 12),
};
