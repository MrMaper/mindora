"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { logLangSessionAction } from "@/features/language/actions";
import {
  LANG_SKILLS,
  type LangSessionItem,
  type LangSkillStat,
  type LanguageProjectScope,
} from "@/features/language/types";
import { projectIdForLangCreate } from "@/features/language/active-project";
import { skillHasDrill } from "@/features/language/skill-drills";
import type { LangSkill } from "@/types/db";
import { formatJalaliShort } from "@/lib/life";
import { cn, formatNumber } from "@/lib/utils";

const PRESETS = [15, 30, 45, 60] as const;

function skillLabel(
  skill: LangSkill,
  t: ReturnType<typeof useTranslation>["language"],
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

function formatMinutes(
  total: number,
  language: "FA" | "EN",
  labels: { hours: string; minutes: string },
): string {
  const m = Math.max(0, Math.round(total));
  if (m < 60) {
    return `${formatNumber(m, language)} ${labels.minutes}`;
  }
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) {
    return `${formatNumber(h, language)} ${labels.hours}`;
  }
  return `${formatNumber(h, language)} ${labels.hours} ${formatNumber(rem, language)} ${labels.minutes}`;
}

export function LanguageSkillsPanel({
  skillStats,
  sessions,
  suggestSkill,
  weekMinutes,
  weeklyGoalMin,
  scope,
  onOpenVocab,
  onOpenListening,
  onOpenExams,
  onOpenDrill,
}: {
  skillStats: LangSkillStat[];
  sessions: LangSessionItem[];
  suggestSkill: LangSkill;
  weekMinutes: number;
  weeklyGoalMin: number;
  scope: LanguageProjectScope;
  onOpenVocab: () => void;
  onOpenListening: () => void;
  onOpenExams: () => void;
  onOpenDrill?: (skill: LangSkill) => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();

  const goal = weeklyGoalMin || 210;
  const perSkillGoal = Math.max(
    20,
    Math.round(goal / LANG_SKILLS.length),
  );
  const weekPct = Math.min(100, Math.round((weekMinutes / goal) * 100));

  const [expanded, setExpanded] = React.useState<LangSkill | null>(
    suggestSkill,
  );
  const [filter, setFilter] = React.useState<LangSkill | "ALL">("ALL");
  const [minutes, setMinutes] = React.useState("30");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setExpanded(suggestSkill);
  }, [suggestSkill]);

  const filteredSessions =
    filter === "ALL"
      ? sessions
      : sessions.filter(s => s.skill === filter);

  function resolveProjectId(): string | null | undefined {
    if (scope === "all") return projectIdForLangCreate();
    if (scope === "inbox") return null;
    return scope;
  }

  async function onLog(skill: LangSkill, mins?: number) {
    const value = mins ?? Number(minutes);
    if (!Number.isFinite(value) || value < 1) return;
    setPending(true);
    setMessage(null);
    const pid = resolveProjectId();
    const result = await logLangSessionAction({
      skill,
      minutes: value,
      note: note.trim() || undefined,
      ...(pid !== undefined ? { projectId: pid } : {}),
    });
    setPending(false);
    if (result.success) {
      setMessage(t.language.sessionSaved);
      setNote("");
      setFilter(skill);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  function toggleSkill(skill: LangSkill) {
    setExpanded(prev => (prev === skill ? null : skill));
    setFilter(skill);
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      {/* Week overview */}
      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-[11px] text-muted-foreground mb-3">
          {t.language.skillsHint}
        </p>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums leading-none">
              {formatMinutes(weekMinutes, language, {
                hours: t.language.hoursShort,
                minutes: t.language.minutes,
              })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t.language.weekMinutes}
            </p>
          </div>
          <div className="flex-1 min-w-[12rem]">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>{t.language.weekGoal}</span>
              <span className="tabular-nums">
                {formatNumber(weekPct, language)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${weekPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {t.language.skillsPerSkillGoal.replace(
                "{n}",
                formatNumber(perSkillGoal, language),
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">
              {t.language.suggestPractice}
            </p>
            <p className="text-sm font-semibold">
              {skillLabel(suggestSkill, t.language)}
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setExpanded(suggestSkill);
              setFilter(suggestSkill);
            }}
          >
            {t.language.skillsLogNow}
          </Button>
          {suggestSkill === "VOCAB" && (
            <Button size="sm" variant="subtle" onClick={onOpenVocab}>
              {t.language.vocabModeReview}
            </Button>
          )}
          {suggestSkill === "LISTENING" && (
            <Button size="sm" variant="subtle" onClick={onOpenListening}>
              {t.language.skillsOpenListening}
            </Button>
          )}
          {onOpenDrill && skillHasDrill(suggestSkill) && (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => onOpenDrill(suggestSkill)}
            >
              {t.language.skillsOpenDrill}
            </Button>
          )}
        </div>
      </section>

      {message && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 px-1">
          {message}
        </p>
      )}

      {/* Skill list */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <ul className="divide-y">
          {skillStats.map(stat => {
            const open = expanded === stat.skill;
            const pct = Math.min(
              100,
              Math.round((stat.minutes7d / perSkillGoal) * 100),
            );
            const weak = stat.skill === suggestSkill;
            return (
              <li key={stat.skill} className={cn(weak && "bg-primary/[0.03]")}>
                <button
                  type="button"
                  onClick={() => toggleSkill(stat.skill)}
                  aria-expanded={open}
                  className="w-full text-start px-4 py-3.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {skillLabel(stat.skill, t.language)}
                        </span>
                        {weak && (
                          <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
                            {t.language.skillsWeakBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {formatNumber(stat.sessionCount, language)}{" "}
                        {t.language.skillsSessions}
                        <span className="mx-1 opacity-40">·</span>
                        {t.language.skillsAllTime}:{" "}
                        {formatMinutes(stat.minutesTotal, language, {
                          hours: t.language.hoursShort,
                          minutes: t.language.minutes,
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {formatMinutes(stat.minutes7d, language, {
                        hours: t.language.hoursShort,
                        minutes: t.language.minutes,
                      })}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct >= 100 ? "bg-primary" : "bg-primary/70",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {formatNumber(pct, language)}%{" "}
                    {t.language.skillsOfWeeklyShare}
                  </p>
                </button>

                {open && (
                  <div className="px-4 pb-4 pt-0 space-y-3 border-t border-dashed bg-muted/20">
                    <p className="text-[11px] text-muted-foreground pt-3">
                      {t.language.skillsQuickLog}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map(p => (
                        <button
                          key={p}
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setMinutes(String(p));
                            void onLog(stat.skill, p);
                          }}
                          className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium tabular-nums hover:bg-accent disabled:opacity-50"
                        >
                          {formatNumber(p, language)} {t.language.minutes}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[6rem_1fr_auto] items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground">
                          {t.language.minutes}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={1440}
                          value={minutes}
                          onChange={e => setMinutes(e.target.value)}
                          className="mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">
                          {t.language.noteOptional}
                        </label>
                        <Textarea
                          rows={1}
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          className="mt-0.5 min-h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={pending}
                        onClick={() => void onLog(stat.skill)}
                      >
                        {t.language.saveSession}
                      </Button>
                    </div>
                    {stat.skill === "VOCAB" && (
                      <Button
                        size="sm"
                        variant="subtle"
                        className="w-full sm:w-auto"
                        onClick={onOpenVocab}
                      >
                        {t.language.skillsOpenVocab}
                      </Button>
                    )}
                    {stat.skill === "LISTENING" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full sm:w-auto"
                        onClick={onOpenListening}
                      >
                        {t.language.skillsOpenListening}
                      </Button>
                    )}
                    {onOpenDrill && skillHasDrill(stat.skill) && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full sm:w-auto"
                        onClick={() => onOpenDrill(stat.skill)}
                      >
                        {t.language.skillsOpenDrill}
                      </Button>
                    )}
                    {(stat.skill === "READING" ||
                      stat.skill === "GRAMMAR" ||
                      stat.skill === "LISTENING") && (
                      <Button
                        size="sm"
                        variant="subtle"
                        className="w-full sm:w-auto"
                        onClick={onOpenExams}
                      >
                        {t.language.skillsOpenExams}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* History */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {t.language.skillsHistory}
          </h3>
          <div className="flex gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[10px]",
                filter === "ALL"
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t.language.filterAllCards}
            </button>
            {LANG_SKILLS.map(sk => (
              <button
                key={sk}
                type="button"
                onClick={() => {
                  setFilter(sk);
                  setExpanded(sk);
                }}
                className={cn(
                  "shrink-0 rounded-md border px-2 py-1 text-[10px]",
                  filter === sk
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {skillLabel(sk, t.language)}
              </button>
            ))}
          </div>
        </div>
        {filteredSessions.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted-foreground text-center">
            {t.language.noSessions}
          </p>
        ) : (
          <ul className="divide-y max-h-[18rem] overflow-y-auto">
            {filteredSessions.map(s => (
              <li
                key={s.id}
                className="px-4 py-2.5 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {skillLabel(s.skill, t.language)}
                  </p>
                  {s.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {s.note}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatJalaliShort(s.practicedAt, language)}
                    {s.projectName ? ` · ${s.projectName}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium tabular-nums shrink-0">
                  {formatMinutes(s.minutes, language, {
                    hours: t.language.hoursShort,
                    minutes: t.language.minutes,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
