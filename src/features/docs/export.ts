/** Convert editor HTML to readable Markdown (Persian/English safe). */
export function htmlToMarkdown(html: string): string {
  let md = html;

  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${strip(t)}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${strip(t)}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${strip(t)}\n\n`);

  md = md.replace(
    /<li[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/gi,
    (_, t) => `- [x] ${strip(t)}\n`,
  );
  md = md.replace(
    /<li[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/gi,
    (_, t) => `- [ ] ${strip(t)}\n`,
  );
  md = md.replace(
    /<ul[^>]*data-type="taskList"[^>]*>([\s\S]*?)<\/ul>/gi,
    (_, inner) => `${inner}\n`,
  );

  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) =>
    `${strip(t)
      .split("\n")
      .map(line => `> ${line}`)
      .join("\n")}\n\n`,
  );
  md = md.replace(
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, t) => `\`\`\`\n${decode(t)}\n\`\`\`\n\n`,
  );
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, t) => `\`${strip(t)}\``);
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, t) => `**${strip(t)}**`);
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, t) => `**${strip(t)}**`);
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, t) => `*${strip(t)}*`);
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, t) => `*${strip(t)}*`);
  md = md.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, t) => `[${strip(t)}](${href})`,
  );

  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${strip(t)}\n`);
  md = md.replace(/<\/?ul[^>]*>/gi, "\n");
  md = md.replace(/<\/?ol[^>]*>/gi, "\n");
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `${strip(t)}\n\n`);
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n\n");
  md = md.replace(/<[^>]+>/g, "");
  md = decode(md);
  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function strip(html: string): string {
  return decode(html.replace(/<[^>]+>/g, "")).trim();
}

function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function downloadMarkdown(title: string, html: string) {
  const md = htmlToMarkdown(html);
  const safe = (title || "doc").replace(/[<>:"/\\|?*]/g, "-").slice(0, 80);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printDocAsPdf(title: string, html: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const fontFace = `
    @font-face {
      font-family: "Peyda";
      src: url("${origin}/fonts/peyda/PeydaWeb-Regular.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Peyda";
      src: url("${origin}/fonts/peyda/PeydaWeb-Medium.woff2") format("woff2");
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Peyda";
      src: url("${origin}/fonts/peyda/PeydaWeb-SemiBold.woff2") format("woff2");
      font-weight: 600;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Peyda";
      src: url("${origin}/fonts/peyda/PeydaWeb-Bold.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
      font-display: block;
    }
  `;

  const documentHtml = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    ${fontFace}
    @page { margin: 16mm; }
    body {
      font-family: "Peyda", Tahoma, "Segoe UI", sans-serif;
      padding: 24px;
      line-height: 1.8;
      color: #1e2535;
      max-width: 720px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
    }
    h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 1rem; line-height: 1.4; }
    h2 { font-size: 1.25rem; font-weight: 650; margin: 1.1rem 0 0.5rem; line-height: 1.4; }
    h3 { font-size: 1.05rem; font-weight: 600; margin: 0.9rem 0 0.4rem; line-height: 1.4; }
    p { margin: 0.4rem 0; }
    ul, ol { padding-inline-start: 1.4rem; margin: 0.5rem 0; }
    ul[data-type="taskList"] { list-style: none; padding-inline-start: 0; }
    ul[data-type="taskList"] li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin: 0.25rem 0;
    }
    ul[data-type="taskList"] li[data-checked="true"] > div {
      text-decoration: line-through;
      opacity: 0.7;
    }
    blockquote {
      border-inline-start: 3px solid #c8cdd8;
      margin: 0.6rem 0;
      padding-inline-start: 12px;
      color: #636e87;
    }
    pre, code {
      font-family: ui-monospace, "Cascadia Code", "Segoe UI Mono", monospace;
    }
    pre {
      background: #f1f3f6;
      padding: 12px;
      border-radius: 8px;
      overflow: auto;
      font-size: 0.9rem;
    }
    a { color: #3f4cbb; }
    hr { border: none; border-top: 1px solid #dde1e8; margin: 1rem 0; }
    @media print {
      body { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${html}
</body>
</html>`;

  // Hidden iframe avoids popup blockers and window.open(..., "noopener") returning null.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "print-doc");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return;
  }

  frameDoc.open();
  frameDoc.write(documentHtml);
  frameDoc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 800);
  };

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;

    // Chrome print headers use the top-level document title (e.g. "نوشته‌ها | Mindora").
    // Blank both titles so the header strip stays empty/white.
    const previousParentTitle = document.title;
    const previousFrameTitle = frameDoc.title;
    document.title = "\u00A0";
    frameDoc.title = "\u00A0";

    const restoreTitles = () => {
      document.title = previousParentTitle;
      try {
        frameDoc.title = previousFrameTitle;
      } catch {
        // iframe may already be gone
      }
      window.removeEventListener("afterprint", restoreTitles);
      frameWindow.removeEventListener("afterprint", restoreTitles);
    };

    window.addEventListener("afterprint", restoreTitles);
    frameWindow.addEventListener("afterprint", restoreTitles);
    // Fallback if afterprint never fires (some browsers / cancel paths)
    setTimeout(restoreTitles, 60_000);

    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      cleanup();
    }
  };

  const waitForFontsThenPrint = async () => {
    try {
      // Ensure Peyda faces are loaded before the print dialog snapshots the page.
      if (frameDoc.fonts?.ready) {
        await frameDoc.fonts.ready;
        await Promise.all(
          ["400", "500", "600", "700"].map(weight =>
            frameDoc.fonts.load(`${weight} 16px Peyda`),
          ),
        );
      }
    } catch {
      // Fall through — browser will use fallback fonts if load fails.
    }
    setTimeout(runPrint, 50);
  };

  iframe.addEventListener("load", () => void waitForFontsThenPrint(), {
    once: true,
  });
  setTimeout(() => void waitForFontsThenPrint(), 600);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function docInternalUrl(docId: string): string {
  if (typeof window === "undefined") return `/docs?id=${docId}`;
  return `${window.location.origin}/docs?id=${docId}`;
}

/** Lazy-load docx so the Word exporter stays out of the initial docs chunk. */
export async function downloadWordDocx(title: string, html: string) {
  const { downloadWordDocx: run } = await import("./export-docx");
  return run(title, html);
}

export async function downloadWordDoc(title: string, html: string) {
  return downloadWordDocx(title, html);
}

