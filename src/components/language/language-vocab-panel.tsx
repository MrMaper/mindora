"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import {
  createLangCardAction,
  deleteLangCardAction,
  installVocabDeckAction,
  listDeckCardsAction,
  listDueCardsAction,
  reviewLangCardAction,
} from "@/features/language/actions";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import {
  gradeToRating,
  gradeTypedAnswer,
  type TypedGrade,
} from "@/features/language/answer-match";
import type {
  LangCardItem,
  LangVocabStats,
  VocabDeckProgress,
  VocabRating,
} from "@/features/language/types";
import {
  applyRequeueHint,
  previewRatingLabel,
  REVIEW_QUEUE_TAKE,
  sortDueForReview,
  type RequeueHint,
} from "@/features/language/srs";
import { SpeakButton } from "@/components/language/speak-button";
import { speakWord } from "@/features/language/speak";
import { cn, formatNumber } from "@/lib/utils";
import { CheckIcon, LockIcon } from "lucide-react";
import type { VocabLessonProgress } from "@/features/language/types";

function isLessonStudied(
  lesson: VocabLessonProgress,
  localDoneLessons: Set<number>,
): boolean {
  if (localDoneLessons.has(lesson.lesson)) return true;
  return lesson.total > 0 && lesson.fresh === 0;
}

/** Highest lesson number the user may open (sequential unlock). */
function maxUnlockedLesson(
  lessons: VocabLessonProgress[],
  localDoneLessons: Set<number>,
): number {
  const withCards = lessons
    .filter(l => l.total > 0)
    .sort((a, b) => a.lesson - b.lesson);
  if (withCards.length === 0) return 1;
  let unlocked = withCards[0]!.lesson;
  for (const l of withCards) {
    unlocked = l.lesson;
    if (!isLessonStudied(l, localDoneLessons)) break;
  }
  return unlocked;
}

function nextPlayableLesson(
  lessons: VocabLessonProgress[],
  current: number,
  localDoneLessons: Set<number>,
): number | null {
  const withCards = lessons
    .filter(l => l.total > 0)
    .sort((a, b) => a.lesson - b.lesson);
  const cur = withCards.find(l => l.lesson === current);
  if (!cur || !isLessonStudied(cur, localDoneLessons)) return null;
  const next = withCards.find(l => l.lesson > current);
  return next?.lesson ?? null;
}

type VocabMode = "study" | "review" | "library" | "stats";
type StudyStyle = "cards" | "list" | "type";
type RecallDirection = "en-fa" | "fa-en";
type DirectionMode = RecallDirection | "mixed";

function resolveDirection(
  mode: DirectionMode,
  cardId: string,
): RecallDirection {
  if (mode !== "mixed") return mode;
  let h = 2166136261;
  for (let i = 0; i < cardId.length; i++) {
    h ^= cardId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h % 2 === 0 ? "en-fa" : "fa-en";
}

function sides(card: LangCardItem, dir: RecallDirection) {
  if (dir === "fa-en") {
    return { prompt: card.back, answer: card.front, speakOnPrompt: false };
  }
  return { prompt: card.front, answer: card.back, speakOnPrompt: true };
}

function deckMeta(
  key: string,
  t: ReturnType<typeof useTranslation>["language"],
): { title: string; hint: string; short: string } {
  switch (key) {
    case "levels":
      return {
        title: t.deckLevelsTitle,
        hint: t.deckLevelsHint,
        short: t.filterLevels,
      };
    case "academic":
      return {
        title: t.deckAcademicTitle,
        hint: t.deckAcademicHint,
        short: t.filterAcademic,
      };
    case "business":
      return {
        title: t.deckBusinessTitle,
        hint: t.deckBusinessHint,
        short: t.filterBusiness,
      };
    case "science":
      return {
        title: t.deckScienceTitle,
        hint: t.deckScienceHint,
        short: t.filterScience,
      };
    case "daily":
      return {
        title: t.deckDailyTitle,
        hint: t.deckDailyHint,
        short: t.filterDaily,
      };
    case "cs":
      return {
        title: t.deckCsTitle,
        hint: t.deckCsHint,
        short: t.filterCs,
      };
    case "ai":
      return {
        title: t.deckAiTitle,
        hint: t.deckAiHint,
        short: t.filterAi,
      };
    case "health":
      return {
        title: t.deckHealthTitle,
        hint: t.deckHealthHint,
        short: t.filterHealth,
      };
    case "law":
      return {
        title: t.deckLawTitle,
        hint: t.deckLawHint,
        short: t.filterLaw,
      };
    case "media":
      return {
        title: t.deckMediaTitle,
        hint: t.deckMediaHint,
        short: t.filterMedia,
      };
    case "psychology":
      return {
        title: t.deckPsychologyTitle,
        hint: t.deckPsychologyHint,
        short: t.filterPsychology,
      };
    case "phrasal":
      return {
        title: t.deckPhrasalTitle,
        hint: t.deckPhrasalHint,
        short: t.filterPhrasal,
      };
    case "environment":
      return {
        title: t.deckEnvironmentTitle,
        hint: t.deckEnvironmentHint,
        short: t.filterEnvironment,
      };
    case "504":
      return {
        title: t.deck504Title,
        hint: t.deck504Hint,
        short: t.filter504,
      };
    default:
      return { title: key, hint: "", short: key };
  }
}

function mapCards(raw: unknown): LangCardItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(c => {
    const row = c as LangCardItem & {
      nextReviewAt: string | Date;
      lastReviewedAt: string | Date | null;
      lapses?: number;
      learningStep?: number | null;
      box: number;
    };
    return {
      ...row,
      lapses: row.lapses ?? 0,
      learningStep:
        row.learningStep === undefined
          ? row.box > 0
            ? null
            : 0
          : row.learningStep,
      nextReviewAt: new Date(row.nextReviewAt),
      lastReviewedAt: row.lastReviewedAt
        ? new Date(row.lastReviewedAt)
        : null,
    };
  });
}

