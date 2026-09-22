"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { LanguageProjectSwitcher } from "@/components/language/language-project-switcher";
import {
  createLangDocAction,
  logLangSessionAction,
  updateLangProfileAction,
} from "@/features/language/actions";
import { projectIdForLangCreate } from "@/features/language/active-project";
import { LanguageVocabPanel } from "@/components/language/language-vocab-panel";
import { LanguageSkillsPanel } from "@/components/language/language-skills-panel";
import { LanguageListeningPanel } from "@/components/language/language-listening-panel";
import { LanguageExamsPanel } from "@/components/language/language-exams-panel";
import { LanguageSkillDrillPanel } from "@/components/language/language-skill-drill-panel";
import { skillHasDrill } from "@/features/language/skill-drills";
import {
  LANG_SKILLS,
  type LanguageHubData,
  type LanguageProjectItem,
  type LanguageProjectScope,
  type LanguageTab,
} from "@/features/language/types";
import type { LangSkill } from "@/types/db";
import { formatJalaliShort } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";

interface LanguageCCProps {
  hub: LanguageHubData;
  scope: LanguageProjectScope;
  projects: LanguageProjectItem[];
}

function skillLabel(
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

export function LanguageCC(props: LanguageCCProps) {
  return (
    <Suspense fallback={<LanguageCCInner {...props} />}>
      <LanguageCCInner {...props} />
    </Suspense>
  );
}

function LanguageCCInner({ hub, scope, projects }: LanguageCCProps) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const filterParam = searchParams.get("filter");
  const initialTab: LanguageTab =
    tabParam === "vocab" ||
    tabParam === "listening" ||
    tabParam === "skills" ||
    tabParam === "exams" ||
    tabParam === "notes" ||
    tabParam === "today"
      ? tabParam
      : "today";
  const initialReviewFilter =
    filterParam === "hard" ? ("hard" as const) : ("all" as const);

  const [tab, setTab] = React.useState<LanguageTab>(initialTab);
  const [drillSkill, setDrillSkill] = React.useState<LangSkill | null>(null);
  const [skill, setSkill] = React.useState<LangSkill>(hub.suggestSkill);
  const [minutes, setMinutes] = React.useState("30");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const [targetExam, setTargetExam] = React.useState(
    hub.profile.targetExam ?? "MSRT",
  );
  const [targetScore, setTargetScore] = React.useState(
    hub.profile.targetScore ?? "",
  );
  const [examDate, setExamDate] = React.useState<Date | null>(
    hub.profile.examDate ? new Date(hub.profile.examDate) : null,
  );
  const [weeklyGoalMin, setWeeklyGoalMin] = React.useState(
    String(hub.profile.weeklyGoalMin),
  );

  React.useEffect(() => {
    const next = searchParams.get("tab");
    if (
      next === "vocab" ||
      next === "listening" ||
      next === "skills" ||
      next === "exams" ||
      next === "notes" ||
      next === "today"
    ) {
      setTab(next);
    }
  }, [searchParams]);

  function goTab(next: LanguageTab) {
    setDrillSkill(null);
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (next !== "vocab") params.delete("filter");
    params.delete("practice");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function openListeningTab() {
    goTab("listening");
  }

  React.useEffect(() => {
    setSkill(hub.suggestSkill);
    setTargetExam(hub.profile.targetExam ?? "MSRT");
    setTargetScore(hub.profile.targetScore ?? "");
    setExamDate(
      hub.profile.examDate ? new Date(hub.profile.examDate) : null,
    );
    setWeeklyGoalMin(String(hub.profile.weeklyGoalMin));
  }, [hub]);

  const goal = hub.profile.weeklyGoalMin || 210;
  const progress = Math.min(100, Math.round((hub.weekMinutes / goal) * 100));

  function resolveProjectId(): string | null | undefined {
    if (scope === "all") return projectIdForLangCreate();
    if (scope === "inbox") return null;
    return scope;
  }

  async function onLogSession() {
    setPending("session");
    setMessage(null);
    const pid = resolveProjectId();
    const result = await logLangSessionAction({
      skill,
      minutes: Number(minutes),
      note: note.trim() || undefined,
      ...(pid !== undefined ? { projectId: pid } : {}),
    });
    setPending(null);
    if (result.success) {
      setNote("");
      setMessage(t.language.sessionSaved);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onSaveProfile() {
    setPending("profile");
    setMessage(null);
    const result = await updateLangProfileAction({
      targetExam: targetExam === "CUSTOM" ? targetExam : targetExam,
      targetScore: targetScore || null,
      examDate: examDate ? examDate.toISOString() : null,
      weeklyGoalMin: Number(weeklyGoalMin),
    });
    setPending(null);
    if (result.success) {
      setMessage(t.language.profileSaved);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onCreateDoc(
    templateKey: "langSession" | "langErrorLog" | "langEssay",
  ) {
    setPending(templateKey);
    const pid = resolveProjectId();
    const result = await createLangDocAction({
      templateKey,
      ...(pid !== undefined ? { projectId: pid } : {}),
    });
    setPending(null);
    if (result.success && result.data?.id) {
      router.push(`/docs?id=${String(result.data.id)}`);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  const tabs: { id: LanguageTab; label: string }[] = [
    { id: "today", label: t.language.tabToday },
    { id: "skills", label: t.language.tabSkills },
    {
      id: "vocab",
      label:
        hub.vocab.dueCount > 0
          ? `${t.language.tabVocab} (${formatNumber(hub.vocab.dueCount, language)})`
          : t.language.tabVocab,
    },
    {
      id: "listening",
      label:
        hub.listeningClips.length > 0
          ? `${t.language.tabListening} (${formatNumber(hub.listeningClips.length, language)})`
          : t.language.tabListening,
    },
    { id: "exams", label: t.language.tabExams },
    { id: "notes", label: t.language.tabNotes },
  ];

  const examOptions = [
    { value: "MSRT", label: t.language.examMsrt },
    { value: "IELTS", label: t.language.examIelts },
    { value: "TOEFL", label: t.language.examToefl },
    { value: "TOLIMO", label: t.language.examTolimo },
    { value: "EPT", label: t.language.examEpt },
    { value: "CUSTOM", label: t.language.examCustom },
  ];

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-2">
        <h1 className="text-xl font-semibold">{t.language.hubTitle}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.language.hubHint}
        </p>
      </div>

      <LanguageProjectSwitcher scope={scope} projects={projects} />

      <div
        className="mb-3 flex flex-wrap gap-1.5 border-b pb-2"
        role="tablist"
        aria-label={t.language.hubTitle}
      >
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => goTab(item.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === item.id
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="mb-2 text-xs text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}

      {tab === "today" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-4 min-w-0">
            <section className="rounded-xl border bg-card p-4">
              <p className="text-[11px] text-muted-foreground mb-3">
                {t.language.todayHint}
              </p>
              <div className="flex flex-wrap items-end gap-4 mb-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatNumber(hub.weekMinutes, language)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.language.weekMinutes}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatNumber(hub.streakDays, language)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.language.streak}
                  </p>
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>{t.language.weekGoal}</span>
                    <span>
                      {formatNumber(hub.weekMinutes, language)} /{" "}
                      {formatNumber(goal, language)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-emerald-600/40 bg-emerald-600/5 px-3 py-2 mb-4 text-sm">
                <span className="text-muted-foreground">
                  {t.language.suggestPractice}:{" "}
                </span>
                <span className="font-medium">
                  {skillLabel(hub.suggestSkill, t.language)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => goTab("vocab")}
                className="mb-4 w-full rounded-lg border bg-background px-3 py-2.5 text-start text-sm hover:bg-muted/60 transition-colors"
              >
                <span className="font-medium">{t.language.vocabDue}</span>
                <span className="text-muted-foreground mx-1.5">·</span>
                <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatNumber(hub.vocab.dueCount, language)}
                </span>
                {hub.vocab.dueCount > 0 && (
                  <span className="ms-2 text-xs text-muted-foreground">
                    {t.language.vocabReviewCta}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={openListeningTab}
                className="mb-4 w-full rounded-lg border bg-background px-3 py-2.5 text-start text-sm hover:bg-muted/60 transition-colors"
              >
                <span className="font-medium">
                  {t.language.listeningTodayCta}
                </span>
                <span className="text-muted-foreground mx-1.5">·</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(hub.listeningClips.length, language)}
                </span>
              </button>

              {(hub.profile.examDate || hub.recentMocks[0]) && (
                <button
                  type="button"
                  onClick={() => goTab("exams")}
                  className="mb-4 w-full rounded-lg border bg-background px-3 py-2.5 text-start text-sm hover:bg-muted/60 transition-colors"
                >
                  <span className="font-medium">{t.language.tabExams}</span>
                  {hub.profile.examDate && (
                    <>
                      <span className="text-muted-foreground mx-1.5">·</span>
                      <span className="text-xs">
                        {formatJalaliShort(hub.profile.examDate, language)}
                      </span>
                    </>
                  )}
                  {hub.recentMocks[0]?.percent != null && (
                    <>
                      <span className="text-muted-foreground mx-1.5">·</span>
                      <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatNumber(hub.recentMocks[0].percent, language)}%
                      </span>
                    </>
                  )}
                </button>
              )}

              <h2 className="text-sm font-semibold mb-2">
                {t.language.logSession}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.tabSkills}
                  </label>
                  <select
                    className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2 text-sm"
                    value={skill}
                    onChange={e => setSkill(e.target.value as LangSkill)}
                  >
                    {LANG_SKILLS.map(sk => (
                      <option key={sk} value={sk}>
                        {skillLabel(sk, t.language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.minutes}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.noteOptional}
                  </label>
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  disabled={pending !== null}
                  loading={pending === "session"}
                  onClick={() => void onLogSession()}
                >
                  {t.language.saveSession}
                </Button>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">
                {t.language.recentSessions}
              </h2>
              {hub.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.language.noSessions}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {hub.sessions.map(s => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <span className="font-medium">
                          {skillLabel(s.skill, t.language)}
                        </span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span className="tabular-nums">
                          {formatNumber(s.minutes, language)}{" "}
                          {t.language.minutes}
                        </span>
                        {s.projectName && (
                          <span className="text-[11px] text-muted-foreground ms-2">
                            {s.projectName}
                          </span>
                        )}
                        {s.note && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {s.note}
                          </p>
                        )}
                      </div>
                      <time className="text-[11px] text-muted-foreground shrink-0">
                        {formatJalaliShort(s.practicedAt, language)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-3 min-w-0">
            <section className="rounded-xl border bg-card p-3">
              <h2 className="text-sm font-semibold mb-3">
                {t.language.targetExam}
              </h2>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.targetExam}
                  </label>
                  <select
                    className="mt-0.5 h-9 w-full rounded-lg border bg-background px-2 text-sm"
                    value={
                      examOptions.some(o => o.value === targetExam)
                        ? targetExam
                        : "CUSTOM"
                    }
                    onChange={e => setTargetExam(e.target.value)}
                  >
                    {examOptions.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.targetScore}
                  </label>
                  <Input
                    value={targetScore}
                    onChange={e => setTargetScore(e.target.value)}
                    placeholder="50+"
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
                <div>
                  <label className="text-[11px] text-muted-foreground">
                    {t.language.weeklyGoalMin}
                  </label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={weeklyGoalMin}
                    onChange={e => setWeeklyGoalMin(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={pending !== null}
                  loading={pending === "profile"}
                  onClick={() => void onSaveProfile()}
                >
                  {t.language.saveProfile}
                </Button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {tab === "skills" && drillSkill && skillHasDrill(drillSkill) ? (
        <LanguageSkillDrillPanel
          skill={drillSkill}
          projectId={
            scope === "all" ? undefined : scope === "inbox" ? null : scope
          }
          onClose={() => setDrillSkill(null)}
        />
      ) : null}

      {tab === "skills" && !drillSkill && (
        <LanguageSkillsPanel
          skillStats={hub.skillStats}
          sessions={hub.sessions}
          suggestSkill={hub.suggestSkill}
          weekMinutes={hub.weekMinutes}
          weeklyGoalMin={hub.profile.weeklyGoalMin}
          scope={scope}
          onOpenVocab={() => goTab("vocab")}
          onOpenListening={openListeningTab}
          onOpenExams={() => goTab("exams")}
          onOpenDrill={skill => setDrillSkill(skill)}
        />
      )}

      {tab === "vocab" && (
        <LanguageVocabPanel
          dueCards={hub.dueCards}
          recentCards={hub.recentCards}
          hardCards={hub.hardCards}
          stats={hub.vocab}
          decks={hub.vocabDecks}
          initialReviewFilter={initialReviewFilter}
          projectId={
            scope === "all" ? undefined : scope === "inbox" ? null : scope
          }
        />
      )}

      {tab === "listening" && (
        <LanguageListeningPanel
          clips={hub.listeningClips}
          projectId={
            scope === "all" ? undefined : scope === "inbox" ? null : scope
          }
        />
      )}

      {tab === "exams" && (
        <LanguageExamsPanel
          tracks={hub.examTracks}
          recentMocks={hub.recentMocks}
          profileExam={hub.profile.targetExam}
          projectId={
            scope === "all" ? undefined : scope === "inbox" ? null : scope
          }
        />
      )}

      {tab === "notes" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <section className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold">{t.language.openDocs}</h2>
              <Link
                href="/docs"
                className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {t.docs.title}
              </Link>
            </div>
            {hub.recentDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.docs.emptyList}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {hub.recentDocs.map(doc => (
                  <li key={doc.id}>
                    <Link
                      href={`/docs?id=${doc.id}`}
                      className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="font-medium truncate">{doc.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                        {formatNumber(doc.wordCount, language)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="rounded-xl border bg-card p-3">
            <h2 className="text-sm font-semibold mb-2">
              {t.language.startNote}
            </h2>
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                variant="subtle"
                disabled={pending !== null}
                onClick={() => void onCreateDoc("langSession")}
              >
                {t.language.startNote}
              </Button>
              <Button
                size="sm"
                variant="subtle"
                disabled={pending !== null}
                onClick={() => void onCreateDoc("langErrorLog")}
              >
                {t.language.tplErrorLog}
              </Button>
              <Button
                size="sm"
                variant="subtle"
                disabled={pending !== null}
                onClick={() => void onCreateDoc("langEssay")}
              >
                {t.language.tplEssay}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
