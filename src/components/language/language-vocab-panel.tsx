"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import {
  createLangCardAction,
  deleteLangCardAction,
  importLessonCardsAction,
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
  REVIEW_DAILY_CAP,
  type RequeueHint,
} from "@/features/language/srs";
import { SpeakButton } from "@/components/language/speak-button";
import { speakWord } from "@/features/language/speak";
import { cn, formatNumber } from "@/lib/utils";

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
    initialReviewFilter === "hard" || stats.dueCount > 0
      ? "review"
      : "study",
  );
  const [studyStyle, setStudyStyle] = React.useState<StudyStyle>("cards");
  const [direction, setDirection] = React.useState<DirectionMode>("mixed");
  const [reviewFilter, setReviewFilter] = React.useState<"all" | "hard">(
    initialReviewFilter,
  );
  const [deckKey, setDeckKey] = React.useState(defaultDeck);
  const [lesson, setLesson] = React.useState(1);
  const [bank, setBank] = React.useState<LangCardItem[]>([]);
  const [bankLoading, setBankLoading] = React.useState(false);

  const [reviewQueue, setReviewQueue] = React.useState<LangCardItem[]>(() => {
    if (initialReviewFilter === "hard") {
      return hardCards.slice(0, REVIEW_DAILY_CAP);
    }
    return dueCards.slice(
      0,
      Math.max(0, REVIEW_DAILY_CAP - (stats.reviewedToday ?? 0)),
    );
  });
  const [studyQueue, setStudyQueue] = React.useState<LangCardItem[]>([]);
  const [revealed, setRevealed] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [newFront, setNewFront] = React.useState("");
  const [newBack, setNewBack] = React.useState("");
  const [newExample, setNewExample] = React.useState("");
  const [newTags, setNewTags] = React.useState("");
  const [sessionDone, setSessionDone] = React.useState(0);
  const [autoSpeak, setAutoSpeak] = React.useState(true);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  /** Unique cards rated today — daily card budget. */
  const [cardsDoneToday, setCardsDoneToday] = React.useState(
    () => stats.reviewedToday ?? 0,
  );
  const seededReviewRef = React.useRef(false);
  const cardsDoneTodayRef = React.useRef(cardsDoneToday);
  cardsDoneTodayRef.current = cardsDoneToday;
  const touchedTodayRef = React.useRef<Set<string>>(new Set());

  const reviewCard = reviewQueue[0] ?? null;
  const studyCard = studyQueue[0] ?? null;
  const dailyLeft = Math.max(0, REVIEW_DAILY_CAP - cardsDoneToday);

  React.useEffect(() => {
    setCardsDoneToday(prev => Math.max(prev, stats.reviewedToday ?? 0));
  }, [stats.reviewedToday]);

  React.useEffect(() => {
    if (mode !== "review") {
      seededReviewRef.current = false;
      return;
    }
    if (seededReviewRef.current) return;
    seededReviewRef.current = true;
    if (reviewFilter === "hard") {
      setReviewQueue(hardCards.slice(0, REVIEW_DAILY_CAP));
      setRevealed(false);
      return;
    }
    const base = Math.max(
      cardsDoneTodayRef.current,
      stats.reviewedToday ?? 0,
    );
    setCardsDoneToday(base);
    setReviewQueue(
      dueCards.slice(0, Math.max(0, REVIEW_DAILY_CAP - base)),
    );
    setRevealed(false);
    touchedTodayRef.current = new Set();
  }, [mode, dueCards, hardCards, stats.reviewedToday, reviewFilter]);

  async function loadReviewQueue(filter: "all" | "hard") {
    setPending(true);
    setMessage(null);
    const result = await listDueCardsAction({
      take: REVIEW_DAILY_CAP,
      filter,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
      return;
    }
    const cards = mapCards(result.data?.cards);
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
    void loadReviewQueue("hard");
  }

  function noteCardTouched(card: LangCardItem) {
    if (touchedTodayRef.current.has(card.id)) return;
    touchedTodayRef.current.add(card.id);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const alreadyToday =
      card.lastReviewedAt != null &&
      card.lastReviewedAt.getTime() >= dayStart.getTime();
    if (!alreadyToday) setCardsDoneToday(n => n + 1);
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
  ) {
    setPending(true);
    const result = await reviewLangCardAction({
      cardId: card.id,
      rating,
    });
    setPending(false);
    if (!result.success) {
      if (result.error) window.alert(result.error);
      return;
    }
    const hint =
      (result.data?.requeueInSession as RequeueHint | undefined) ?? "none";
    noteCardTouched(card);
    advanceQueue(kind, card, hint);
    setSessionDone(n => n + 1);
    setRevealed(false);
    if (kind === "study") {
      setBank(prev =>
        prev.map(c =>
          c.id === card.id
            ? {
                ...c,
                reviewCount: c.reviewCount + 1,
                lastReviewedAt: new Date(),
                learningStep:
                  (result.data?.learningStep as number | null | undefined) ??
                  c.learningStep,
                box: Number(result.data?.box ?? c.box),
              }
            : c,
        ),
      );
    }
  }

  async function refillReviewQueue() {
    await loadReviewQueue(reviewFilter);
    router.refresh();
  }

  React.useEffect(() => {
    let cancelled = false;
    setBankLoading(true);
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
      const fresh = cards.filter(c => c.reviewCount === 0);
      const queue = fresh.length > 0 ? fresh : cards;
      setStudyQueue(queue);
      setSessionDone(0);
      setRevealed(false);
      setExpandedIds(new Set());
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
      router.refresh();
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

  async function onImport() {
    if (!importText.trim()) return;
    setPending(true);
    setMessage(null);
    const result = await importLessonCardsAction({
      deckKey,
      lesson,
      text: importText,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (result.success) {
      const added = Number(result.data?.added ?? 0);
      const skipped = Number(result.data?.skipped ?? 0);
      let msg = t.language.lessonImported.replace(
        "{n}",
        formatNumber(added, language),
      );
      if (skipped > 0) {
        msg +=
          " " +
          t.language.vocabImportSkipped.replace(
            "{n}",
            formatNumber(skipped, language),
          );
      }
      setMessage(msg);
      setImportText("");
      setImportOpen(false);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
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
    if (!studyCard) return;
    await rateCard("study", studyCard, knew ? "good" : "again");
  }

  async function onTypedRate(card: LangCardItem, rating: VocabRating) {
    await rateCard(mode === "review" ? "review" : "study", card, rating);
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-[16rem]">
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
        <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={e => setAutoSpeak(e.target.checked)}
            className="rounded border"
          />
          {t.language.vocabAutoSpeak}
        </label>
      </div>

      {/* Direction — study & review */}
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
                showEmptyLessons
                onDeck={key => {
                  setDeckKey(key);
                  setLesson(1);
                }}
                onLesson={setLesson}
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
                <button
                  type="button"
                  onClick={() => setImportOpen(o => !o)}
                  className={cn(
                    "ms-auto rounded-md border px-2.5 py-1 text-xs",
                    importOpen
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {t.language.vocabImportToggle}
                </button>
                {bankLoading && (
                  <span className="text-[11px] text-muted-foreground">
                    {t.common.loading}
                  </span>
                )}
              </div>

              {importOpen && (
                <ImportLessonBox
                  text={importText}
                  pending={pending}
                  language={language}
                  lesson={lesson}
                  hint={t.language.lessonImportHint}
                  placeholder={t.language.vocabImportPlaceholder}
                  submitLabel={
                    pending
                      ? t.language.vocabImportBusy
                      : t.language.importLesson
                  }
                  lessonLabel={t.language.deckLesson}
                  onChange={setImportText}
                  onSubmit={() => void onImport()}
                />
              )}

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
                : t.language.vocabDailyLeft
                    .replace("{n}", formatNumber(dailyLeft, language))
                    .replace(
                      "{cap}",
                      formatNumber(REVIEW_DAILY_CAP, language),
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
                  : cardsDoneToday >= REVIEW_DAILY_CAP
                    ? t.language.vocabDailyDone
                        .replace(
                          "{done}",
                          formatNumber(cardsDoneToday, language),
                        )
                        .replace(
                          "{cap}",
                          formatNumber(REVIEW_DAILY_CAP, language),
                        )
                    : t.language.vocabCaughtUp}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.dueCount > 0
                  ? t.language.vocabRefill
                  : t.language.vocabReviewGoStudy}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {stats.dueCount > 0 || cardsDoneToday >= REVIEW_DAILY_CAP ? (
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
                        className="w-full"
                      >
                        {label}
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
              const seenPct =
                deck.installed > 0
                  ? Math.round((deck.seen / deck.installed) * 100)
                  : 0;
              const masteredPct =
                deck.installed > 0
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
                      variant={deck.installed > 0 ? "subtle" : "primary"}
                      disabled={pending}
                      onClick={() => void onInstall(deck.key)}
                    >
                      {deck.installed > 0
                        ? t.language.deckSyncStarter
                        : t.language.deckInstall}
                    </Button>
                  </div>
                  {deck.installed > 0 && (
                    <DeckProgressBar
                      seenPct={seenPct}
                      masteredPct={masteredPct}
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                    <span>
                      {formatNumber(deck.installed, language)}{" "}
                      {t.language.vocabTotalLabel}
                    </span>
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
                    <span>
                      {formatNumber(filledLessons, language)}{" "}
                      {t.language.deckLesson}
                    </span>
                  </div>
                  {deck.installed > 0 && (
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
    <div className="rounded-2xl border bg-card px-6 py-12 text-center">
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

function ImportLessonBox({
  text,
  pending,
  language,
  lesson,
  hint,
  placeholder,
  submitLabel,
  lessonLabel,
  onChange,
  onSubmit,
}: {
  text: string;
  pending: boolean;
  language: "FA" | "EN";
  lesson: number;
  hint: string;
  placeholder: string;
  submitLabel: string;
  lessonLabel: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {lessonLabel} {formatNumber(lesson, language)} · {hint}
      </p>
      <textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y min-h-[6rem]"
        dir="auto"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="primary"
          disabled={pending || !text.trim()}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function DeckLessonPicker({
  decks,
  deckKey,
  lesson,
  language,
  t,
  showEmptyLessons,
  onDeck,
  onLesson,
}: {
  decks: VocabDeckProgress[];
  deckKey: string;
  lesson: number;
  language: "FA" | "EN";
  t: ReturnType<typeof useTranslation>["language"];
  showEmptyLessons?: boolean;
  onDeck: (key: string) => void;
  onLesson: (n: number) => void;
}) {
  const selected = decks.find(d => d.key === deckKey);
  const lessons = showEmptyLessons
    ? (selected?.lessons ?? [])
    : (selected?.lessons ?? []).filter(l => l.total > 0);

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2.5">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {decks.map(d => {
          const meta = deckMeta(d.key, t);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDeck(d.key)}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                deckKey === d.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {meta.short}
            </button>
          );
        })}
      </div>
      {lessons.length > 0 && (
        <div className="flex gap-1 overflow-x-auto">
          {lessons.map(l => (
            <button
              key={l.lesson}
              type="button"
              onClick={() => onLesson(l.lesson)}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[11px] tabular-nums border transition-colors",
                lesson === l.lesson
                  ? "border-primary bg-primary text-primary-foreground"
                  : l.total === 0
                    ? "border-dashed text-muted-foreground/70 hover:bg-accent"
                    : "hover:bg-accent text-muted-foreground",
              )}
            >
              {t.deckLesson} {formatNumber(l.lesson, language)}
            </button>
          ))}
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
              <div className="flex items-start gap-1 px-2 py-1">
                <button
                  type="button"
                  onClick={() => onToggle(card.id)}
                  className="min-w-0 flex-1 text-start px-2 py-2 hover:bg-accent/50 rounded-lg transition-colors"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] text-muted-foreground tabular-nums w-5 shrink-0">
                      {formatNumber(i + 1, language)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-base font-semibold tracking-tight"
                        dir="auto"
                      >
                        {prompt}
                      </p>
                      {open ? (
                        <div className="mt-1.5 space-y-1">
                          <p
                            className="text-sm text-foreground/85 leading-relaxed"
                            dir="auto"
                          >
                            {answer}
                          </p>
                          {card.example && (
                            <p className="text-xs text-muted-foreground italic">
                              {card.example}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tapHint}
                          {direction === "mixed"
                            ? ` · ${dir === "en-fa" ? "EN→FA" : "FA→EN"}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
                <SpeakButton
                  text={card.front}
                  label={speakLabel}
                  size="sm"
                  className="mt-2 me-1 shrink-0"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
