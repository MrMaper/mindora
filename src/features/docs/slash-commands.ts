export type SlashCommandId =
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "ordered"
  | "todo"
  | "quote"
  | "code"
  | "divider"
  | "date"
  | "task"
  | "table"
  | "image"
  | "footnote";

export interface SlashCommand {
  id: SlashCommandId;
  aliases: string[];
  labelFa: string;
  labelEn: string;
  hintFa: string;
  hintEn: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    aliases: ["h1", "heading1", "تیتر1"],
    labelFa: "تیتر ۱",
    labelEn: "Heading 1",
    hintFa: "عنوان اصلی",
    hintEn: "Main heading",
  },
  {
    id: "h2",
    aliases: ["h2", "heading2", "تیتر2"],
    labelFa: "تیتر ۲",
    labelEn: "Heading 2",
    hintFa: "زیرعنوان",
    hintEn: "Subheading",
  },
  {
    id: "h3",
    aliases: ["h3", "heading3", "تیتر3"],
    labelFa: "تیتر ۳",
    labelEn: "Heading 3",
    hintFa: "زیر‌زیرعنوان",
    hintEn: "Section heading",
  },
  {
    id: "bullet",
    aliases: ["bullet", "ul", "لیست"],
    labelFa: "لیست نشانه‌دار",
    labelEn: "Bullet list",
    hintFa: "فهرست نقطه‌ای",
    hintEn: "Bulleted list",
  },
  {
    id: "ordered",
    aliases: ["ordered", "ol", "شماره"],
    labelFa: "لیست شماره‌دار",
    labelEn: "Numbered list",
    hintFa: "فهرست ۱ ۲ ۳",
    hintEn: "Numbered list",
  },
  {
    id: "todo",
    aliases: ["todo", "task", "چک", "checkbox"],
    labelFa: "چک‌باکس",
    labelEn: "To-do",
    hintFa: "لیست کار داخل سند",
    hintEn: "Checklist in doc",
  },
  {
    id: "quote",
    aliases: ["quote", "نقل"],
    labelFa: "نقل‌قول",
    labelEn: "Quote",
    hintFa: "بلوک نقل‌قول",
    hintEn: "Blockquote",
  },
  {
    id: "code",
    aliases: ["code", "کد"],
    labelFa: "بلوک کد",
    labelEn: "Code block",
    hintFa: "کد چندخطی",
    hintEn: "Code fence",
  },
  {
    id: "divider",
    aliases: ["divider", "hr", "خط"],
    labelFa: "خط جداکننده",
    labelEn: "Divider",
    hintFa: "خط افقی",
    hintEn: "Horizontal rule",
  },
  {
    id: "date",
    aliases: ["date", "today", "تاریخ", "امروز"],
    labelFa: "تاریخ امروز",
    labelEn: "Today’s date",
    hintFa: "درج تاریخ جلالی/میلادی",
    hintEn: "Insert today’s date",
  },
  {
    id: "task",
    aliases: ["task", "کار", "تسک"],
    labelFa: "ساخت کار از خط",
    labelEn: "Create task from line",
    hintFa: "متن خط را به تسک تبدیل کن",
    hintEn: "Turn this line into a task",
  },
  {
    id: "table",
    aliases: ["table", "جدول"],
    labelFa: "جدول",
    labelEn: "Table",
    hintFa: "انتخاب اندازه جدول",
    hintEn: "Pick table size",
  },
  {
    id: "image",
    aliases: ["image", "img", "تصویر", "عکس"],
    labelFa: "تصویر",
    labelEn: "Image",
    hintFa: "انتخاب فایل تصویر",
    hintEn: "Pick an image file",
  },
  {
    id: "footnote",
    aliases: ["footnote", "fn", "پاورقی"],
    labelFa: "پاورقی",
    labelEn: "Footnote",
    hintFa: "درج علامت پاورقی",
    hintEn: "Insert footnote mark",
  },
];

export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    cmd =>
      cmd.aliases.some(a => a.includes(q) || q.includes(a)) ||
      cmd.labelFa.includes(query.trim()) ||
      cmd.labelEn.toLowerCase().includes(q),
  );
}
