import type { LangSkill } from "@/types/db";

export type ExamKindKey =
  | "MSRT"
  | "IELTS"
  | "TOEFL"
  | "TOLIMO"
  | "EPT"
  | "CUSTOM";

export interface ExamSectionTemplate {
  key: string;
  skill: LangSkill;
  labelFa: string;
  labelEn: string;
  questionCount: number;
  timeMin: number;
}

export interface ExamKindTemplate {
  kind: ExamKindKey;
  nameFa: string;
  nameEn: string;
  /** Typical pass / target hint */
  defaultTarget: string;
  maxScore: number;
  sections: ExamSectionTemplate[];
}

/** MSRT-style academic English (Listening + Grammar + Reading ≈ 100 Q). */
export const MSRT_TEMPLATE: ExamKindTemplate = {
  kind: "MSRT",
  nameFa: "MSRT",
  nameEn: "MSRT",
  defaultTarget: "50",
  maxScore: 100,
  sections: [
    {
      key: "listening",
      skill: "LISTENING",
      labelFa: "شنیداری",
      labelEn: "Listening",
      questionCount: 30,
      timeMin: 25,
    },
    {
      key: "grammar",
      skill: "GRAMMAR",
      labelFa: "گرامر / ساختار",
      labelEn: "Grammar / Structure",
      questionCount: 30,
      timeMin: 20,
    },
    {
      key: "reading",
      skill: "READING",
      labelFa: "خواندن",
      labelEn: "Reading",
      questionCount: 40,
      timeMin: 40,
    },
  ],
};

export const IELTS_TEMPLATE: ExamKindTemplate = {
  kind: "IELTS",
  nameFa: "IELTS Academic",
  nameEn: "IELTS Academic",
  defaultTarget: "6.5",
  maxScore: 9,
  sections: [
    {
      key: "listening",
      skill: "LISTENING",
      labelFa: "Listening",
      labelEn: "Listening",
      questionCount: 40,
      timeMin: 30,
    },
    {
      key: "reading",
      skill: "READING",
      labelFa: "Reading",
      labelEn: "Reading",
      questionCount: 40,
      timeMin: 60,
    },
    {
      key: "writing",
      skill: "WRITING",
      labelFa: "Writing",
      labelEn: "Writing",
      questionCount: 2,
      timeMin: 60,
    },
    {
      key: "speaking",
      skill: "SPEAKING",
      labelFa: "Speaking",
      labelEn: "Speaking",
      questionCount: 1,
      timeMin: 15,
    },
  ],
};

export const TOEFL_TEMPLATE: ExamKindTemplate = {
  kind: "TOEFL",
  nameFa: "TOEFL iBT",
  nameEn: "TOEFL iBT",
  defaultTarget: "90",
  maxScore: 120,
  sections: [
    {
      key: "reading",
      skill: "READING",
      labelFa: "Reading",
      labelEn: "Reading",
      questionCount: 20,
      timeMin: 35,
    },
    {
      key: "listening",
      skill: "LISTENING",
      labelFa: "Listening",
      labelEn: "Listening",
      questionCount: 28,
      timeMin: 36,
    },
    {
      key: "speaking",
      skill: "SPEAKING",
      labelFa: "Speaking",
      labelEn: "Speaking",
      questionCount: 4,
      timeMin: 17,
    },
    {
      key: "writing",
      skill: "WRITING",
      labelFa: "Writing",
      labelEn: "Writing",
      questionCount: 2,
      timeMin: 30,
    },
  ],
};

export const EXAM_TEMPLATES: Record<ExamKindKey, ExamKindTemplate> = {
  MSRT: MSRT_TEMPLATE,
  IELTS: IELTS_TEMPLATE,
  TOEFL: TOEFL_TEMPLATE,
  TOLIMO: {
    ...MSRT_TEMPLATE,
    kind: "TOLIMO",
    nameFa: "TOLIMO",
    nameEn: "TOLIMO",
  },
  EPT: {
    ...MSRT_TEMPLATE,
    kind: "EPT",
    nameFa: "EPT",
    nameEn: "EPT",
  },
  CUSTOM: {
    kind: "CUSTOM",
    nameFa: "آزمون سفارشی",
    nameEn: "Custom exam",
    defaultTarget: "50",
    maxScore: 100,
    sections: [
      {
        key: "section1",
        skill: "READING",
        labelFa: "بخش ۱",
        labelEn: "Section 1",
        questionCount: 25,
        timeMin: 30,
      },
    ],
  },
};

export function getExamTemplate(kind: string): ExamKindTemplate {
  if (kind in EXAM_TEMPLATES) {
    return EXAM_TEMPLATES[kind as ExamKindKey];
  }
  return MSRT_TEMPLATE;
}

export interface MockSectionResult {
  key: string;
  skill: LangSkill;
  labelFa: string;
  labelEn: string;
  questionCount: number;
  correct: number;
  timeSec: number;
  timeLimitMin: number;
}

export function scoreMockSections(sections: MockSectionResult[]): {
  totalCorrect: number;
  totalQuestions: number;
  /** Self-reported correct/total percentage — not an official exam band. */
  percent: number;
  weakestSkill: LangSkill | null;
} {
  let totalCorrect = 0;
  let totalQuestions = 0;
  let worst: { skill: LangSkill; rate: number } | null = null;

  for (const s of sections) {
    const q = Math.max(0, s.questionCount);
    const c = Math.min(Math.max(0, s.correct), q);
    totalCorrect += c;
    totalQuestions += q;
    if (q > 0) {
      const rate = c / q;
      if (!worst || rate < worst.rate) worst = { skill: s.skill, rate };
    }
  }

  const percent =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 1000) / 10
      : 0;

  return {
    totalCorrect,
    totalQuestions,
    percent,
    weakestSkill: worst?.skill ?? null,
  };
}
