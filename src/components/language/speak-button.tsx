"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { cn } from "@/lib/utils";
import { isSpeechSupported, speakWord, stopSpeaking } from "@/features/language/speak";

export function SpeakButton({
  text,
  label,
  className,
  size = "md",
  autoPlayKey,
}: {
  text: string;
  label: string;
  className?: string;
  size?: "sm" | "md";
  /** When this key changes, auto-speak once (e.g. card id). */
  autoPlayKey?: string;
}) {
  const [supported, setSupported] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const lastAuto = React.useRef<string | null>(null);

  React.useEffect(() => {
    setSupported(isSpeechSupported());
    const warm = () => {
      void window.speechSynthesis?.getVoices();
    };
    warm();
    window.speechSynthesis?.addEventListener("voiceschanged", warm);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", warm);
      stopSpeaking();
    };
  }, []);

  const play = React.useCallback(() => {
    if (!text.trim()) return;
    setSpeaking(true);
    const ok = speakWord(text, {
      onEnd: () => setSpeaking(false),
    });
    if (!ok) setSpeaking(false);
  }, [text]);

  React.useEffect(() => {
    if (!supported || !autoPlayKey || !text.trim()) return;
    if (lastAuto.current === autoPlayKey) return;
    lastAuto.current = autoPlayKey;
    const t = window.setTimeout(() => play(), 180);
    return () => window.clearTimeout(t);
  }, [autoPlayKey, text, supported, play]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        play();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        speaking && "border-primary text-primary bg-primary/10",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
    >
      <Icon name="volume" size={size === "sm" ? 14 : 16} />
    </button>
  );
}
