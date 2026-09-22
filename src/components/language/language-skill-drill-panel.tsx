"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { SpeakButton } from "@/components/language/speak-button";
import { logLangSessionAction } from "@/features/language/actions";
import {
  countWords,
  pickSkillDrills,
  type SkillDrillItem,
} from "@/features/language/skill-drills";
import type { LangSkill } from "@/types/db";
import { cn, formatNumber } from "@/lib/utils";

function formatTimer(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function LanguageSkillDrillPanel({
  skill,
  projectId,
  onClose,
}: {
  skill: LangSkill;
  projectId?: string | null;
  onClose: () => void;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [items] = React.useState(() => pickSkillDrills(skill, 8));
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [answered, setAnswered] = React.useState(0);
  const [response, setResponse] = React.useState("");
  const [startedAt] = React.useState(() => Date.now());
  const [elapsed, setElapsed] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const item = items[index] as SkillDrillItem | undefined;

  async function finishSession(note: string) {
    setPending(true);
    const minutes = Math.max(1, Math.round(elapsed / 60) || 1);
    const result = await logLangSessionAction({
      skill,
      minutes,
      note,
      ...(projectId !== undefined ? { projectId } : {}),
    });
    setPending(false);
    if (!result.success && result.error) {
      window.alert(result.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  function onCheckMcq() {
    if (!item || item.kind !== "mcq" || !selected || revealed) return;
    const ok = selected === item.answerId;
    setRevealed(true);
    setAnswered(a => a + 1);
    if (ok) setCorrectCount(c => c + 1);
  }

  async function onCompleteMcqRound() {
    let correct = correctCount;
    let ans = answered;
    if (item?.kind === "mcq" && selected && !revealed) {
      const ok = selected === item.answerId;
      if (ok) correct += 1;
      ans += 1;
      setCorrectCount(correct);
      setAnswered(ans);
      setRevealed(true);
    }
    if (index >= items.length - 1) {
      await finishSession(
        `Drill ${skill} · ${correct}/${Math.max(ans, items.length)} scored`,
      );
      return;
    }
    setIndex(i => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  async function onCompletePrompt() {
    if (!item || item.kind !== "prompt") return;
    const min = item.minWords ?? 0;
    if (min > 0 && countWords(response) < min) {
      window.alert(
        t.language.drillMinWords.replace(
          "{n}",
          formatNumber(min, language),
        ),
      );
      return;
    }
    if (index >= items.length - 1) {
      await finishSession(`Drill ${skill} · prompt practice`);
      return;
    }
    setIndex(i => i + 1);
    setResponse("");
  }

  if (items.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-4 max-w-xl mx-auto">
        <p className="text-sm text-muted-foreground">{t.language.drillEmpty}</p>
        <Button size="sm" className="mt-3" onClick={onClose}>
          {t.language.drillBack}
        </Button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="rounded-xl border bg-card p-4 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-1">{t.language.drillDone}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {formatTimer(elapsed)} ·{" "}
          {items[0]?.kind === "mcq"
            ? `${formatNumber(correctCount, language)}/${formatNumber(items.length, language)}`
            : t.language.drillLogged}
        </p>
        <Button size="sm" onClick={onClose}>
          {t.language.drillBack}
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-4 max-w-xl mx-auto space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            {t.language.drillTitle} · {formatNumber(index + 1, language)}/
            {formatNumber(items.length, language)}
          </p>
          <h2 className="text-base font-semibold">{t.language.drillPractice}</h2>
        </div>
        <div className="text-lg font-mono tabular-nums">{formatTimer(elapsed)}</div>
      </div>

      {item?.kind === "mcq" && (
        <>
          {item.passage && (
            <p className="text-sm leading-relaxed rounded-lg bg-muted/40 p-3 whitespace-pre-wrap">
              {item.passage}
            </p>
          )}
          <p className="text-sm font-medium">{item.prompt}</p>
          <ul className="flex flex-col gap-1.5">
            {item.choices.map(c => {
              const isSel = selected === c.id;
              const show = revealed && c.id === item.answerId;
              const wrong = revealed && isSel && c.id !== item.answerId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={revealed}
                    onClick={() => setSelected(c.id)}
                    className={cn(
                      "w-full text-start rounded-lg border px-3 py-2 text-sm",
                      isSel && !revealed && "border-primary bg-primary/5",
                      show && "border-emerald-600 bg-emerald-500/10",
                      wrong && "border-destructive bg-destructive/10",
                    )}
                  >
                    {c.text}
                  </button>
                </li>
              );
            })}
          </ul>
          {revealed && (item.explainFa || item.explainEn) && (
            <p className="text-xs text-muted-foreground">
              {language === "FA"
                ? item.explainFa ?? item.explainEn
                : item.explainEn ?? item.explainFa}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!revealed ? (
              <Button
                size="sm"
                disabled={!selected || pending}
                onClick={onCheckMcq}
              >
                {t.language.drillCheck}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => void onCompleteMcqRound()}
              >
                {index >= items.length - 1
                  ? t.language.drillFinish
                  : t.language.drillNext}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t.language.drillBack}
            </Button>
          </div>
        </>
      )}

      {item?.kind === "prompt" && (
        <>
          <div className="flex items-start gap-2">
            <p className="text-sm font-medium flex-1">{item.prompt}</p>
            {skill === "SPEAKING" && (
              <SpeakButton text={item.prompt} label={t.language.speakPrompt} />
            )}
          </div>
          {(item.hintFa || item.hintEn) && (
            <p className="text-xs text-muted-foreground">
              {language === "FA"
                ? item.hintFa ?? item.hintEn
                : item.hintEn ?? item.hintFa}
            </p>
          )}
          {skill === "WRITING" && (
            <>
              <Textarea
                rows={8}
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder={t.language.drillWriteHere}
              />
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatNumber(countWords(response), language)}{" "}
                {t.language.drillWords}
                {item.minWords
                  ? ` · ${t.language.drillMinWords.replace("{n}", formatNumber(item.minWords, language))}`
                  : ""}
              </p>
            </>
          )}
          {skill === "SPEAKING" && (
            <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
              {t.language.drillSpeakHint}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => void onCompletePrompt()}
            >
              {index >= items.length - 1
                ? t.language.drillFinish
                : t.language.drillNext}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t.language.drillBack}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
