/** Browser TTS for English vocab words. */

let preferredVoice: SpeechSynthesisVoice | null = null;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const prefer = [
    "en-US",
    "en-GB",
    "en-AU",
    "en",
  ];

  for (const lang of prefer) {
    const exact = voices.find(
      v => v.lang.toLowerCase() === lang.toLowerCase(),
    );
    if (exact) return exact;
  }
  for (const lang of prefer) {
    const prefix = voices.find(v =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase()),
    );
    if (prefix) return prefix;
  }
  return voices.find(v => v.lang.toLowerCase().startsWith("en")) ?? null;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakWord(
  text: string,
  opts?: { rate?: number; onEnd?: () => void },
): boolean {
  if (!isSpeechSupported() || !text.trim()) return false;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text.trim());
  utter.lang = "en-US";
  utter.rate = opts?.rate ?? 0.9;
  utter.pitch = 1;

  const voice = preferredVoice ?? pickEnglishVoice();
  if (voice) {
    preferredVoice = voice;
    utter.voice = voice;
    utter.lang = voice.lang;
  }

  if (opts?.onEnd) {
    utter.onend = () => opts.onEnd?.();
    utter.onerror = () => opts.onEnd?.();
  }

  // Chrome sometimes needs voices loaded asynchronously
  if (synth.getVoices().length === 0) {
    synth.addEventListener(
      "voiceschanged",
      () => {
        const v = pickEnglishVoice();
        if (v) {
          preferredVoice = v;
          utter.voice = v;
          utter.lang = v.lang;
        }
        synth.speak(utter);
      },
      { once: true },
    );
    // Fallback if event never fires
    window.setTimeout(() => {
      if (!synth.speaking) synth.speak(utter);
    }, 250);
  } else {
    synth.speak(utter);
  }

  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
