/** Parse YouTube / direct audio URLs for listening practice. */

export type ParsedListeningSource =
  | { ok: true; sourceType: "YOUTUBE"; sourceRef: string }
  | { ok: true; sourceType: "AUDIO"; sourceRef: string }
  | { ok: false; error: string };

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "music.youtube.com",
]);

const AUDIO_EXT = /\.(mp3|m4a|ogg|wav|aac|opus|webm|flac)(\?|#|$)/i;

export function extractYouTubeId(raw: string): string | null {
  const input = raw.trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") &&
        parts[1] &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function parseListeningSource(raw: string): ParsedListeningSource {
  const input = raw.trim();
  if (!input) return { ok: false, error: "آدرس خالی است" };

  const yt = extractYouTubeId(input);
  if (yt) return { ok: true, sourceType: "YOUTUBE", sourceRef: yt };

  try {
    const url = new URL(input);
    if (!/^https?:$/i.test(url.protocol)) {
      return { ok: false, error: "فقط http/https مجاز است" };
    }
    if (YT_HOSTS.has(url.hostname) || url.hostname.endsWith("youtube.com")) {
      return { ok: false, error: "شناسه یوتیوب نامعتبر است" };
    }
    if (AUDIO_EXT.test(url.pathname) || AUDIO_EXT.test(url.href)) {
      return { ok: true, sourceType: "AUDIO", sourceRef: input };
    }
  } catch {
    return { ok: false, error: "آدرس نامعتبر است" };
  }

  return {
    ok: false,
    error: "لینک یوتیوب یا فایل صوتی مستقیم (mp3/m4a/ogg/wav…) وارد کن",
  };
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}
