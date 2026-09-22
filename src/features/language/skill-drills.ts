import type { LangSkill } from "@/types/db";

export type DrillChoice = { id: string; text: string };

export type SkillDrillItem =
  | {
      id: string;
      skill: "GRAMMAR" | "READING" | "PRONUNCIATION";
      kind: "mcq";
      prompt: string;
      passage?: string;
      choices: DrillChoice[];
      answerId: string;
      explainFa?: string;
      explainEn?: string;
    }
  | {
      id: string;
      skill: "WRITING" | "SPEAKING";
      kind: "prompt";
      prompt: string;
      hintFa?: string;
      hintEn?: string;
      minWords?: number;
    };

const GRAMMAR: SkillDrillItem[] = [
  {
    id: "g1",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "She _____ to the library every Friday.",
    choices: [
      { id: "a", text: "go" },
      { id: "b", text: "goes" },
      { id: "c", text: "going" },
      { id: "d", text: "gone" },
    ],
    answerId: "b",
    explainEn: "Third-person singular present needs -s.",
    explainFa: "برای سوم‌شخص مفرد حال ساده، فعل -s می‌گیرد.",
  },
  {
    id: "g2",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "If it rains tomorrow, we _____ the picnic.",
    choices: [
      { id: "a", text: "cancel" },
      { id: "b", text: "will cancel" },
      { id: "c", text: "cancelled" },
      { id: "d", text: "cancelling" },
    ],
    answerId: "b",
    explainEn: "First conditional: If + present, will + verb.",
  },
  {
    id: "g3",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "The results _____ yesterday.",
    choices: [
      { id: "a", text: "was published" },
      { id: "b", text: "were published" },
      { id: "c", text: "published" },
      { id: "d", text: "have publish" },
    ],
    answerId: "b",
  },
  {
    id: "g4",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "I have been waiting _____ two hours.",
    choices: [
      { id: "a", text: "since" },
      { id: "b", text: "for" },
      { id: "c", text: "during" },
      { id: "d", text: "while" },
    ],
    answerId: "b",
  },
  {
    id: "g5",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "Neither the students nor the teacher _____ ready.",
    choices: [
      { id: "a", text: "are" },
      { id: "b", text: "is" },
      { id: "c", text: "be" },
      { id: "d", text: "were" },
    ],
    answerId: "b",
  },
  {
    id: "g6",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "This is the book _____ I told you about.",
    choices: [
      { id: "a", text: "who" },
      { id: "b", text: "which" },
      { id: "c", text: "whose" },
      { id: "d", text: "whom" },
    ],
    answerId: "b",
  },
  {
    id: "g7",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "He suggested _____ earlier.",
    choices: [
      { id: "a", text: "to leave" },
      { id: "b", text: "leave" },
      { id: "c", text: "leaving" },
      { id: "d", text: "left" },
    ],
    answerId: "c",
  },
  {
    id: "g8",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "By next year, she _____ her degree.",
    choices: [
      { id: "a", text: "will finish" },
      { id: "b", text: "will have finished" },
      { id: "c", text: "finishes" },
      { id: "d", text: "finished" },
    ],
    answerId: "b",
  },
  {
    id: "g9",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "There _____ little evidence to support the claim.",
    choices: [
      { id: "a", text: "is" },
      { id: "b", text: "are" },
      { id: "c", text: "were" },
      { id: "d", text: "have" },
    ],
    answerId: "a",
  },
  {
    id: "g10",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "I'd rather you _____ smoking here.",
    choices: [
      { id: "a", text: "don't" },
      { id: "b", text: "didn't" },
      { id: "c", text: "not" },
      { id: "d", text: "won't" },
    ],
    answerId: "b",
  },
  {
    id: "g11",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "The committee _____ divided on the issue.",
    choices: [
      { id: "a", text: "is" },
      { id: "b", text: "are" },
      { id: "c", text: "both a and b (depending on variety)" },
      { id: "d", text: "be" },
    ],
    answerId: "c",
  },
  {
    id: "g12",
    skill: "GRAMMAR",
    kind: "mcq",
    prompt: "She speaks English _____ than her brother.",
    choices: [
      { id: "a", text: "fluent" },
      { id: "b", text: "more fluently" },
      { id: "c", text: "most fluent" },
      { id: "d", text: "fluenter" },
    ],
    answerId: "b",
  },
];

