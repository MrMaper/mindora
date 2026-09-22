"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import {
  completeListeningSessionAction,
  createListeningClipAction,
  deleteListeningClipAction,
  installListeningStartersAction,
  markListeningPlayedAction,
} from "@/features/language/actions";
import { LISTENING_STARTERS } from "@/features/language/listening-starters";
import { youtubeEmbedUrl } from "@/features/language/listening-source";
import { normalizeAnswer } from "@/features/language/answer-match";
import type { LangListeningClipItem } from "@/features/language/types";
import { cn, formatNumber } from "@/lib/utils";

function clipTopic(clip: LangListeningClipItem): string | null {
  if (!clip.notes) return null;
  const head = clip.notes.split("·")[0]?.trim();
  return head || null;
}

function dictationScorePct(input: string, expected: string): number {
  const words = normalizeAnswer(input).split(" ").filter(Boolean);
  const target = normalizeAnswer(expected)
    .split(" ")
    .filter(Boolean);
  if (!words.length || !target.length) return 0;
  const set = new Set(target);
  let hit = 0;
  for (const w of words) {
    if (set.has(w)) hit += 1;
  }
  return Math.min(100, Math.round((hit / target.length) * 100));
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LanguageListeningPanel({
  clips,
  projectId,
  onBack,
}: {
  clips: LangListeningClipItem[];
  projectId?: string | null;
  onBack?: () => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();

  const [activeId, setActiveId] = React.useState<string | null>(
    clips[0]?.id ?? null,
  );
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [transcriptInput, setTranscriptInput] = React.useState("");
  const [dictation, setDictation] = React.useState("");
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [topicFilter, setTopicFilter] = React.useState<string>("ALL");

  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const startedAt = React.useRef<number | null>(null);
  const baseElapsed = React.useRef(0);

  const active = clips.find(c => c.id === activeId) ?? null;
  const installedKeys = new Set(
    clips.map(c => c.starterKey).filter(Boolean) as string[],
  );
  const missingStarters = LISTENING_STARTERS.filter(
    s => !installedKeys.has(s.key),
  );
  const topics = Array.from(
    new Set([
      ...LISTENING_STARTERS.map(s => s.topic),
      ...clips.map(c => clipTopic(c)).filter(Boolean),
    ]),
  ).sort() as string[];

  const filteredMissing =
    topicFilter === "ALL"
      ? missingStarters
      : missingStarters.filter(s => s.topic === topicFilter);

  const filteredClips =
    topicFilter === "ALL"
      ? clips
      : clips.filter(c => clipTopic(c) === topicFilter);

  React.useEffect(() => {
    if (activeId && !clips.some(c => c.id === activeId)) {
      setActiveId(clips[0]?.id ?? null);
    } else if (!activeId && clips[0]) {
      setActiveId(clips[0].id);
    }
  }, [clips, activeId]);

  React.useEffect(() => {
    setDictation("");
    setShowTranscript(false);
    setScore(null);
    setRunning(false);
    setElapsed(0);
    startedAt.current = null;
    baseElapsed.current = 0;
    const clip = clips.find(c => c.id === activeId);
    if (clip?.sourceType === "YOUTUBE") {
      startedAt.current = Date.now();
      setRunning(true);
      void markListeningPlayedAction(clip.id);
    }
    // Intentionally only when the active clip changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clips refresh shouldn't reset timer
  }, [activeId]);

  React.useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => {
      if (startedAt.current == null) return;
      setElapsed(
        baseElapsed.current +
          Math.floor((Date.now() - startedAt.current) / 1000),
      );
    }, 250);
    return () => window.clearInterval(tick);
  }, [running]);

  function startTimer() {
    if (running) return;
    startedAt.current = Date.now();
    setRunning(true);
    if (active) {
      void markListeningPlayedAction(active.id);
    }
  }

  function pauseTimer() {
    if (!running || startedAt.current == null) return;
    baseElapsed.current += Math.floor(
      (Date.now() - startedAt.current) / 1000,
    );
    startedAt.current = null;
    setRunning(false);
    setElapsed(baseElapsed.current);
  }

  function checkDictation() {
    if (!active?.transcript) {
      setScore(null);
      return;
    }
    setScore(dictationScorePct(dictation, active.transcript));
    setShowTranscript(true);
  }

  async function onInstallStarters() {
    setPending("starters");
    setMessage(null);
    const result = await installListeningStartersAction(
      projectId !== undefined ? { projectId } : undefined,
    );
    setPending(null);
    if (result.success) {
      setMessage(t.language.listeningStartersAdded);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onAddClip() {
    setPending("add");
    setMessage(null);
    const result = await createListeningClipAction({
      title: title.trim() || t.language.listeningUntitled,
      url,
      level: level.trim() || undefined,
      transcript: transcriptInput.trim() || undefined,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(null);
    if (result.success) {
      setTitle("");
      setUrl("");
      setLevel("");
      setTranscriptInput("");
      setMessage(t.language.listeningClipAdded);
      if (result.data?.id) setActiveId(String(result.data.id));
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onFinish() {
    if (!active) return;
    pauseTimer();
    const mins = Math.max(1, Math.round(elapsed / 60) || 1);
    const dictScore =
      active.transcript && dictation.trim()
        ? dictationScorePct(dictation, active.transcript)
        : score ?? undefined;
    setPending("finish");
    setMessage(null);
    const result = await completeListeningSessionAction({
      clipId: active.id,
      minutes: mins,
      note: `${active.title}`,
      dictationScore: dictScore,
    });
    setPending(null);
    if (result.success) {
      setMessage(
        t.language.listeningSessionSaved.replace(
          "{n}",
          formatNumber(mins, language),
        ),
      );
      setRunning(false);
      setElapsed(0);
      baseElapsed.current = 0;
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t.language.listeningDeleteConfirm)) return;
    setPending(`del-${id}`);
    const result = await deleteListeningClipAction(id);
    setPending(null);
    if (result.success) {
      if (activeId === id) setActiveId(null);
      router.refresh();
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">
            {t.language.listeningTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.language.listeningHint}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
            {t.language.listeningCatalogCount.replace(
              "{n}",
              formatNumber(LISTENING_STARTERS.length, language),
            )}
          </p>
        </div>
        {onBack && (
          <Button size="sm" variant="subtle" onClick={onBack}>
            {t.language.listeningBack}
          </Button>
        )}
      </div>

      {message && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400 px-1">
          {message}
        </p>
      )}

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground">
            {t.language.listeningTopicFilter}
          </span>
          <button
            type="button"
            onClick={() => setTopicFilter("ALL")}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px]",
              topicFilter === "ALL"
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.language.listeningTopicAll}
          </button>
          {topics.map(topic => (
            <button
              key={topic}
              type="button"
              onClick={() => setTopicFilter(topic)}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px]",
                topicFilter === topic
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {missingStarters.length > 0 && (
        <section className="rounded-2xl border bg-card p-4">
          <p className="text-sm font-medium mb-1">
            {t.language.listeningStarters}
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">
            {t.language.listeningStartersHint}
          </p>
          <ul className="mb-3 max-h-40 overflow-y-auto space-y-1.5 text-xs text-muted-foreground">
            {filteredMissing.map(s => (
              <li key={s.key} className="flex flex-wrap gap-x-1.5">
                <span className="font-medium text-foreground">{s.title}</span>
                <span className="opacity-40">·</span>
                <span>{s.level}</span>
                <span className="opacity-40">·</span>
                <span>{s.topic}</span>
              </li>
            ))}
            {filteredMissing.length === 0 && (
              <li>{t.language.listeningTopicAll}</li>
            )}
          </ul>
          <Button
            size="sm"
            variant="primary"
            disabled={pending === "starters"}
            onClick={() => void onInstallStarters()}
          >
            {t.language.listeningInstallStarters}
            <span className="ms-1.5 tabular-nums opacity-80">
              ({formatNumber(missingStarters.length, language)})
            </span>
          </Button>
        </section>
      )}

      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">{t.language.listeningAdd}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder={t.language.listeningTitleField}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            placeholder={t.language.listeningLevelField}
            value={level}
            onChange={e => setLevel(e.target.value)}
          />
        </div>
        <Input
          placeholder={t.language.listeningUrlField}
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <Textarea
          rows={2}
          placeholder={t.language.listeningTranscriptField}
          value={transcriptInput}
          onChange={e => setTranscriptInput(e.target.value)}
        />
        <Button
          size="sm"
          variant="subtle"
          disabled={pending === "add" || !url.trim()}
          onClick={() => void onAddClip()}
        >
          {t.language.listeningSaveClip}
        </Button>
      </section>

      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card overflow-hidden">
          <p className="px-3 py-2 text-[11px] text-muted-foreground border-b">
            {t.language.listeningLibrary}
          </p>
          {filteredClips.length === 0 ? (
            <p className="px-3 py-8 text-xs text-muted-foreground text-center">
              {t.language.listeningEmpty}
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto divide-y">
              {filteredClips.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full text-start px-3 py-2.5 hover:bg-accent/50 transition-colors",
                      activeId === c.id && "bg-primary/10",
                    )}
                  >
                    <p className="text-xs font-medium line-clamp-2">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                      {c.level ?? c.sourceType}
                      {clipTopic(c) && (
                        <>
                          <span className="mx-1 opacity-40">·</span>
                          {clipTopic(c)}
                        </>
                      )}
                      <span className="mx-1 opacity-40">·</span>
                      {formatNumber(c.playCount, language)}{" "}
                      {t.language.listeningPlays}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4 min-w-0 space-y-4">
          {!active ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {t.language.listeningPick}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{active.title}</h3>
                  {active.level && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {active.level}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={pending === `del-${active.id}`}
                  onClick={() => void onDelete(active.id)}
                >
                  {t.language.deleteCard}
                </Button>
              </div>

              <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                {active.sourceType === "YOUTUBE" ? (
                  <iframe
                    title={active.title}
                    src={youtubeEmbedUrl(active.sourceRef)}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4">
                    <audio
                      controls
                      className="w-full"
                      src={active.sourceRef}
                      onPlay={() => {
                        if (!running) startTimer();
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg tabular-nums tracking-tight">
                  {formatElapsed(elapsed)}
                </span>
                {!running ? (
                  <Button size="sm" variant="primary" onClick={startTimer}>
                    {t.language.listeningStartTimer}
                  </Button>
                ) : (
                  <Button size="sm" variant="subtle" onClick={pauseTimer}>
                    {t.language.listeningPauseTimer}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pending === "finish" || elapsed < 5}
                  onClick={() => void onFinish()}
                >
                  {t.language.listeningFinish}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2">
                {t.language.listeningTimerHint}
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t.language.listeningPracticeLines}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.language.listeningDictationHint}
                </p>
                <Textarea
                  rows={4}
                  value={dictation}
                  onChange={e => setDictation(e.target.value)}
                  placeholder={t.language.listeningDictationPlaceholder}
                  disabled={!active.transcript}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="subtle"
                    disabled={!active.transcript || !dictation.trim()}
                    onClick={checkDictation}
                  >
                    {t.language.listeningCheck}
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    disabled={!active.transcript}
                    onClick={() => setShowTranscript(v => !v)}
                  >
                    {showTranscript
                      ? t.language.listeningHideTranscript
                      : t.language.listeningShowTranscript}
                  </Button>
                </div>
                {score != null && (
                  <p className="text-xs tabular-nums">
                    {t.language.listeningScore}:{" "}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatNumber(score, language)}%
                    </span>
                  </p>
                )}
                {showTranscript && active.transcript && (
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {active.transcript}
                  </div>
                )}
                {!active.transcript && (
                  <p className="text-[11px] text-muted-foreground">
                    {t.language.listeningNoTranscript}
                  </p>
                )}
              </div>

              {active.notes && (
                <p className="text-[11px] text-muted-foreground border-t pt-3">
                  {active.notes}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