export function LanguageVocabPanel({
  dueCards,
  recentCards,
  hardCards,
  stats,
  decks,
  projectId,
  initialReviewFilter = "all",
}: {
  dueCards: LangCardItem[];
  recentCards: LangCardItem[];
  hardCards: LangCardItem[];
  stats: LangVocabStats;
  decks: VocabDeckProgress[];
  projectId?: string | null;
  initialReviewFilter?: "all" | "hard";
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();

  const installedDecks = decks.filter(d => d.installed > 0);
  const defaultDeck =
    installedDecks[0]?.key ?? decks[0]?.key ?? "levels";

  const [mode, setMode] = React.useState<VocabMode>(
    initialReviewFilter === "hard" ? "review" : "study",
  );
  const [studyStyle, setStudyStyle] = React.useState<StudyStyle>("cards");
  const [direction, setDirection] = React.useState<DirectionMode>("en-fa");
  const [reviewFilter, setReviewFilter] = React.useState<"all" | "hard">(
    initialReviewFilter,
  );
  const [deckKey, setDeckKey] = React.useState(defaultDeck);
  const [lesson, setLesson] = React.useState(1);
  const [bank, setBank] = React.useState<LangCardItem[]>([]);
  const [bankLoading, setBankLoading] = React.useState(false);

  const [reviewQueue, setReviewQueue] = React.useState<LangCardItem[]>(() => {
    if (initialReviewFilter === "hard") {
      return hardCards.slice(0, REVIEW_QUEUE_TAKE);
    }
    return sortDueForReview(dueCards).slice(0, REVIEW_QUEUE_TAKE);
  });
  const [studyQueue, setStudyQueue] = React.useState<LangCardItem[]>([]);
  const [revealed, setRevealed] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const answeredThisSessionRef = React.useRef<Set<string>>(new Set());
  const [message, setMessage] = React.useState<string | null>(null);
  const [newFront, setNewFront] = React.useState("");
  const [newBack, setNewBack] = React.useState("");
  const [newExample, setNewExample] = React.useState("");
  const [newTags, setNewTags] = React.useState("");
  const [sessionDone, setSessionDone] = React.useState(0);
  const [autoSpeak, setAutoSpeak] = React.useState(true);
  /** Lessons finished this session (deckKey → lesson numbers). */
  const [sessionDoneLessons, setSessionDoneLessons] = React.useState<
    Record<string, number[]>
  >({});
  const seededReviewRef = React.useRef(false);

  const reviewCard = reviewQueue[0] ?? null;
  const studyCard = studyQueue[0] ?? null;

  React.useEffect(() => {
    if (mode !== "review") {
      seededReviewRef.current = false;
      answeredThisSessionRef.current = new Set();
      return;
    }
    if (seededReviewRef.current) return;
    seededReviewRef.current = true;
    answeredThisSessionRef.current = new Set();
    if (reviewFilter === "hard") {
      setReviewQueue(hardCards.slice(0, REVIEW_QUEUE_TAKE));
      setRevealed(false);
      return;
    }
    setReviewQueue(sortDueForReview(dueCards).slice(0, REVIEW_QUEUE_TAKE));
    setRevealed(false);
  }, [mode, dueCards, hardCards, reviewFilter]);

  async function loadReviewQueue(filter: "all" | "hard") {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setMessage(null);
    const result = await listDueCardsAction({
      take: REVIEW_QUEUE_TAKE,
      filter,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    pendingRef.current = false;
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
      return;
    }
    const answered = answeredThisSessionRef.current;
    const cards = sortDueForReview(
      mapCards(result.data?.cards).filter(c => {
        if (!answered.has(c.id)) return true;
        // Learning cards may become due again same session after a short delay.
        return c.learningStep != null;
      }),
    );
    if (cards.length === 0) {
      setMessage(
        filter === "hard"
          ? t.language.vocabHardQueueEmpty
          : t.language.vocabNoMoreDue,
      );
      setReviewQueue([]);
      return;
    }
    setReviewQueue(cards);
    setRevealed(false);
    seededReviewRef.current = true;
  }

  function startHardReview() {
    setReviewFilter("hard");
    setMode("review");
    seededReviewRef.current = false;
    answeredThisSessionRef.current = new Set();
    void loadReviewQueue("hard");
  }

  function advanceQueue(
    kind: "review" | "study",
    card: LangCardItem,
    hint: RequeueHint,
  ) {
    if (kind === "review") {
      setReviewQueue(q => applyRequeueHint(q, card, hint));
    } else {
      setStudyQueue(q => applyRequeueHint(q, card, hint));
    }
  }

  async function rateCard(
    kind: "review" | "study",
    card: LangCardItem,
    rating: VocabRating,
    opts?: { dismissFromSession?: boolean; requeueAs?: RequeueHint },
  ) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    const result = await reviewLangCardAction({
      cardId: card.id,
      rating,
    });
    pendingRef.current = false;
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
      return;
    }
    // Study first-pass dismisses from this lesson queue even when SRS would
    // requeue for short-term learning (that belongs in Review).
    const serverHint =
      (result.data?.requeueInSession as RequeueHint | undefined) ?? "none";
    const hint: RequeueHint = opts?.dismissFromSession
      ? "none"
      : (opts?.requeueAs ?? serverHint);

    const updated: LangCardItem = {
      ...card,
      reviewCount: card.reviewCount + 1,
      lastReviewedAt: new Date(),
      learningStep:
        (result.data?.learningStep as number | null | undefined) ??
        card.learningStep,
      box: Number(result.data?.box ?? card.box),
      nextReviewAt:
        result.data?.nextReviewAt != null
          ? new Date(String(result.data.nextReviewAt))
          : card.nextReviewAt,
    };

    // Block review refill races for graduated cards only — never block
    // learning cards (or study intros) from coming back when due.
    if (kind === "review" && serverHint === "none" && updated.learningStep == null) {
      answeredThisSessionRef.current.add(card.id);
    }
    advanceQueue(kind, updated, hint);
    setSessionDone(n => n + 1);
    setRevealed(false);
    if (kind === "study") {
      setBank(prev => prev.map(c => (c.id === card.id ? updated : c)));
    }
  }

  async function refillReviewQueue() {
    await loadReviewQueue(reviewFilter);
  }

  React.useEffect(() => {
    let cancelled = false;
    // Drop previous lesson bank immediately so completion can't leak across lessons.
    setBankLoading(true);
    setBank([]);
    setStudyQueue([]);
    setSessionDone(0);
    setRevealed(false);
    void listDeckCardsAction({
      deckKey,
      lesson,
      ...(projectId !== undefined ? { projectId } : {}),
    }).then(result => {
      if (cancelled) return;
      setBankLoading(false);
      if (!result.success) {
        setBank([]);
        setStudyQueue([]);
        return;
      }
      const cards = mapCards(result.data?.cards);
      setBank(cards);
      // Study = first-pass intros only. Learning reps belong in Review.
      const fresh = cards.filter(c => c.reviewCount === 0);
      setStudyQueue(fresh);
      setExpandedIds(new Set());
      answeredThisSessionRef.current = new Set();
    });
    return () => {
      cancelled = true;
    };
  }, [deckKey, lesson, projectId]);

  const onRateReviewRef = React.useRef<(rating: VocabRating) => void>(
    () => undefined,
  );

  async function onInstall(key: string) {
    setPending(true);
    setMessage(null);
    const result = await installVocabDeckAction({
      deckKey: key,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (result.success) {
      const added = Number(result.data?.added ?? 0);
      setMessage(
        added > 0
          ? t.language.deckInstalled.replace(
              "{n}",
              formatNumber(added, language),
            )
          : t.language.deckAlreadyInstalled,
      );
      setDeckKey(key);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onAddCard() {
    if (!newFront.trim() || !newBack.trim()) return;
    setPending(true);
    setMessage(null);
    const result = await createLangCardAction({
      front: newFront.trim(),
      back: newBack.trim(),
      example: newExample.trim() || undefined,
      tags: newTags.trim() || undefined,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (result.success) {
      setNewFront("");
      setNewBack("");
      setNewExample("");
      setNewTags("");
      setMessage(t.language.cardAdded);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onDeleteCard(id: string) {
    if (!window.confirm(t.language.deleteCardConfirm)) return;
    setPending(true);
    const result = await deleteLangCardAction(id);
    setPending(false);
    if (result.success) {
      setReviewQueue(q => q.filter(c => c.id !== id));
      setStudyQueue(q => q.filter(c => c.id !== id));
      setBank(b => b.filter(c => c.id !== id));
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onInstallAll() {
    setPending(true);
    setMessage(null);
    let total = 0;
    for (const deck of decks) {
      const result = await installVocabDeckAction({
        deckKey: deck.key,
        ...(projectId !== undefined ? { projectId } : {}),
      });
      if (result.success) total += Number(result.data?.added ?? 0);
    }
    setPending(false);
    setMessage(
      t.language.deckInstalled.replace("{n}", formatNumber(total, language)),
    );
    router.refresh();
  }

  async function onRateReview(rating: VocabRating) {
    if (!reviewCard) return;
    await rateCard("review", reviewCard, rating);
  }
  onRateReviewRef.current = rating => {
    void onRateReview(rating);
  };

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pendingRef.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const current =
        mode === "review"
          ? reviewCard
          : mode === "study" &&
              (studyStyle === "cards" || studyStyle === "type")
            ? studyCard
            : undefined;
      if (!current) return;

      if (e.code === "KeyP") {
        e.preventDefault();
        speakWord(current.front);
        return;
      }

      if (studyStyle === "type") return;

      if (mode === "review") {
        if (e.code === "Space") {
          e.preventDefault();
          setRevealed(r => !r);
          return;
        }
        if (!revealed) return;
        const map: Record<string, VocabRating> = {
          Digit1: "again",
          Digit2: "hard",
          Digit3: "good",
          Digit4: "easy",
        };
        const rating = map[e.code];
        if (rating) {
          e.preventDefault();
          onRateReviewRef.current(rating);
        }
      }

      if (mode === "study" && studyStyle === "cards") {
        if (e.code === "Space") {
          e.preventDefault();
          setRevealed(r => !r);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, studyStyle, reviewCard, studyCard, revealed]);

  async function onStudyKnow(knew: boolean) {
    if (!studyCard || pendingRef.current) return;
    if (knew) {
      // Advance learning with good; leave this study session (review does SRS reps).
      await rateCard("study", studyCard, "good", { dismissFromSession: true });
    } else {
      // Don't ask again immediately — send to end of remaining lesson cards.
      await rateCard("study", studyCard, "again", { requeueAs: "end" });
    }
  }

  async function onTypedRate(card: LangCardItem, rating: VocabRating) {
    if (pendingRef.current) return;
    const kind = mode === "review" ? "review" : "study";
    if (kind === "study" && (rating === "good" || rating === "easy")) {
      await rateCard("study", card, "good", { dismissFromSession: true });
      return;
    }
    if (kind === "study" && (rating === "again" || rating === "hard")) {
      await rateCard("study", card, rating, {
        requeueAs: rating === "again" ? "end" : "later",
      });
      return;
    }
    await rateCard(kind, card, rating);
  }

  function skipStudyCard() {
    if (!studyCard) return;
    setStudyQueue(q => [...q.slice(1), studyCard]);
    setRevealed(false);
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startLesson(key: string, lessonNum: number) {
    setDeckKey(key);
    setLesson(lessonNum);
    setMode("study");
    setStudyStyle("cards");
  }

  const studyTotal = studyQueue.length + sessionDone;
  const studyProgress =
    studyTotal > 0 ? Math.round((sessionDone / studyTotal) * 100) : 0;

  const selectedDeck =
    installedDecks.find(d => d.key === deckKey) ??
    decks.find(d => d.key === deckKey);

  const bankMatchesLesson =
    bank.length > 0 &&
    bank.every(c => c.lesson == null || c.lesson === lesson);

  const bankAllStudied =
    !bankLoading &&
    bankMatchesLesson &&
    bank.every(c => c.reviewCount > 0);

  const lessonsFreshKey =
    selectedDeck?.lessons
      .map(l => `${l.lesson}:${l.total}:${l.fresh}`)
      .join("|") ?? "";

  const sessionDoneKey = (sessionDoneLessons[deckKey] ?? []).join(",");

  const localDoneLessons = React.useMemo(() => {
    const done = new Set<number>();
    for (const l of selectedDeck?.lessons ?? []) {
      if (l.total > 0 && l.fresh === 0) done.add(l.lesson);
    }
    // Session marks only count when server also shows no fresh cards
    // (guards against race marks when switching lessons).
    for (const n of sessionDoneLessons[deckKey] ?? []) {
      const meta = selectedDeck?.lessons.find(l => l.lesson === n);
      if (meta && meta.total > 0 && meta.fresh === 0) done.add(n);
    }
    if (bankAllStudied) done.add(lesson);
    return done;
  }, [
    sessionDoneKey,
    deckKey,
    lessonsFreshKey,
    bankAllStudied,
    lesson,
    selectedDeck?.lessons,
    sessionDoneLessons,
  ]);

  React.useEffect(() => {
    if (mode !== "study") return;
    if (!bankAllStudied) return;
    setSessionDoneLessons(prev => {
      if (prev[deckKey]?.includes(lesson)) return prev;
      return {
        ...prev,
        [deckKey]: [...(prev[deckKey] ?? []), lesson],
      };
    });
    // Intentionally no router.refresh() here: refresh remounts this panel, clears
    // session marks, reloads an already-studied bank, and loops RSC fetches.
  }, [mode, bankAllStudied, deckKey, lesson]);

  // Drop false session completions after server fresh counts arrive.
  React.useEffect(() => {
    if (!selectedDeck) return;
    setSessionDoneLessons(prev => {
      const cur = prev[deckKey];
      if (!cur?.length) return prev;
      const kept = cur.filter(n => {
        const meta = selectedDeck.lessons.find(l => l.lesson === n);
        if (!meta || meta.total <= 0) return false;
        if (meta.fresh === 0) return true;
        // Keep optimistic mark while this lesson’s bank is loading or verified done.
        if (n === lesson && (bankLoading || bankAllStudied)) return true;
        return false;
      });
      if (
        kept.length === cur.length &&
        kept.every((n, i) => n === cur[i])
      ) {
        return prev;
      }
      return { ...prev, [deckKey]: kept };
    });
  }, [
    deckKey,
    lessonsFreshKey,
    selectedDeck,
    lesson,
    bankAllStudied,
    bankLoading,
  ]);

  const unlockedLesson = maxUnlockedLesson(
    selectedDeck?.lessons ?? [],
    localDoneLessons,
  );

  React.useEffect(() => {
    if (mode !== "study") return;
    if (lesson > unlockedLesson) setLesson(unlockedLesson);
  }, [mode, lesson, unlockedLesson]);

  const nextStudyLesson = nextPlayableLesson(
    selectedDeck?.lessons ?? [],
    lesson,
    localDoneLessons,
  );

  const modes: { id: VocabMode; label: string; badge?: number }[] = [
    { id: "study", label: t.language.vocabModeStudy },
    {
      id: "review",
      label: t.language.vocabModeReview,
      badge: stats.dueCount > 0 ? stats.dueCount : undefined,
    },
    { id: "library", label: t.language.vocabModeLibrary },
    { id: "stats", label: t.language.vocabStatsTitle },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1">
        {modes.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setRevealed(false);
              setSessionDone(0);
            }}
            className={cn(
              "flex-1 min-w-[4.5rem] rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {m.label}
            {m.badge != null && (
              <span
                className={cn(
                  "ms-1.5 inline-flex min-w-5 justify-center rounded-full px-1 text-[10px] tabular-nums",
                  mode === m.id
                    ? "bg-primary-foreground/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {formatNumber(m.badge, language)}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 px-1">
          {message}
        </p>
      )}

      {/* Compact stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(
          [
            [stats.streakDays, t.language.vocabStreak],
            [stats.dueCount, t.language.vocabDue],
            [stats.reviewedToday, t.language.vocabReviewedToday],
            [stats.newCount, t.language.vocabNewLabel],
          ] as const
        ).map(([n, label], i) => (
          <div
            key={i}
            className="rounded-xl border bg-card px-3 py-2.5 text-center"
          >
            <p className="text-xl font-semibold tabular-nums leading-none">
              {formatNumber(n, language)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Direction + auto-speak — study & review */}
      {(mode === "study" || mode === "review") && (
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["en-fa", t.language.vocabDirEnFa],
              ["fa-en", t.language.vocabDirFaEn],
              ["mixed", t.language.vocabDirMixed],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setDirection(id);
                setRevealed(false);
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs",
                direction === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </button>
          ))}
          <label className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={e => setAutoSpeak(e.target.checked)}
              className="rounded border"
            />
            {t.language.vocabAutoSpeak}
          </label>
        </div>
      )}

      {/* ——— STUDY ——— */}
      {mode === "study" && (
        <div className="flex flex-col gap-3">
          {installedDecks.length === 0 ? (
            <EmptyInstall
              pending={pending}
              onInstallAll={() => void onInstallAll()}
              title={t.language.vocabStudyEmpty}
              cta={t.language.deckInstallAll}
            />
          ) : (
            <>
              <DeckLessonPicker
                decks={installedDecks.length > 0 ? installedDecks : decks}
                deckKey={deckKey}
                lesson={lesson}
                language={language}
                t={t.language}
                lockProgression
                localDoneLessons={localDoneLessons}
                onDeck={key => {
                  setDeckKey(key);
                  setLesson(1);
                }}
                onLesson={n => setLesson(n)}
              />

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ["cards", t.language.vocabStudyCards],
                    ["list", t.language.vocabStudyList],
                    ["type", t.language.vocabStudyType],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setStudyStyle(id);
                      setRevealed(false);
                    }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs",
                      studyStyle === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {label}
                  </button>
                ))}
                {bankLoading && (
                  <span className="ms-auto text-[11px] text-muted-foreground">
                    {t.common.loading}
                  </span>
                )}
              </div>

              {studyStyle === "cards" && (
                <>
                  {studyTotal > 0 && (
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${studyProgress}%` }}
                      />
                    </div>
                  )}
                  {!bankLoading && !studyCard ? (
                    <StudyLessonDone
                      title={
                        nextStudyLesson != null
                          ? t.language.vocabStudyCaughtUp
                          : t.language.vocabStudyAllDone
                      }
                      nextLabel={t.language.vocabNextLesson}
                      reviewLabel={t.language.vocabModeReview}
                      nextLesson={nextStudyLesson}
                      language={language}
                      onNextLesson={n => setLesson(n)}
                      onReview={() => setMode("review")}
                    />
                  ) : (
                    <FlipCard
                      card={studyCard}
                      direction={direction}
                      revealed={revealed}
                      pending={pending}
                      remaining={studyQueue.length}
                      language={language}
                      autoSpeak={autoSpeak}
                      speakLabel={t.language.vocabSpeak}
                      labels={{
                        empty: t.language.vocabStudyCaughtUp,
                        reveal: t.language.revealCard,
                        remaining: t.language.vocabRemaining,
                        hint: t.language.vocabSpaceHint,
                      }}
                      footer={
                        revealed ? (
                          <div className="px-4 pb-4 flex flex-wrap gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={pending}
                              onClick={() => void onStudyKnow(false)}
                            >
                              {t.language.vocabDontKnow}
                            </Button>
                            <Button
                              size="sm"
                              variant="subtle"
                              disabled={pending}
                              onClick={skipStudyCard}
                            >
                              {t.language.vocabSkip}
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={pending}
                              onClick={() => void onStudyKnow(true)}
                            >
                              {t.language.vocabKnow}
                            </Button>
                          </div>
                        ) : null
                      }
                      onReveal={() => setRevealed(true)}
                    />
                  )}
                </>
              )}

              {studyStyle === "type" && (
                <>
                  {studyTotal > 0 && (
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${studyProgress}%` }}
                      />
                    </div>
                  )}
                  {!bankLoading && !studyCard ? (
                    <StudyLessonDone
                      title={
                        nextStudyLesson != null
                          ? t.language.vocabStudyCaughtUp
                          : t.language.vocabStudyAllDone
                      }
                      nextLabel={t.language.vocabNextLesson}
                      reviewLabel={t.language.vocabModeReview}
                      nextLesson={nextStudyLesson}
                      language={language}
                      onNextLesson={n => setLesson(n)}
                      onReview={() => setMode("review")}
                    />
                  ) : (
                    <TypeCard
                      card={studyCard}
                      direction={direction}
                      pending={pending}
                      remaining={studyQueue.length}
                      language={language}
                      autoSpeak={autoSpeak}
                      speakLabel={t.language.vocabSpeak}
                      empty={t.language.vocabStudyCaughtUp}
                      remainingLabel={t.language.vocabRemaining}
                      labels={{
                        placeholder: t.language.vocabTypePlaceholder,
                        check: t.language.vocabTypeCheck,
                        exact: t.language.vocabTypeExact,
                        close: t.language.vocabTypeClose,
                        wrong: t.language.vocabTypeWrong,
                        expected: t.language.vocabTypeExpected,
                        continue: t.language.vocabTypeContinue,
                        hint: t.language.vocabTypeHint,
                        skip: t.language.vocabSkip,
                      }}
                      onSkip={skipStudyCard}
                      onDone={(rating) => {
                        if (studyCard) void onTypedRate(studyCard, rating);
                      }}
                    />
                  )}
                </>
              )}

              {studyStyle === "list" && (
                <StudyList
                  cards={bank}
                  direction={direction}
                  expandedIds={expandedIds}
                  language={language}
                  empty={t.language.vocabLessonEmpty}
                  tapHint={t.language.vocabTapMeaning}
                  speakLabel={t.language.vocabSpeak}
                  onToggle={toggleExpand}
                  onExpandAll={() =>
                    setExpandedIds(new Set(bank.map(c => c.id)))
                  }
                  onCollapseAll={() => setExpandedIds(new Set())}
                  expandAllLabel={t.language.vocabShowAll}
                  collapseAllLabel={t.language.vocabHideAll}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ——— REVIEW ——— */}
      {mode === "review" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["cards", t.language.vocabStudyCards],
                ["type", t.language.vocabStudyType],
              ] as const
            ).map(([id, label]) => {
              const active =
                id === "type"
                  ? studyStyle === "type"
                  : studyStyle !== "type";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setStudyStyle(id);
                    setRevealed(false);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              );
            })}
            <span className="w-px h-4 bg-border mx-0.5" />
            {(
              [
                ["all", t.language.vocabFilterAll],
                ["hard", t.language.vocabFilterHard],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={pending}
                onClick={() => {
                  if (reviewFilter === id) return;
                  setReviewFilter(id);
                  seededReviewRef.current = false;
                  void loadReviewQueue(id);
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs",
                  reviewFilter === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
            <span className="ms-auto text-[11px] text-muted-foreground tabular-nums">
              {reviewFilter === "hard"
                ? `${formatNumber(reviewQueue.length, language)} · ${t.language.vocabFilterHard}`
                : t.language.vocabDailyLeft.replace(
                    "{n}",
                    formatNumber(reviewQueue.length, language),
                  )}
            </span>
            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={() => void refillReviewQueue()}
            >
              {t.language.vocabRefill}
            </Button>
          </div>

          {!reviewCard ? (
            <div className="rounded-2xl border bg-card px-6 py-12 text-center">
              <p className="text-base font-medium">
                {reviewFilter === "hard"
                  ? t.language.vocabHardQueueEmpty
                  : t.language.vocabCaughtUp}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.dueCount > 0
                  ? t.language.vocabRefill
                  : t.language.vocabReviewGoStudy}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {stats.dueCount > 0 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={pending}
                    onClick={() => void refillReviewQueue()}
                  >
                    {t.language.vocabRefill}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => setMode("study")}
                >
                  {t.language.vocabModeStudy}
                </Button>
              </div>
            </div>
          ) : studyStyle === "type" ? (
            <TypeCard
              card={reviewCard}
              direction={direction}
              pending={pending}
              remaining={reviewQueue.length}
              language={language}
              autoSpeak={autoSpeak}
              speakLabel={t.language.vocabSpeak}
              empty={t.language.vocabCaughtUp}
              remainingLabel={t.language.vocabRemaining}
              labels={{
                placeholder: t.language.vocabTypePlaceholder,
                check: t.language.vocabTypeCheck,
                exact: t.language.vocabTypeExact,
                close: t.language.vocabTypeClose,
                wrong: t.language.vocabTypeWrong,
                expected: t.language.vocabTypeExpected,
                continue: t.language.vocabTypeContinue,
                hint: t.language.vocabTypeHint,
                skip: t.language.vocabSkip,
              }}
              onSkip={() => {
                setReviewQueue(q => [...q.slice(1), reviewCard]);
              }}
              onDone={rating => void onTypedRate(reviewCard, rating)}
            />
          ) : (
            <FlipCard
              card={reviewCard}
              direction={direction}
              revealed={revealed}
              pending={pending}
              remaining={reviewQueue.length}
              language={language}
              autoSpeak={autoSpeak}
              speakLabel={t.language.vocabSpeak}
              meta={
                [
                  reviewCard.deckKey
                    ? deckMeta(reviewCard.deckKey, t.language).short
                    : null,
                  reviewCard.lesson
                    ? `${t.language.deckLesson} ${formatNumber(reviewCard.lesson, language)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              }
              labels={{
                empty: t.language.vocabCaughtUp,
                reveal: t.language.revealCard,
                remaining: t.language.vocabRemaining,
                hint: t.language.vocabReviewHint,
              }}
              footer={
                revealed ? (
                  <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        ["again", t.language.rateAgain, "danger"],
                        ["hard", t.language.rateHard, "subtle"],
                        ["good", t.language.rateGood, "primary"],
                        ["easy", t.language.rateEasy, "secondary"],
                      ] as const
                    ).map(([rating, label, variant]) => (
                      <Button
                        key={rating}
                        size="sm"
                        variant={variant}
                        disabled={pending}
                        onClick={() => void onRateReview(rating)}
                        className="w-full flex flex-col gap-0.5 h-auto py-2"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] font-normal opacity-80 tabular-nums">
                          {previewRatingLabel(reviewCard, rating, language)}
                        </span>
                      </Button>
                    ))}
                  </div>
                ) : null
              }
              onReveal={() => setRevealed(true)}
            />
          )}
        </div>
      )}

      {/* ——— LIBRARY ——— */}
      {mode === "library" && (
        <div className="flex flex-col gap-3">
          <section className="rounded-xl border bg-card p-3 space-y-2">
            <p className="text-sm font-medium">{t.language.addCard}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={t.language.cardFront}
                value={newFront}
                onChange={e => setNewFront(e.target.value)}
              />
              <Input
                placeholder={t.language.cardBack}
                value={newBack}
                onChange={e => setNewBack(e.target.value)}
              />
            </div>
            <Textarea
              rows={2}
              placeholder={t.language.cardExample}
              value={newExample}
              onChange={e => setNewExample(e.target.value)}
            />
            <Input
              placeholder={t.language.cardTags}
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              disabled={pending || !newFront.trim() || !newBack.trim()}
              onClick={() => void onAddCard()}
            >
              {t.language.saveCard}
            </Button>
          </section>

          {recentCards.length > 0 && (
            <section className="rounded-xl border bg-card overflow-hidden">
              <p className="px-3 py-2 text-[11px] text-muted-foreground border-b">
                {t.language.recentCards}
              </p>
              <ul className="divide-y max-h-48 overflow-y-auto">
                {recentCards.map(c => (
                  <li
                    key={c.id}
                    className="px-3 py-2 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.front}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {c.back}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => void onDeleteCard(c.id)}
                    >
                      {t.language.deleteCard}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t.language.vocabLibraryHint}
            </p>
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => void onInstallAll()}
            >
              {t.language.deckInstallAll}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {decks.map(deck => {
              const meta = deckMeta(deck.key, t.language);
              const filledLessons = deck.lessons.filter(l => l.total > 0).length;
              const installed = deck.installed > 0;
              const totalShown = installed ? deck.installed : deck.starterCount;
              const seenPct = installed
                ? Math.round((deck.seen / deck.installed) * 100)
                : 0;
              const masteredPct = installed
                ? Math.round((deck.mastered / deck.installed) * 100)
                : 0;
              return (
                <div
                  key={deck.key}
                  className="rounded-xl border bg-card p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {meta.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {meta.hint}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={installed ? "subtle" : "primary"}
                      disabled={pending}
                      onClick={() => void onInstall(deck.key)}
                    >
                      {installed
                        ? t.language.deckSyncStarter
                        : t.language.deckInstall}
                    </Button>
                  </div>
                  {installed && (
                    <DeckProgressBar
                      seenPct={seenPct}
                      masteredPct={masteredPct}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                    <span>
                      {formatNumber(totalShown, language)}{" "}
                      {installed
                        ? t.language.vocabTotalLabel
                        : t.language.deckWordCount}
                    </span>
                    {installed ? (
                      <>
                        <span>
                          {formatNumber(deck.seen, language)}{" "}
                          {t.language.vocabSeen}
                        </span>
                        <span>
                          {formatNumber(deck.mastered, language)}{" "}
                          {t.language.vocabMastered}
                        </span>
                        <span>
                          {formatNumber(deck.fresh, language)}{" "}
                          {t.language.vocabFresh}
                        </span>
                        {deck.due > 0 && (
                          <span className="text-primary">
                            {formatNumber(deck.due, language)}{" "}
                            {t.language.vocabDueShort}
                          </span>
                        )}
                      </>
                    ) : null}
                    <span>
                      {formatNumber(deck.lessonCount, language)}{" "}
                      {t.language.deckLesson}
                    </span>
                  </div>
                  {installed && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {deck.lessons
                        .filter(l => l.total > 0)
                        .slice(0, 8)
                        .map(l => (
                          <button
                            key={l.lesson}
                            type="button"
                            onClick={() => startLesson(deck.key, l.lesson)}
                            className="rounded-md border px-1.5 py-0.5 text-[10px] hover:bg-accent tabular-nums"
                          >
                            {formatNumber(l.lesson, language)}
                          </button>
                        ))}
                      {filledLessons > 8 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeckKey(deck.key);
                            setMode("study");
                          }}
                          className="rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent"
                        >
                          …
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ——— STATS ——— */}
      {mode === "stats" && (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {t.language.vocabDeckProgress}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {t.language.vocabProgressHint}
              </p>
            </div>
            <ul className="space-y-4">
              {decks
                .filter(d => d.installed > 0)
                .map(deck => {
                  const meta = deckMeta(deck.key, t.language);
                  const seenPct = Math.round(
                    (deck.seen / Math.max(1, deck.installed)) * 100,
                  );
                  const masteredPct = Math.round(
                    (deck.mastered / Math.max(1, deck.installed)) * 100,
                  );
                  return (
                    <li key={deck.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{meta.short}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatNumber(seenPct, language)}%
                        </span>
                      </div>
                      <DeckProgressBar
                        seenPct={seenPct}
                        masteredPct={masteredPct}
                      />
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground tabular-nums">
                        <span>
                          {formatNumber(deck.installed, language)}{" "}
                          {t.language.vocabTotalLabel}
                        </span>
                        <span>
                          {formatNumber(deck.seen, language)}{" "}
                          {t.language.vocabSeen}
                        </span>
                        <span>
                          {formatNumber(deck.learning, language)}{" "}
                          {t.language.vocabLearning}
                        </span>
                        <span>
                          {formatNumber(deck.mastered, language)}{" "}
                          {t.language.vocabMastered}
                        </span>
                        <span>
                          {formatNumber(deck.fresh, language)}{" "}
                          {t.language.vocabFresh}
                        </span>
                        {deck.due > 0 && (
                          <span className="text-primary">
                            {formatNumber(deck.due, language)}{" "}
                            {t.language.vocabDueShort}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              {installedDecks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t.language.vocabStudyEmpty}
                </p>
              )}
            </ul>
          </section>

          <section className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {t.language.vocabHardWords}
              </h3>
              {hardCards.length > 0 && (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pending}
                  onClick={startHardReview}
                >
                  {t.language.vocabReviewHard}
                </Button>
              )}
            </div>
            {hardCards.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                {t.language.vocabHardEmpty}
              </p>
            ) : (
              <ul className="divide-y max-h-[22rem] overflow-y-auto">
                {hardCards.map(card => (
                  <li
                    key={card.id}
                    className="flex items-start gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold tracking-tight">
                        {card.front}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {card.back}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                        {formatNumber(card.lapses, language)}{" "}
                        {t.language.vocabHardLapses}
                        {card.deckKey
                          ? ` · ${deckMeta(card.deckKey, t.language).short}`
                          : ""}
                        {card.lesson
                          ? ` · ${t.language.deckLesson} ${formatNumber(card.lesson, language)}`
                          : ""}
                      </p>
                    </div>
                    <SpeakButton
                      text={card.front}
                      label={t.language.vocabSpeak}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-[11px] text-muted-foreground text-center tabular-nums">
            {t.language.vocabTotalLabel}:{" "}
            {formatNumber(stats.totalCount, language)} ·{" "}
            {t.language.vocabSeen}:{" "}
            {formatNumber(
              Math.max(0, stats.totalCount - stats.newCount),
              language,
            )}{" "}
            · {t.language.vocabNewLabel}:{" "}
            {formatNumber(stats.newCount, language)} ·{" "}
            {t.language.vocabDueShort}:{" "}
            {formatNumber(stats.dueCount, language)}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyInstall({
  pending,
  onInstallAll,
  title,
  cta,
}: {
  pending: boolean;
  onInstallAll: () => void;
  title: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border bg-card px-6 py-12 flex flex-col items-center text-center">
      <p className="text-base font-medium">{title}</p>
      <Button
        size="sm"
        variant="primary"
        className="mt-4"
        disabled={pending}
        onClick={onInstallAll}
      >
        {cta}
      </Button>
    </div>
  );
}

function StudyLessonDone({
  title,
  nextLabel,
  reviewLabel,
  nextLesson,
  language,
  onNextLesson,
  onReview,
}: {
  title: string;
  nextLabel: string;
  reviewLabel: string;
  nextLesson: number | null;
  language: "FA" | "EN";
  onNextLesson: (n: number) => void;
  onReview: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
      <p className="text-base font-medium">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {nextLesson != null ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNextLesson(nextLesson)}
          >
            {nextLabel} {formatNumber(nextLesson, language)}
          </Button>
        ) : (
          <Button size="sm" variant="subtle" onClick={onReview}>
            {reviewLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function DeckProgressBar({
  seenPct,
  masteredPct,
}: {
  seenPct: number;
  masteredPct: number;
}) {
  const seen = Math.min(100, Math.max(0, seenPct));
  const mastered = Math.min(seen, Math.max(0, masteredPct));
  return (
    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
      <div
        className="absolute inset-y-0 start-0 bg-primary/35 transition-all"
        style={{ width: `${seen}%` }}
      />
      <div
        className="absolute inset-y-0 start-0 bg-primary transition-all"
        style={{ width: `${mastered}%` }}
      />
    </div>
  );
}

function DeckLessonPicker({
  decks,
  deckKey,
  lesson,
  language,
  t,
  lockProgression,
  localDoneLessons,
  onDeck,
  onLesson,
}: {
  decks: VocabDeckProgress[];
  deckKey: string;
  lesson: number;
  language: "FA" | "EN";
  t: ReturnType<typeof useTranslation>["language"];
  lockProgression?: boolean;
  localDoneLessons?: Set<number>;
  onDeck: (key: string) => void;
  onLesson: (n: number) => void;
}) {
  const selected = decks.find(d => d.key === deckKey);
  const lessons = (selected?.lessons ?? []).filter(l => l.total > 0);
  const done = localDoneLessons ?? new Set<number>();
  const unlocked = lockProgression
    ? maxUnlockedLesson(selected?.lessons ?? [], done)
    : Number.POSITIVE_INFINITY;

  return (
    <div className="rounded-2xl border bg-card/80 p-3.5 space-y-3 shadow-sm">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {decks.map(d => {
          const meta = deckMeta(d.key, t);
          const active = deckKey === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDeck(d.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {meta.short}
            </button>
          );
        })}
      </div>
      {lessons.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {lessons.map(l => {
            const studied = isLessonStudied(l, done);
            const locked = lockProgression && l.lesson > unlocked;
            const active = lesson === l.lesson;
            return (
              <button
                key={l.lesson}
                type="button"
                disabled={locked}
                title={
                  locked
                    ? t.vocabLessonLocked
                    : studied
                      ? t.vocabLessonDone
                      : undefined
                }
                onClick={() => {
                  if (!locked) onLesson(l.lesson);
                }}
                className={cn(
                  "relative shrink-0 flex flex-col items-center justify-center gap-1.5",
                  "h-16 min-w-[3.25rem] px-1.5 rounded-xl border text-xs tabular-nums transition-all",
                  locked &&
                    "opacity-45 cursor-not-allowed border-dashed bg-muted/30 text-muted-foreground",
                  !locked &&
                    active &&
                    "border-primary bg-primary text-primary-foreground shadow-md scale-[1.03]",
                  !locked &&
                    !active &&
                    studied &&
                    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
                  !locked &&
                    !active &&
                    !studied &&
                    "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-accent/60",
                )}
              >
                {locked ? (
                  <LockIcon className="size-3.5 opacity-70" aria-hidden />
                ) : studied && !active ? (
                  <CheckIcon className="size-3.5" aria-hidden />
                ) : (
                  <span className="text-[10px] opacity-70 leading-none">
                    {t.deckLesson}
                  </span>
                )}
                <span className="font-semibold leading-none mt-0.5">
                  {formatNumber(l.lesson, language)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FlipCard({
  card,
  direction,
  revealed,
  pending,
  remaining,
  language,
  autoSpeak,
  speakLabel,
  meta,
  labels,
  footer,
  onReveal,
}: {
  card: LangCardItem | null;
  direction: DirectionMode;
  revealed: boolean;
  pending: boolean;
  remaining: number;
  language: "FA" | "EN";
  autoSpeak: boolean;
  speakLabel: string;
  meta?: string | null;
  labels: {
    empty: string;
    reveal: string;
    remaining: string;
    hint: string;
  };
  footer?: React.ReactNode;
  onReveal: () => void;
}) {
  if (!card) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-14 text-center">
        <p className="text-base font-medium">{labels.empty}</p>
      </div>
    );
  }

  const dir = resolveDirection(direction, card.id);
  const { prompt, answer, speakOnPrompt } = sides(card, dir);
  const showSpeakOnPrompt = speakOnPrompt;
  const showSpeakOnAnswer = revealed && !speakOnPrompt;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {formatNumber(remaining, language)} {labels.remaining}
          {meta ? ` · ${meta}` : ""}
          {direction === "mixed"
            ? ` · ${dir === "en-fa" ? "EN→FA" : "FA→EN"}`
            : ""}
        </span>
        <span>{labels.hint}</span>
      </div>
      <div className="px-6 py-10 sm:py-14 flex flex-col items-center text-center min-h-[14rem] justify-center">
        <div className="flex items-center justify-center gap-3">
          <p
            className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight"
            dir="auto"
          >
            {prompt}
          </p>
          {showSpeakOnPrompt && (
            <SpeakButton
              text={card.front}
              label={speakLabel}
              autoPlayKey={autoSpeak ? `${card.id}-${dir}` : undefined}
            />
          )}
        </div>
        {revealed ? (
          <div className="mt-6 max-w-md space-y-2">
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg text-foreground/90 leading-relaxed" dir="auto">
                {answer}
              </p>
              {showSpeakOnAnswer && (
                <SpeakButton
                  text={card.front}
                  label={speakLabel}
                  autoPlayKey={
                    autoSpeak ? `${card.id}-ans-${dir}` : undefined
                  }
                />
              )}
            </div>
            {card.example && (
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {card.example}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onReveal}
            disabled={pending}
            className="mt-8 rounded-xl border border-dashed px-5 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {labels.reveal}
          </button>
        )}
      </div>
      {footer}
    </div>
  );
}

function TypeCard({
  card,
  direction,
  pending,
  remaining,
  language,
  autoSpeak,
  speakLabel,
  empty,
  remainingLabel,
  labels,
  onSkip,
  onDone,
}: {
  card: LangCardItem | null;
  direction: DirectionMode;
  pending: boolean;
  remaining: number;
  language: "FA" | "EN";
  autoSpeak: boolean;
  speakLabel: string;
  empty: string;
  remainingLabel: string;
  labels: {
    placeholder: string;
    check: string;
    exact: string;
    close: string;
    wrong: string;
    expected: string;
    continue: string;
    hint: string;
    skip: string;
  };
  onSkip: () => void;
  onDone: (rating: VocabRating) => void;
}) {
  const [input, setInput] = React.useState("");
  const [grade, setGrade] = React.useState<TypedGrade | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dir = card ? resolveDirection(direction, card.id) : "en-fa";

  React.useEffect(() => {
    setInput("");
    setGrade(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [card?.id, dir]);

  if (!card) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-14 text-center">
        <p className="text-base font-medium">{empty}</p>
      </div>
    );
  }

  const { prompt, answer, speakOnPrompt } = sides(card, dir);

  function check() {
    const g = gradeTypedAnswer(input, answer);
    setGrade(g);
    if (g === "exact" || dir === "fa-en") {
      speakWord(card!.front);
    }
  }

  function continueWithGrade() {
    if (!grade) return;
    onDone(gradeToRating(grade));
  }

  const gradeLabel =
    grade === "exact"
      ? labels.exact
      : grade === "close"
        ? labels.close
        : labels.wrong;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {formatNumber(remaining, language)} {remainingLabel}
          {direction === "mixed"
            ? ` · ${dir === "en-fa" ? "EN→FA" : "FA→EN"}`
            : ""}
        </span>
        <span>{labels.hint}</span>
      </div>
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center gap-3">
          <p
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
            dir="auto"
          >
            {prompt}
          </p>
          {speakOnPrompt && (
            <SpeakButton
              text={card.front}
              label={speakLabel}
              autoPlayKey={autoSpeak ? `type-${card.id}-${dir}` : undefined}
            />
          )}
        </div>

        {grade == null ? (
          <form
            className="w-full max-w-md space-y-3"
            onSubmit={e => {
              e.preventDefault();
              check();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  onSkip();
                }
              }}
              placeholder={labels.placeholder}
              dir="auto"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={pending}
              className="w-full rounded-xl border bg-background px-4 py-3 text-center text-lg tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                size="sm"
                variant="subtle"
                disabled={pending}
                onClick={onSkip}
              >
                {labels.skip}
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={pending || !input.trim()}
              >
                {labels.check}
              </Button>
            </div>
          </form>
        ) : (
          <div className="w-full max-w-md space-y-3">
            <p
              className={cn(
                "text-sm font-medium",
                grade === "exact" && "text-emerald-600 dark:text-emerald-400",
                grade === "close" && "text-amber-600 dark:text-amber-400",
                grade === "wrong" && "text-destructive",
              )}
            >
              {gradeLabel}
            </p>
            <div className="rounded-xl border bg-muted/40 px-4 py-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {labels.expected}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-semibold" dir="auto">
                  {answer}
                </p>
                <SpeakButton text={card.front} label={speakLabel} size="sm" />
              </div>
              {input.trim() && grade !== "exact" && (
                <p className="text-xs text-muted-foreground mt-1" dir="auto">
                  ← {input.trim()}
                </p>
              )}
            </div>
            {card.example && (
              <p className="text-sm text-muted-foreground italic">
                {card.example}
              </p>
            )}
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={continueWithGrade}
              className="w-full sm:w-auto"
            >
              {labels.continue}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StudyList({
  cards,
  direction,
  expandedIds,
  language,
  empty,
  tapHint,
  speakLabel,
  onToggle,
  onExpandAll,
  onCollapseAll,
  expandAllLabel,
  collapseAllLabel,
}: {
  cards: LangCardItem[];
  direction: DirectionMode;
  expandedIds: Set<string>;
  language: "FA" | "EN";
  empty: string;
  tapHint: string;
  speakLabel: string;
  onToggle: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  expandAllLabel: string;
  collapseAllLabel: string;
}) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {formatNumber(cards.length, language)} · {tapHint}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onExpandAll}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5"
          >
            {expandAllLabel}
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5"
          >
            {collapseAllLabel}
          </button>
        </div>
      </div>
      <ul className="divide-y max-h-[28rem] overflow-y-auto">
        {cards.map((card, i) => {
          const open = expandedIds.has(card.id);
          const dir = resolveDirection(direction, card.id);
          const { prompt, answer } = sides(card, dir);
          return (
            <li key={card.id}>
              <div
                dir="ltr"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  "hover:bg-accent/40 transition-colors",
                  open && "bg-primary/[0.04]",
                )}
              >
                <span className="w-5 shrink-0 text-[11px] text-muted-foreground tabular-nums text-center">
                  {formatNumber(i + 1, language)}
                </span>
                <SpeakButton
                  text={card.front}
                  label={speakLabel}
                  size="sm"
                  className="shrink-0"
                />
                <button
                  type="button"
                  onClick={() => onToggle(card.id)}
                  className="shrink-0 text-left text-base font-semibold tracking-tight rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {prompt}
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(card.id)}
                  className={cn(
                    "min-w-0 flex-1 text-start truncate rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    open
                      ? "text-sm text-foreground/85"
                      : "text-[11px] text-muted-foreground",
                  )}
                  dir="auto"
                >
                  {open ? answer : tapHint}
                  {!open && direction === "mixed"
                    ? ` · ${dir === "en-fa" ? "EN→FA" : "FA→EN"}`
                    : ""}
                </button>
              </div>
              {open && card.example ? (
                <p
                  className="px-3 pb-2.5 ps-14 text-xs text-muted-foreground italic leading-relaxed"
                  dir="auto"
                >
                  {card.example}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
