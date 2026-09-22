"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import {
  abandonMockAttemptAction,
  createExamTrackAction,
  deleteExamTrackAction,
  ensureDefaultExamTrackAction,
  saveMockAttemptAction,
  startMockAttemptAction,
} from "@/features/language/actions";
import {
  EXAM_TEMPLATES,
  getExamTemplate,
  type ExamKindKey,
  type MockSectionResult,
} from "@/features/language/exam-templates";
import {
  examSectionHasBank,
  pickExamSectionItems,
  type ExamBankItem,
} from "@/features/language/exam-bank";
import { countWords } from "@/features/language/skill-drills";
import { SpeakButton } from "@/components/language/speak-button";
import type {
  ExamTrackItem,
  MockAttemptItem,
} from "@/features/language/types";
import type { LangSkill } from "@/types/db";
import { formatJalaliShort } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";

function formatTimer(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function skillShort(
  skill: LangSkill,
  t: {
    skillListening: string;
    skillReading: string;
    skillWriting: string;
    skillSpeaking: string;
    skillGrammar: string;
    skillVocab: string;
    skillPronunciation: string;
  },
): string {
  switch (skill) {
    case "LISTENING":
      return t.skillListening;
    case "READING":
      return t.skillReading;
    case "WRITING":
      return t.skillWriting;
    case "SPEAKING":
      return t.skillSpeaking;
    case "GRAMMAR":
      return t.skillGrammar;
    case "VOCAB":
      return t.skillVocab;
    case "PRONUNCIATION":
      return t.skillPronunciation;
    default:
      return skill;
  }
}

type RunnerState = {
  trackId: string;
  attemptId: string | null;
  trackName: string;
  kind: ExamKindKey;
  sectionIndex: number;
  results: MockSectionResult[];
  startedAt: number;
  sectionStartedAt: number;
  remainingSec: number;
  /** Legacy self-score when no bank */
  correctInput: string;
  note: string;
  finished: boolean;
  scorecard: {
    percent: number;
    totalCorrect: number;
    totalQuestions: number;
    weakestSkill: LangSkill | null;
    sections: MockSectionResult[];
    autoScored: boolean;
  } | null;
  /** Bank-backed section runner */
  bankItems: ExamBankItem[];
  bankIndex: number;
  bankAnswers: Record<string, string>;
  bankCorrect: number;
  promptText: string;
  useBank: boolean;
};

export function LanguageExamsPanel({
  tracks,
  recentMocks,
  projectId,
  profileExam,
}: {
  tracks: ExamTrackItem[];
  recentMocks: MockAttemptItem[];
  projectId?: string | null;
  profileExam?: string | null;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [kind, setKind] = React.useState<ExamKindKey>(
    (profileExam?.toUpperCase() as ExamKindKey) || "MSRT",
  );
  const [name, setName] = React.useState("");
  const [targetScore, setTargetScore] = React.useState("");
  const [examDate, setExamDate] = React.useState<Date | null>(null);
  const [runner, setRunner] = React.useState<RunnerState | null>(null);
  const [viewMock, setViewMock] = React.useState<MockAttemptItem | null>(
    null,
  );

  const template = getExamTemplate(kind);

  React.useEffect(() => {
    if (!(kind in EXAM_TEMPLATES)) setKind("MSRT");
  }, [kind]);

  React.useEffect(() => {
    if (!runner || runner.finished) return;
    const id = window.setInterval(() => {
      setRunner(r => {
        if (!r || r.finished) return r;
        return { ...r, remainingSec: Math.max(0, r.remainingSec - 1) };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [runner?.trackId, runner?.sectionIndex, runner?.finished]);

  async function onCreateTrack() {
    setPending(true);
    const result = await createExamTrackAction({
      kind,
      name: name || undefined,
      targetScore: targetScore || template.defaultTarget,
      examDate: examDate ? examDate.toISOString() : null,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (result.success) {
      setName("");
      setTargetScore("");
      setExamDate(null);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onEnsureAndStart() {
    setPending(true);
    let trackId = tracks[0]?.id;
    if (!trackId) {
      const ensured = await ensureDefaultExamTrackAction({
        ...(projectId !== undefined ? { projectId } : {}),
      });
      if (!ensured.success || !ensured.data?.id) {
        setPending(false);
        window.alert(ensured.error ?? "خطا");
        return;
      }
      trackId = String(ensured.data.id);
      router.refresh();
    }
    const track =
      tracks.find(x => x.id === trackId) ??
      ({
        id: trackId!,
        kind: kind,
        name: getExamTemplate(kind).nameFa,
      } as ExamTrackItem);

    setPending(false);
    await startRunner(track.id, track.name, track.kind);
  }

  async function startRunner(
    trackId: string,
    trackName: string,
    trackKind: ExamKindKey,
  ) {
    const tpl = getExamTemplate(trackKind);
    const first = tpl.sections[0];
    setViewMock(null);
    setPending(true);
    const started = await startMockAttemptAction({
      trackId,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (!started.success) {
      window.alert(started.error ?? "خطا");
      return;
    }
    setRunner({
      trackId,
      attemptId: String(started.data?.id ?? "") || null,
      trackName,
      kind: trackKind,
      sectionIndex: 0,
      results: [],
      startedAt: Date.now(),
      sectionStartedAt: Date.now(),
      remainingSec: (first?.timeMin ?? 20) * 60,
      correctInput: "",
      note: "",
      finished: false,
      scorecard: null,
      bankItems: first
        ? pickExamSectionItems(trackKind, first.key, first.questionCount)
        : [],
      bankIndex: 0,
      bankAnswers: {},
      bankCorrect: 0,
      promptText: "",
      useBank: first
        ? examSectionHasBank(trackKind, first.key)
        : false,
    });
  }

  async function abortRunner() {
    if (runner?.attemptId && !runner.finished) {
      await abandonMockAttemptAction(runner.attemptId);
    }
    setRunner(null);
    router.refresh();
  }

  function loadSection(kindKey: ExamKindKey, sectionIndex: number, base: RunnerState) {
    const tpl = getExamTemplate(kindKey);
    const section = tpl.sections[sectionIndex];
    if (!section) return base;
    const useBank = examSectionHasBank(kindKey, section.key);
    const bankItems = useBank
      ? pickExamSectionItems(kindKey, section.key, section.questionCount)
      : [];
    return {
      ...base,
      sectionIndex,
      sectionStartedAt: Date.now(),
      remainingSec: (section.timeMin ?? 20) * 60,
      correctInput: "",
      bankItems,
      bankIndex: 0,
      bankAnswers: {},
      bankCorrect: 0,
      promptText: "",
      useBank,
    };
  }

  async function completeSection() {
    if (!runner || runner.finished) return;
    if (runner.useBank && runner.bankItems.length > 0) {
      // Finish remaining prompts/MCQs as unanswered (wrong / incomplete)
      void completeSectionFromBank(runner.bankAnswers);
      return;
    }

    const tpl = getExamTemplate(runner.kind);
    const section = tpl.sections[runner.sectionIndex];
    if (!section) return;

    const correct = Math.min(
      section.questionCount,
      Math.max(0, Math.round(Number(runner.correctInput) || 0)),
    );
    const elapsed = Math.round(
      (Date.now() - runner.sectionStartedAt) / 1000,
    );
    const result: MockSectionResult = {
      key: section.key,
      skill: section.skill,
      labelFa: section.labelFa,
      labelEn: section.labelEn,
      questionCount: section.questionCount,
      correct,
      timeSec: Math.min(elapsed, section.timeMin * 60 + 3600),
      timeLimitMin: section.timeMin,
    };
    const results = [...runner.results, result];
    const nextIndex = runner.sectionIndex + 1;

    if (nextIndex >= tpl.sections.length) {
      setPending(true);
      const durationSec = Math.round((Date.now() - runner.startedAt) / 1000);
      const save = await saveMockAttemptAction({
        trackId: runner.trackId,
        sections: results,
        note: runner.note || undefined,
        durationSec,
        ...(runner.attemptId ? { attemptId: runner.attemptId } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
      });
      setPending(false);
      if (!save.success) {
        window.alert(save.error ?? "خطا");
        return;
      }
      setRunner({
        ...runner,
        results,
        finished: true,
        scorecard: {
          percent: Number(save.data?.percent ?? 0),
          totalCorrect: results.reduce((a, s) => a + s.correct, 0),
          totalQuestions: results.reduce((a, s) => a + s.questionCount, 0),
          weakestSkill: (save.data?.weakestSkill as LangSkill) ?? null,
          sections: results,
          autoScored: false,
        },
      });
      router.refresh();
      return;
    }

    setRunner(
      loadSection(runner.kind, nextIndex, {
        ...runner,
        results,
      }),
    );
  }

  function scoreBankAnswers(
    items: ExamBankItem[],
    answers: Record<string, string>,
  ): number {
    let correct = 0;
    for (const q of items) {
      if (q.kind === "mcq") {
        if (answers[q.id] === q.answerId) correct += 1;
      } else if (q.minWords) {
        if (countWords(answers[q.id] ?? "") >= q.minWords) correct += 1;
      } else if (answers[q.id] === "done") {
        correct += 1;
      }
    }
    return correct;
  }

  function advanceBankQuestion() {
    if (!runner || !runner.useBank) return;
    const q = runner.bankItems[runner.bankIndex];
    if (!q) return;

    const answers = { ...runner.bankAnswers };

    if (q.kind === "mcq") {
      if (!answers[q.id]) {
        window.alert(t.language.drillPickAnswer);
        return;
      }
    } else if (q.minWords) {
      if (countWords(runner.promptText) < q.minWords) {
        window.alert(
          t.language.drillMinWords.replace(
            "{n}",
            formatNumber(q.minWords, language),
          ),
        );
        return;
      }
      answers[q.id] = runner.promptText;
    } else {
      answers[q.id] = "done";
    }

    if (runner.bankIndex >= runner.bankItems.length - 1) {
      void completeSectionFromBank(answers);
      return;
    }

    setRunner({
      ...runner,
      bankIndex: runner.bankIndex + 1,
      bankAnswers: answers,
      bankCorrect: scoreBankAnswers(runner.bankItems, answers),
      promptText: "",
    });
  }

  async function completeSectionFromBank(answers: Record<string, string>) {
    if (!runner) return;
    const tpl = getExamTemplate(runner.kind);
    const section = tpl.sections[runner.sectionIndex];
    if (!section) return;

    const correct = scoreBankAnswers(runner.bankItems, answers);
    const elapsed = Math.round(
      (Date.now() - runner.sectionStartedAt) / 1000,
    );
    const result: MockSectionResult = {
      key: section.key,
      skill: section.skill,
      labelFa: section.labelFa,
      labelEn: section.labelEn,
      questionCount: runner.bankItems.length,
      correct,
      timeSec: Math.min(elapsed, section.timeMin * 60 + 3600),
      timeLimitMin: section.timeMin,
    };
    const results = [...runner.results, result];
    const nextIndex = runner.sectionIndex + 1;

    if (nextIndex >= tpl.sections.length) {
      setPending(true);
      const durationSec = Math.round((Date.now() - runner.startedAt) / 1000);
      const save = await saveMockAttemptAction({
        trackId: runner.trackId,
        sections: results,
        note: runner.note || undefined,
        durationSec,
        ...(runner.attemptId ? { attemptId: runner.attemptId } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
      });
      setPending(false);
      if (!save.success) {
        window.alert(save.error ?? "خطا");
        return;
      }
      setRunner({
        ...runner,
        results,
        bankAnswers: answers,
        bankCorrect: correct,
        finished: true,
        scorecard: {
          percent: Number(save.data?.percent ?? 0),
          totalCorrect: results.reduce((a, s) => a + s.correct, 0),
          totalQuestions: results.reduce((a, s) => a + s.questionCount, 0),
          weakestSkill: (save.data?.weakestSkill as LangSkill) ?? null,
          sections: results,
          autoScored: true,
        },
      });
      router.refresh();
      return;
    }

    setRunner(
      loadSection(runner.kind, nextIndex, {
        ...runner,
        results,
        bankAnswers: answers,
        bankCorrect: correct,
      }),
    );
  }

  async function onDeleteTrack(id: string) {
    if (!window.confirm(t.language.deleteTrackConfirm)) return;
    setPending(true);
    const result = await deleteExamTrackAction(id);
    setPending(false);
    if (result.success) router.refresh();
    else if (result.error) window.alert(result.error);
  }

  if (runner) {
    const tpl = getExamTemplate(runner.kind);
    const section = tpl.sections[runner.sectionIndex];
    const overtime = runner.remainingSec <= 0;

    if (runner.finished && runner.scorecard) {
      const sc = runner.scorecard;
      return (
        <section className="rounded-xl border bg-card p-4 max-w-xl">
          <h2 className="text-lg font-semibold mb-1">
            {t.language.mockScorecard}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {runner.trackName}
          </p>
          <p className="text-4xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 mb-1">
            {formatNumber(sc.percent, language)}%
          </p>
          <p className="text-[11px] text-muted-foreground mb-1">
            {sc.autoScored
              ? t.language.mockBankScoreHint
              : t.language.mockSelfScoreHint}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {formatNumber(sc.totalCorrect, language)} /{" "}
            {formatNumber(sc.totalQuestions, language)}
          </p>
          {sc.weakestSkill && (
            <p className="text-sm mb-4 rounded-lg bg-amber-500/10 px-3 py-2">
              {t.language.weakestSection}:{" "}
              <strong>{skillShort(sc.weakestSkill, t.language)}</strong>
            </p>
          )}
          <ul className="flex flex-col gap-2 mb-4">
            {sc.sections.map(s => {
              const pct =
                s.questionCount > 0
                  ? Math.round((s.correct / s.questionCount) * 100)
                  : 0;
              return (
                <li key={s.key} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>
                      {language === "FA" ? s.labelFa : s.labelEn}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(s.correct, language)}/
                      {formatNumber(s.questionCount, language)} ·{" "}
                      {formatNumber(pct, language)}% ·{" "}
                      {formatTimer(s.timeSec)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setRunner(null)}>
              {t.language.backToExams}
            </Button>
            <Button
              size="sm"
              variant="subtle"
              onClick={() =>
                void startRunner(runner.trackId, runner.trackName, runner.kind)
              }
            >
              {t.language.retakeMock}
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-xl border bg-card p-4 max-w-xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {runner.trackName} · {t.language.mockInProgress}
            </p>
            <h2 className="text-base font-semibold">
              {language === "FA" ? section?.labelFa : section?.labelEn}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.language.sectionOf
                .replace(
                  "{current}",
                  formatNumber(runner.sectionIndex + 1, language),
                )
                .replace(
                  "{total}",
                  formatNumber(tpl.sections.length, language),
                )}{" "}
              · {formatNumber(section?.questionCount ?? 0, language)}{" "}
              {t.language.questions}
            </p>
          </div>
          <div
            className={cn(
              "text-2xl font-semibold tabular-nums font-mono",
              overtime && "text-destructive",
            )}
          >
            {formatTimer(runner.remainingSec)}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mb-3">
          {runner.useBank
            ? t.language.mockBankHint
            : t.language.mockTimerHint}
        </p>

        {runner.useBank && runner.bankItems.length > 0 ? (
          <div className="space-y-3 mb-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {t.language.questions}:{" "}
              {formatNumber(runner.bankIndex + 1, language)} /{" "}
              {formatNumber(runner.bankItems.length, language)}
            </p>
            {(() => {
              const q = runner.bankItems[runner.bankIndex];
              if (!q) return null;
              if (q.kind === "mcq") {
                return (
                  <>
                    {q.passage && (
                      <p className="text-sm leading-relaxed rounded-lg bg-muted/40 p-3 whitespace-pre-wrap">
                        {q.passage}
                      </p>
                    )}
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <ul className="flex flex-col gap-1.5">
                      {q.choices.map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setRunner(r =>
                                r
                                  ? {
                                      ...r,
                                      bankAnswers: {
                                        ...r.bankAnswers,
                                        [q.id]: c.id,
                                      },
                                    }
                                  : r,
                              )
                            }
                            className={cn(
                              "w-full text-start rounded-lg border px-3 py-2 text-sm",
                              runner.bankAnswers[q.id] === c.id &&
                                "border-primary bg-primary/5",
                            )}
                          >
                            {c.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                );
              }
              return (
                <>
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-medium flex-1">{q.prompt}</p>
                    {q.skill === "SPEAKING" && (
                      <SpeakButton
                        text={q.prompt}
                        label={t.language.speakPrompt}
                      />
                    )}
                  </div>
                  {q.minWords ? (
                    <>
                      <Textarea
                        rows={6}
                        value={runner.promptText}
                        onChange={e =>
                          setRunner(r =>
                            r ? { ...r, promptText: e.target.value } : r,
                          )
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {formatNumber(countWords(runner.promptText), language)}{" "}
                        {t.language.drillWords}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
                      {t.language.drillSpeakHint}
                    </p>
                  )}
                </>
              );
            })()}
            {runner.sectionIndex === tpl.sections.length - 1 &&
              runner.bankIndex >= runner.bankItems.length - 1 && (
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.mockNote}
                  </label>
                  <Textarea
                    rows={2}
                    value={runner.note}
                    onChange={e =>
                      setRunner(r => (r ? { ...r, note: e.target.value } : r))
                    }
                  />
                </div>
              )}
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="text-[11px] text-muted-foreground">
                {t.language.correctAnswers}
              </label>
              <Input
                type="number"
                min={0}
                max={section?.questionCount ?? 100}
                value={runner.correctInput}
                onChange={e =>
                  setRunner(r =>
                    r ? { ...r, correctInput: e.target.value } : r,
                  )
                }
                placeholder={`0 – ${section?.questionCount ?? 0}`}
              />
            </div>
            {runner.sectionIndex === tpl.sections.length - 1 && (
              <div className="mb-3">
                <label className="text-[11px] text-muted-foreground">
                  {t.language.mockNote}
                </label>
                <Textarea
                  rows={2}
                  value={runner.note}
                  onChange={e =>
                    setRunner(r => (r ? { ...r, note: e.target.value } : r))
                  }
                />
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            loading={pending}
            onClick={() =>
              runner.useBank && runner.bankItems.length > 0
                ? advanceBankQuestion()
                : void completeSection()
            }
          >
            {runner.useBank && runner.bankItems.length > 0
              ? runner.bankIndex >= runner.bankItems.length - 1
                ? runner.sectionIndex >= tpl.sections.length - 1
                  ? t.language.finishMock
                  : t.language.nextSection
                : t.language.drillNext
              : runner.sectionIndex >= tpl.sections.length - 1
                ? t.language.finishMock
                : t.language.nextSection}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t.language.abortMockConfirm)) {
                void abortRunner();
              }
            }}
          >
            {t.language.abortMock}
          </Button>
        </div>
      </section>
    );
  }

  if (viewMock) {
    return (
      <section className="rounded-xl border bg-card p-4 max-w-xl">
        <h2 className="text-lg font-semibold mb-1">
          {t.language.mockScorecard}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          {viewMock.trackName} ·{" "}
          {viewMock.finishedAt
            ? formatJalaliShort(viewMock.finishedAt, language)
            : ""}
        </p>
        <p className="text-3xl font-semibold tabular-nums mb-4">
          {formatNumber(viewMock.percent ?? 0, language)}%
        </p>
        <ul className="flex flex-col gap-2 mb-4">
          {viewMock.sections.map(s => {
            const pct =
              s.questionCount > 0
                ? Math.round((s.correct / s.questionCount) * 100)
                : 0;
            return (
              <li
                key={s.key}
                className="flex justify-between text-sm gap-2"
              >
                <span>{language === "FA" ? s.labelFa : s.labelEn}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(s.correct, language)}/
                  {formatNumber(s.questionCount, language)} ·{" "}
                  {formatNumber(pct, language)}%
                </span>
              </li>
            );
          })}
        </ul>
        {viewMock.weakestSkill && (
          <p className="text-sm mb-4">
            {t.language.weakestSection}:{" "}
            <strong>
              {skillShort(viewMock.weakestSkill, t.language)}
            </strong>
          </p>
        )}
        <Button size="sm" variant="subtle" onClick={() => setViewMock(null)}>
          {t.language.backToExams}
        </Button>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-4 min-w-0">
        <section className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold">
                {t.language.examTracks}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t.language.examTracksHint}
              </p>
            </div>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => void onEnsureAndStart()}
            >
              {t.language.startMock}
            </Button>
          </div>

          {tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.language.noTracks}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tracks.map(track => (
                <li
                  key={track.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {track.kind}
                      {track.targetScore
                        ? ` · ${t.language.targetScore}: ${track.targetScore}`
                        : ""}
                      {track.lastPercent != null
                        ? ` · ${t.language.lastMock}: ${formatNumber(track.lastPercent, language)}%`
                        : ""}
                      {track.examDate
                        ? ` · ${formatJalaliShort(track.examDate, language)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={pending}
                      onClick={() =>
                        void startRunner(track.id, track.name, track.kind)
                      }
                    >
                      {t.language.startMock}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => void onDeleteTrack(track.id)}
                    >
                      {t.language.deleteTrack}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">
            {t.language.recentMocks}
          </h2>
          {recentMocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.language.noMocks}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentMocks.map(m => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-start hover:bg-muted"
                    onClick={() => setViewMock(m)}
                  >
                    <span className="truncate font-medium">
                      {m.trackName}
                    </span>
                    <span className="tabular-nums text-muted-foreground shrink-0">
                      {formatNumber(m.percent ?? 0, language)}%
                      {m.finishedAt
                        ? ` · ${formatJalaliShort(m.finishedAt, language)}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="rounded-xl border bg-card p-3 h-fit">
        <h2 className="text-sm font-semibold mb-2">
          {t.language.newTrack}
        </h2>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">
              {t.language.targetExam}
            </label>
            <select
              className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2 text-sm"
              value={kind}
              onChange={e => setKind(e.target.value as ExamKindKey)}
            >
              {(Object.keys(EXAM_TEMPLATES) as ExamKindKey[]).map(k => (
                <option key={k} value={k}>
                  {language === "FA"
                    ? EXAM_TEMPLATES[k].nameFa
                    : EXAM_TEMPLATES[k].nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              {t.language.trackName}
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={template.nameFa}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              {t.language.targetScore}
            </label>
            <Input
              value={targetScore}
              onChange={e => setTargetScore(e.target.value)}
              placeholder={template.defaultTarget}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              {t.language.examDate}
            </label>
            <DatePicker
              mode="single"
              language={language}
              value={examDate}
              onChange={setExamDate}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {kind === "MSRT"
              ? t.language.msrtSectionsHint
              : t.language.mockSelfScoreHint}
          </p>
          <Button
            size="sm"
            disabled={pending}
            loading={pending}
            onClick={() => void onCreateTrack()}
          >
            {t.language.createTrack}
          </Button>
        </div>
      </aside>
    </div>
  );
}