const READING: SkillDrillItem[] = [
  {
    id: "r1",
    skill: "READING",
    kind: "mcq",
    passage:
      "Urban gardens are small plots of land in cities where residents grow vegetables and herbs. Beyond food, they create meeting places and reduce stress. City planners now include garden space in new housing projects because community gardens can lower grocery costs for low-income families.",
    prompt: "What is one social benefit of urban gardens mentioned?",
    choices: [
      { id: "a", text: "They replace all parks" },
      { id: "b", text: "They create meeting places" },
      { id: "c", text: "They increase traffic" },
      { id: "d", text: "They ban herbs" },
    ],
    answerId: "b",
  },
  {
    id: "r2",
    skill: "READING",
    kind: "mcq",
    passage:
      "Urban gardens are small plots of land in cities where residents grow vegetables and herbs. Beyond food, they create meeting places and reduce stress. City planners now include garden space in new housing projects because community gardens can lower grocery costs for low-income families.",
    prompt: "Why do planners include gardens in housing projects?",
    choices: [
      { id: "a", text: "To raise rent automatically" },
      { id: "b", text: "To lower grocery costs for families" },
      { id: "c", text: "To remove vegetables from shops" },
      { id: "d", text: "To ban community meetings" },
    ],
    answerId: "b",
  },
  {
    id: "r3",
    skill: "READING",
    kind: "mcq",
    passage:
      "Sleep researchers note that consistent bedtimes improve memory consolidation. Students who sleep after studying often recall material better than those who stay awake all night. Caffeine can delay sleep onset but does not replace deep sleep stages needed for learning.",
    prompt: "What does the passage say about all-nighters?",
    choices: [
      { id: "a", text: "They always beat sleep for recall" },
      { id: "b", text: "Sleep after study often helps recall more" },
      { id: "c", text: "Caffeine replaces deep sleep" },
      { id: "d", text: "Bedtimes do not matter" },
    ],
    answerId: "b",
  },
  {
    id: "r4",
    skill: "READING",
    kind: "mcq",
    passage:
      "Sleep researchers note that consistent bedtimes improve memory consolidation. Students who sleep after studying often recall material better than those who stay awake all night. Caffeine can delay sleep onset but does not replace deep sleep stages needed for learning.",
    prompt: "According to the text, caffeine…",
    choices: [
      { id: "a", text: "replaces deep sleep" },
      { id: "b", text: "may delay falling asleep" },
      { id: "c", text: "improves consolidation alone" },
      { id: "d", text: "is required for memory" },
    ],
    answerId: "b",
  },
  {
    id: "r5",
    skill: "READING",
    kind: "mcq",
    passage:
      "Open-source software lets anyone inspect and modify the source code. Companies adopt it to reduce licensing fees and to invite outside contributions. However, they must still budget for maintenance, security reviews, and documentation.",
    prompt: "What cost may still remain with open source?",
    choices: [
      { id: "a", text: "License fees only" },
      { id: "b", text: "Maintenance and security reviews" },
      { id: "c", text: "Forbidden documentation" },
      { id: "d", text: "No outside contributions" },
    ],
    answerId: "b",
  },
  {
    id: "r6",
    skill: "READING",
    kind: "mcq",
    passage:
      "Open-source software lets anyone inspect and modify the source code. Companies adopt it to reduce licensing fees and to invite outside contributions. However, they must still budget for maintenance, security reviews, and documentation.",
    prompt: "A main reason companies adopt open source is to…",
    choices: [
      { id: "a", text: "increase licensing fees" },
      { id: "b", text: "hide the source code" },
      { id: "c", text: "reduce licensing fees" },
      { id: "d", text: "ban contributions" },
    ],
    answerId: "c",
  },
];

