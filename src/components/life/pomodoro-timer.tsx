"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type Phase = "idle" | "focus" | "break" | "paused";

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

export function PomodoroTimer({ className }: { className?: string }) {
  const t = useTranslation();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [remaining, setRemaining] = React.useState(FOCUS_SEC);
  const [mode, setMode] = React.useState<"focus" | "break">("focus");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (phase !== "focus" && phase !== "break") return;
    const id = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          window.clearInterval(id);
          if (mode === "focus") {
            setMode("break");
            setPhase("break");
            return BREAK_SEC;
          }
          setMode("focus");
          setPhase("idle");
          return FOCUS_SEC;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, mode]);

  function start() {
    setMode("focus");
    setRemaining(FOCUS_SEC);
    setPhase("focus");
    setOpen(true);
  }

  function togglePause() {
    if (phase === "paused") {
      setPhase(mode);
    } else if (phase === "focus" || phase === "break") {
      setPhase("paused");
    }
  }

  function reset() {
    setPhase("idle");
    setMode("focus");
    setRemaining(FOCUS_SEC);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const running = phase === "focus" || phase === "break" || phase === "paused";

  return (
    <div className={cn("relative", className)}>
      <Button
        size="sm"
        variant={running ? "subtle" : "ghost"}
        onClick={() => (running ? setOpen(o => !o) : start())}
        title={t.habits.pomodoro}
      >
        {running ? `${mm}:${ss}` : t.habits.pomodoro}
      </Button>
      {open && (
        <div className="absolute end-0 top-full mt-2 z-40 w-56 rounded-xl border bg-card p-3 shadow-lg">
          <div className="text-center">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {mode === "focus" ? t.habits.focus : t.habits.break}
            </div>
            <div className="text-3xl font-semibold tabular-nums mt-1">
              {mm}:{ss}
            </div>
          </div>
          <div className="flex gap-1.5 mt-3 justify-center">
            {phase === "idle" ? (
              <Button size="sm" onClick={start}>
                {t.habits.start}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="subtle" onClick={togglePause}>
                  {phase === "paused" ? t.habits.resume : t.habits.pause}
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  {t.habits.reset}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
