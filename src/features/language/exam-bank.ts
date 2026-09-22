import type { ExamKindKey } from "./exam-templates";
import type { LangSkill } from "@/types/db";

export type ExamBankChoice = { id: string; text: string };

export type ExamBankItem =
  | {
      id: string;
      kind: "mcq";
      skill: LangSkill;
      sectionKey: string;
      prompt: string;
      passage?: string;
      choices: ExamBankChoice[];
      answerId: string;
    }
  | {
      id: string;
      kind: "prompt";
      skill: LangSkill;
      sectionKey: string;
      prompt: string;
      minWords?: number;
    };

function g(
  id: string,
  prompt: string,
  choices: [string, string, string, string],
  answer: 0 | 1 | 2 | 3,
  sectionKey = "grammar",
): ExamBankItem {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    id,
    kind: "mcq",
    skill: "GRAMMAR",
    sectionKey,
    prompt,
    choices: choices.map((text, i) => ({ id: ids[i]!, text })),
    answerId: ids[answer]!,
  };
}

function r(
  id: string,
  passage: string,
  prompt: string,
  choices: [string, string, string, string],
  answer: 0 | 1 | 2 | 3,
  sectionKey = "reading",
): ExamBankItem {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    id,
    kind: "mcq",
    skill: "READING",
    sectionKey,
    passage,
    prompt,
    choices: choices.map((text, i) => ({ id: ids[i]!, text })),
    answerId: ids[answer]!,
  };
}

function l(
  id: string,
  dialogue: string,
  prompt: string,
  choices: [string, string, string, string],
  answer: 0 | 1 | 2 | 3,
): ExamBankItem {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    id,
    kind: "mcq",
    skill: "LISTENING",
    sectionKey: "listening",
    passage: dialogue,
    prompt,
    choices: choices.map((text, i) => ({ id: ids[i]!, text })),
    answerId: ids[answer]!,
  };
}

const P1 =
  "Many universities require graduate students to present work at conferences. Presenting builds clarity and invites critique. Funding is limited, so students often share travel costs or choose online events.";

const P2 =
  "A checklist before submitting a paper: confirm citation style, check figure resolution, and ask a colleague to read the abstract. Small errors delay review more often than weak ideas alone.";

const D1 =
  "A: Did you finish the lab report?\nB: Almost. I still need the last chart.\nA: The printer downstairs is free until noon.\nB: Thanks — I'll print it there.";

const D2 =
  "A: Why was the seminar moved?\nB: The speaker's flight was delayed.\nA: Will it be tomorrow morning?\nB: Yes, same room, at nine.";

/** Original practice items — not official exam content. */
const MSRT_BANK: ExamBankItem[] = [
  g("mg1", "The data _____ inconsistent with the hypothesis.", ["is", "are", "be", "were"], 0),
  g("mg2", "Neither proposal _____ acceptable.", ["seem", "seems", "seeming", "have seemed"], 1),
  g("mg3", "She has lived here _____ 2019.", ["for", "during", "since", "while"], 2),
  g("mg4", "If he _____ harder, he would have passed.", ["studied", "had studied", "studies", "was studying"], 1),
  g("mg5", "The article was written _____ a team of linguists.", ["from", "by", "of", "with"], 1),
  g("mg6", "I look forward to _____ from you.", ["hear", "hearing", "heard", "hears"], 1),
  g("mg7", "There is _____ water left in the bottle.", ["few", "many", "little", "several"], 2),
  g("mg8", "He asked me where _____.", ["was the lab", "the lab was", "is the lab", "the lab is being"], 1),
  g("mg9", "Not only the methods but also the sample _____ flawed.", ["was", "were", "are", "have"], 0),
  g("mg10", "She prefers tea _____ coffee.", ["than", "to", "from", "over than"], 1),
  g("mg11", "The experiment _____ carefully designed.", ["have been", "has been", "were", "being"], 1),
  g("mg12", "_____ rare for the device to fail twice.", ["It is", "There is", "They are", "This are"], 0),
  g("mg13", "We postponed _____ the survey.", ["to launch", "launch", "launching", "launched"], 2),
  g("mg14", "The more you practice, _____ you become.", ["fluent", "the more fluent", "more fluently", "most fluent"], 1),
  g("mg15", "I wish I _____ more time yesterday.", ["have", "had", "had had", "have had"], 2),
  g("mg16", "Each of the samples _____ labeled.", ["were", "was", "are", "have been"], 1),
  g("mg17", "He is used to _____ early.", ["get up", "getting up", "got up", "gets up"], 1),
  g("mg18", "The paper will be revised _____ next week.", ["in", "on", "by", "at"], 2),
  g("mg19", "No sooner had she arrived _____ the meeting started.", ["when", "than", "that", "then"], 1),
  g("mg20", "This method is _____ than the previous one.", ["efficient", "more efficient", "most efficient", "efficienter"], 1),
  g("mg21", "Please let me _____ if you need help.", ["to know", "know", "knowing", "known"], 1),
  g("mg22", "The findings _____ published last month.", ["was", "were", "is", "been"], 1),
  g("mg23", "She speaks as if she _____ an expert.", ["is", "were", "was being", "be"], 1),
  g("mg24", "Hardly _____ the door when it started to rain.", ["he closed", "had he closed", "he had close", "closed he"], 1),
  g("mg25", "There _____ to be a mistake in Table 2.", ["seem", "seems", "seeming", "have seem"], 1),
  g("mg26", "I would rather you _____ me first.", ["call", "called", "calling", "to call"], 1),
  g("mg27", "The committee agreed _____ the proposal.", ["on", "in", "at", "to on"], 0),
  g("mg28", "_____ of the two options is safer.", ["Most", "Much", "Either", "Every"], 2),
  g("mg29", "She denied _____ the file.", ["to delete", "deleting", "delete", "deleted"], 1),
  g("mg30", "The software is capable _____ large datasets.", ["to handle", "of handling", "for handle", "in handling"], 1),

  r("mr1", P1, "What do conferences help students build?", ["Funding only", "Clarity and critique", "Travel bans", "Online fees"], 1),
  r("mr2", P1, "Why might students choose online events?", ["Unlimited funding", "Travel costs / limited funding", "No critique", "Mandatory travel"], 1),
  r("mr3", P1, "According to the text, presenting…", ["is forbidden", "invites critique", "removes clarity", "guarantees funding"], 1),
  r("mr4", P2, "Which is listed as a pre-submission check?", ["Ignore citations", "Check figure resolution", "Delete the abstract", "Skip peer reading"], 1),
  r("mr5", P2, "What often delays review more than weak ideas?", ["Small errors", "Strong methods", "Short titles", "Open access"], 0),
  r("mr6", P2, "Asking a colleague to read the abstract is…", ["discouraged", "suggested", "illegal", "optional only for figures"], 1),
  r("mr7", P1, "Graduate students often _____ travel costs.", ["share", "ban", "ignore", "tax"], 0),
  r("mr8", P2, "Citation style should be…", ["skipped", "confirmed", "randomized", "hidden"], 1),
  r("mr9", P1, "Online events are mentioned as…", ["impossible", "an alternative when funding is tight", "the only option", "banned"], 1),
  r("mr10", P2, "The checklist aims to…", ["delay review", "reduce avoidable errors before submit", "remove colleagues", "cut figure quality"], 1),

  l("ml1", D1, "What does B still need?", ["A printer", "The last chart", "A new lab", "Noon break"], 1),
  l("ml2", D1, "Where can B print?", ["Upstairs only", "Downstairs until noon", "Never", "At home only"], 1),
  l("ml3", D1, "Has B finished the report?", ["Completely", "Almost", "Not started", "Deleted it"], 1),
  l("ml4", D2, "Why was the seminar moved?", ["Room closed", "Speaker's flight delayed", "Holiday", "No speaker"], 1),
  l("ml5", D2, "When is the rescheduled seminar?", ["Tonight", "Tomorrow at nine", "Next month", "Cancelled"], 1),
  l("ml6", D2, "Will the room change?", ["Yes, new building", "No, same room", "Online only", "Unknown"], 1),
  l("ml7", D1, "A's tip is about…", ["A free printer window", "Buying ink", "Deleting charts", "Skipping the report"], 0),
  l("ml8", D2, "The original problem was…", ["Printer jam", "Flight delay", "Wrong room forever", "Missing slides"], 1),
];