const WRITING: SkillDrillItem[] = [
  {
    id: "w1",
    skill: "WRITING",
    kind: "prompt",
    prompt:
      "Describe a daily routine that helps you study. Write at least 80 words.",
    minWords: 80,
    hintEn: "Use sequence words: first, then, finally.",
    hintFa: "از کلمات ترتیبی استفاده کن: first, then, finally.",
  },
  {
    id: "w2",
    skill: "WRITING",
    kind: "prompt",
    prompt:
      "Compare online classes and in-person classes. Give two advantages for each. (~100 words)",
    minWords: 90,
  },
  {
    id: "w3",
    skill: "WRITING",
    kind: "prompt",
    prompt:
      "Write a short email to a professor asking for a deadline extension. Be polite and clear.",
    minWords: 60,
  },
  {
    id: "w4",
    skill: "WRITING",
    kind: "prompt",
    prompt:
      "Explain one research problem in your field in simple English for a non-expert reader.",
    minWords: 100,
  },
  {
    id: "w5",
    skill: "WRITING",
    kind: "prompt",
    prompt:
      "Argue for or against using phones during study sessions. Support with two reasons.",
    minWords: 90,
  },
];

const SPEAKING: SkillDrillItem[] = [
  {
    id: "s1",
    skill: "SPEAKING",
    kind: "prompt",
    prompt: "Talk for 1–2 minutes about a book or paper that influenced you.",
    hintEn: "Say title, main idea, and why it mattered.",
    hintFa: "عنوان، ایدهٔ اصلی و دلیل اهمیت را بگو.",
  },
  {
    id: "s2",
    skill: "SPEAKING",
    kind: "prompt",
    prompt: "Describe your ideal study space and why it works for you.",
  },
  {
    id: "s3",
    skill: "SPEAKING",
    kind: "prompt",
    prompt: "Explain a difficult concept from your PhD/work to a beginner.",
  },
  {
    id: "s4",
    skill: "SPEAKING",
    kind: "prompt",
    prompt: "Give a 60-second self-introduction for an academic interview.",
  },
  {
    id: "s5",
    skill: "SPEAKING",
    kind: "prompt",
    prompt: "Discuss one habit you want to improve this month and your plan.",
  },
];

const PRONUNCIATION: SkillDrillItem[] = [
  {
    id: "p1",
    skill: "PRONUNCIATION",
    kind: "mcq",
    prompt: "Which word has the stress on the FIRST syllable?",
    choices: [
      { id: "a", text: "phoTOgraphy" },
      { id: "b", text: "PHOtograph" },
      { id: "c", text: "photoGRAPHic" },
      { id: "d", text: "photoGRAPHer" },
    ],
    answerId: "b",
  },
  {
    id: "p2",
    skill: "PRONUNCIATION",
    kind: "mcq",
    prompt: "The -ed ending in 'wanted' sounds like…",
    choices: [
      { id: "a", text: "/t/" },
      { id: "b", text: "/d/" },
      { id: "c", text: "/ɪd/" },
      { id: "d", text: "silent" },
    ],
    answerId: "c",
  },
  {
    id: "p3",
    skill: "PRONUNCIATION",
    kind: "mcq",
    prompt: "Which pair are homophones (same sound)?",
    choices: [
      { id: "a", text: "read (present) / red" },
      { id: "b", text: "flour / flower" },
      { id: "c", text: "ship / sheep" },
      { id: "d", text: "live / leave" },
    ],
    answerId: "b",
  },
  {
    id: "p4",
    skill: "PRONUNCIATION",
    kind: "mcq",
    prompt: "In 'comfortable', how many spoken syllables are common in careful speech?",
    choices: [
      { id: "a", text: "2" },
      { id: "b", text: "3" },
      { id: "c", text: "5" },
      { id: "d", text: "6" },
    ],
    answerId: "b",
  },
];

const BY_SKILL: Partial<Record<LangSkill, SkillDrillItem[]>> = {
  GRAMMAR,
  READING,
  WRITING,
  SPEAKING,
  PRONUNCIATION,
};

export function skillHasDrill(skill: LangSkill): boolean {
  return (BY_SKILL[skill]?.length ?? 0) > 0;
}

export function pickSkillDrills(
  skill: LangSkill,
  count = 8,
): SkillDrillItem[] {
  const pool = [...(BY_SKILL[skill] ?? [])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
