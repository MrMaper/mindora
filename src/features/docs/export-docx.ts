"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  AlignmentType,
} from "docx";
import { htmlToPlainText } from "./utils";

function escapeFileName(title: string): string {
  return (title || "doc").replace(/[<>:"/\\|?*]/g, "-").slice(0, 80);
}

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "listItem"; text: string; ordered: boolean }
  | { kind: "task"; text: string; checked: boolean };

function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "</$1>\n");

  const re =
    /<(h[1-3]|p|blockquote|li)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    const inner = htmlToPlainText(match[3]).trim();
    if (!inner && tag !== "p") continue;

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({
        kind: "heading",
        level: Number(tag[1]) as 1 | 2 | 3,
        text: inner,
      });
    } else if (tag === "blockquote") {
      blocks.push({ kind: "quote", text: inner });
    } else if (tag === "li") {
      const isTask = /data-type=["']taskItem["']/i.test(attrs);
      const checked = /data-checked=["']true["']/i.test(attrs);
      if (isTask) blocks.push({ kind: "task", text: inner, checked });
      else {
        const ordered = false;
        blocks.push({ kind: "listItem", text: inner, ordered });
      }
    } else if (inner) {
      blocks.push({ kind: "paragraph", text: inner });
    }
  }

  if (blocks.length === 0) {
    const plain = htmlToPlainText(html);
    if (plain) blocks.push({ kind: "paragraph", text: plain });
  }
  return blocks;
}

function headingLevel(level: 1 | 2 | 3) {
  if (level === 1) return HeadingLevel.HEADING_1;
  if (level === 2) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

/** Real OOXML .docx download (opens in Word / LibreOffice / Google Docs). */
export async function downloadWordDocx(title: string, html: string) {
  const blocks = parseBlocks(html);
  const children: Paragraph[] = [
    new Paragraph({
      text: title || "بدون عنوان",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 240 },
    }),
  ];

  for (const block of blocks) {
    if (block.kind === "heading") {
      children.push(
        new Paragraph({
          text: block.text,
          heading: headingLevel(block.level),
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 200, after: 120 },
        }),
      );
      continue;
    }
    if (block.kind === "quote") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              italics: true,
              rightToLeft: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          indent: { right: 360 },
          spacing: { before: 120, after: 120 },
          border: {
            right: { style: "single", size: 12, color: "636e87", space: 8 },
          },
        }),
      );
      continue;
    }
    if (block.kind === "task") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${block.checked ? "☑" : "☐"} ${block.text}`,
              rightToLeft: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { after: 60 },
        }),
      );
      continue;
    }
    if (block.kind === "listItem") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${block.text}`, rightToLeft: true }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          indent: { right: 240 },
          spacing: { after: 60 },
        }),
      );
      continue;
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: block.text, rightToLeft: true })],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 120 },
      }),
    );
  }

  // Collect simple links from HTML for an appendix
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: { href: string; label: string }[] = [];
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) !== null) {
    const href = lm[1];
    const label = htmlToPlainText(lm[2]) || href;
    if (href.startsWith("http")) links.push({ href, label });
  }
  if (links.length > 0) {
    children.push(
      new Paragraph({
        text: "پیوندها",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 360, after: 120 },
      }),
    );
    for (const link of links.slice(0, 40)) {
      children.push(
        new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: link.label,
                  style: "Hyperlink",
                  rightToLeft: true,
                }),
              ],
              link: link.href,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${escapeFileName(title)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Prefer downloadWordDocx — kept as alias for call sites. */
export async function downloadWordDoc(title: string, html: string) {
  return downloadWordDocx(title, html);
}