const IELTS_BANK: ExamBankItem[] = [
  ...MSRT_BANK.filter(i => i.sectionKey === "listening").map((i, idx) => ({
    ...i,
    id: `il${idx + 1}`,
  })),
  ...MSRT_BANK.filter(i => i.sectionKey === "reading").map((i, idx) => ({
    ...i,
    id: `ir${idx + 1}`,
  })),
  {
    id: "iw1",
    kind: "prompt",
    skill: "WRITING",
    sectionKey: "writing",
    prompt:
      "Task 1 style: Summarize the idea that city gardens reduce grocery costs. Write at least 120 words.",
    minWords: 120,
  },
  {
    id: "iw2",
    kind: "prompt",
    skill: "WRITING",
    sectionKey: "writing",
    prompt:
      "Task 2 style: Some people prefer online conferences. Discuss advantages and disadvantages (~150 words).",
    minWords: 150,
  },
  {
    id: "is1",
    kind: "prompt",
    skill: "SPEAKING",
    sectionKey: "speaking",
    prompt: "Part 2 style: Describe a skill you learned recently. Include how and why.",
  },
  {
    id: "is2",
    kind: "prompt",
    skill: "SPEAKING",
    sectionKey: "speaking",
    prompt: "Part 3 style: How will technology change academic presentations in the next decade?",
  },
];

const BANK_BY_KIND: Record<ExamKindKey, ExamBankItem[]> = {
  MSRT: MSRT_BANK,
  TOLIMO: MSRT_BANK,
  EPT: MSRT_BANK,
  IELTS: IELTS_BANK,
  TOEFL: IELTS_BANK,
  CUSTOM: MSRT_BANK.filter(i => i.sectionKey === "reading"),
};

export function pickExamSectionItems(
  examKind: string,
  sectionKey: string,
  count: number,
): ExamBankItem[] {
  const kind = (examKind in BANK_BY_KIND ? examKind : "MSRT") as ExamKindKey;
  const pool = BANK_BY_KIND[kind].filter(i => i.sectionKey === sectionKey);
  const list = [...pool];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  if (list.length === 0) return [];
  // Cycle if bank smaller than requested
  const out: ExamBankItem[] = [];
  for (let i = 0; i < count; i++) {
    out.push(list[i % list.length]!);
  }
  return out;
}

export function examSectionHasBank(
  examKind: string,
  sectionKey: string,
): boolean {
  const kind = (examKind in BANK_BY_KIND ? examKind : "MSRT") as ExamKindKey;
  return BANK_BY_KIND[kind].some(i => i.sectionKey === sectionKey);
}
