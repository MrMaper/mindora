"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/forms/button";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { logFocusSession } from "@/features/life/actions";
import type { TaskRow } from "@/features/tasks/types";
import { cn, formatNumber } from "@/lib/utils";

const DURATIONS = [15, 25, 50] as const;
const BREAK_SEC = 5 * 60;

type Phase = "idle" | "focus" | "paused" | "break";

type SessionValue = {
  phase: Phase;
  remaining: number;
  running: boolean;
  openCard: () => void;
};

const SessionContext = React.createContext<SessionValue | null>(null);

function clock(total: number, language: "FA" | "EN") {
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return formatNumber(`${mm}:${ss}`, language);
}

export function FocusSessionProvider({
  tasks,
  children,
}: {
  tasks: TaskRow[];
  children: React.ReactNode;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [remaining, setRemaining] = React.useState(25 * 60);
  const [durationMin, setDurationMin] = React.useState<(typeof DURATIONS)[number]>(25);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const logging = React.useRef(false);
  const task = tasks.find(item => item.id === taskId) ?? null;

  const save = React.useCallback(
    async (minutes: number) => {
      if (!taskId || logging.current || minutes < 1) return;
      logging.current = true;
      const result = await logFocusSession({ taskId, minutes });
      logging.current = false;
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      if ((result.data?.hours ?? 0) > 0) {
        toast.success(
          t.dashboard.sessionLogged.replace("{minutes}", formatNumber(minutes, language)),
        );
        router.refresh();
      }
    },
    [taskId, router, language, t.common.error, t.dashboard.sessionLogged],
  );

  React.useEffect(() => {
    if (phase !== "focus" && phase !== "break") return;
    const id = window.setInterval(() => {
      setRemaining(current => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const zeroHandled = React.useRef(false);
  React.useEffect(() => {
    if (remaining !== 0) {
      zeroHandled.current = false;
      return;
    }
    if (zeroHandled.current) return;
    if (phase !== "focus" && phase !== "break") return;
    zeroHandled.current = true;
    if (phase === "focus") {
      void save(durationMin);
      setPhase("break");
      setRemaining(BREAK_SEC);
      return;
    }
    setPhase("idle");
    setRemaining(durationMin * 60);
  }, [remaining, phase, durationMin, save]);

  function choose(next: TaskRow) {
    if (phase === "focus" || phase === "paused") return;
    setTaskId(next.id);
    setPickerOpen(false);
    setPhase("idle");
    setRemaining(durationMin * 60);
  }

  function pickDuration(minutes: (typeof DURATIONS)[number]) {
    if (phase === "focus" || phase === "paused" || phase === "break") return;
    setDurationMin(minutes);
    setRemaining(minutes * 60);
  }

  function start() {
    if (!task) {
      setPickerOpen(true);
      return;
    }
    setPhase("focus");
    setRemaining(durationMin * 60);
    setPickerOpen(false);
  }

  function togglePause() {
    setPhase(current => (current === "paused" ? "focus" : "paused"));
  }

  async function stop() {
    if (phase === "focus" || phase === "paused") {
      const elapsed = Math.floor((durationMin * 60 - remaining) / 60);
      setPhase("idle");
      setRemaining(durationMin * 60);
      if (elapsed < 1) {
        toast.message(t.dashboard.sessionShort);
        return;
      }
      await save(elapsed);
      return;
    }
    setPhase("idle");
    setRemaining(durationMin * 60);
  }

  const value = React.useMemo<SessionValue>(
    () => ({
      phase,
      remaining,
      running: phase === "focus" || phase === "paused" || phase === "break",
      openCard: () => {
        document.getElementById("focus-session")?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    }),
    [phase, remaining],
  );

  return (
    <SessionContext.Provider value={value}>
      <SessionState.Provider
        value={{
          tasks,
          task,
          phase,
          remaining,
          durationMin,
          pickerOpen,
          setPickerOpen,
          choose,
          pickDuration,
          start,
          togglePause,
          stop,
        }}
      >
        {children}
      </SessionState.Provider>
    </SessionContext.Provider>
  );
}

type SessionStateValue = {
  tasks: TaskRow[];
  task: TaskRow | null;
  phase: Phase;
  remaining: number;
  durationMin: (typeof DURATIONS)[number];
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  choose: (task: TaskRow) => void;
  pickDuration: (minutes: (typeof DURATIONS)[number]) => void;
  start: () => void;
  togglePause: () => void;
  stop: () => void;
};

const SessionState = React.createContext<SessionStateValue | null>(null);

export function FocusSessionLauncher() {
  const t = useTranslation();
  const language = useLanguage();
  const session = React.useContext(SessionContext);
  if (!session) return null;
  return (
    <Button
      size="sm"
      variant={session.running ? "subtle" : "ghost"}
      onClick={session.openCard}
    >
      {session.running ? clock(session.remaining, language) : t.dashboard.sessionLaunch}
    </Button>
  );
}

export function FocusSessionCard() {
  const t = useTranslation();
  const language = useLanguage();
  const session = React.useContext(SessionState);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  if (!session) return null;

  const {
    tasks,
    task,
    phase,
    remaining,
    durationMin,
    pickerOpen,
    setPickerOpen,
    choose,
    pickDuration,
    start,
    togglePause,
    stop,
  } = session;

  const areaName = task?.area
    ? task.area === "PHD"
      ? t.dashboard.areaPhd
      : task.area === "WORK"
        ? t.dashboard.areaWork
        : task.area === "LANG"
          ? t.dashboard.areaLang
          : t.dashboard.areaLife
    : null;
  const projectName =
    task?.projectName && task.projectName !== areaName ? task.projectName : null;
  const context = [areaName, projectName].filter(Boolean).join(" · ");
  const running = phase === "focus" || phase === "paused";

  return (
    <div id="focus-session" className="@container flex flex-1 flex-col justify-center px-3 py-4">
      {phase === "break" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-muted-foreground">{t.dashboard.sessionBreak}</p>
          <p className="text-4xl font-semibold tabular-nums tracking-tight @[20rem]:text-5xl">{clock(remaining, language)}</p>
          <Button size="sm" variant="ghost" onClick={() => void stop()}>
            {t.dashboard.sessionSkip}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-full min-w-0">
            {task ? (
              <>
                <p className="truncate text-sm font-semibold">{task.title}</p>
                {context ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{context}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.dashboard.sessionPick}</p>
            )}
          </div>
          <p className="rounded-2xl bg-bg-sunken px-5 py-3 text-4xl font-semibold tabular-nums tracking-tight @[20rem]:px-8 @[20rem]:py-4 @[20rem]:text-5xl">
            {clock(remaining, language)}
          </p>
          {phase === "idle" ? (
            <div className="flex justify-center gap-1.5">
              {DURATIONS.map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => pickDuration(minutes)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    durationMin === minutes
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {formatNumber(minutes, language)}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            {running ? (
              <>
                <Button size="sm" variant="subtle" onClick={togglePause}>
                  {phase === "paused" ? t.habits.resume : t.habits.pause}
                </Button>
                <Button size="sm" variant="primary" onClick={() => void stop()}>
                  {t.dashboard.sessionStop}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" onClick={start}>
                {task ? t.dashboard.sessionGo : t.dashboard.sessionStart}
              </Button>
            )}
            {phase === "idle" ? (
              <Button size="sm" variant="ghost" onClick={() => setPickerOpen(!pickerOpen)}>
                {t.dashboard.sessionPick}
              </Button>
            ) : null}
          </div>
          {pickerOpen && phase === "idle" ? (
            <div
              ref={pickerRef}
              className="max-h-52 w-full overflow-auto rounded-lg border bg-popover p-1 text-start"
            >
              {tasks.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">{t.dashboard.focusPickEmpty}</p>
              ) : (
                tasks.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => choose(item)}
                    className="block w-full truncate rounded-md px-2 py-2 text-start text-sm hover:bg-accent"
                  >
                    {item.title}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
