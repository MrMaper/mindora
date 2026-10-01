import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import ExcelJS from "exceljs";
import { toJalaali } from "jalaali-js";
import {
  parseLocalDate,
  zonedDateKey,
  zonedDateKeysBetween,
  zonedDayEndFromKey,
  zonedDayStartFromKey,
} from "@/lib/life";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const PERSIAN_DAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
] as const;

const PERSIAN_DIGITS = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
] as const;

function toPersianDigits(n: number | string): string {
  return String(n)
    .split("")
    .map(d => PERSIAN_DIGITS[parseInt(d)] ?? d)
    .join("");
}

function formatHoursToString(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function jalaliDayLabel(dateKey: string): string {
  const { jm, jd } = toJalaali(parseLocalDate(dateKey));
  const month = PERSIAN_MONTHS[jm - 1] ?? "";
  return `${toPersianDigits(jd)} ${month}`.trim();
}

function weekdayLabel(dateKey: string): string {
  return PERSIAN_DAYS[parseLocalDate(dateKey).getDay()] ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, dateFrom, dateTo } = await request.json();

    if (!userId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "User ID, dateFrom, and dateTo are required" },
        { status: 400 },
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)
    ) {
      return NextResponse.json(
        { error: "dateFrom and dateTo must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const fromKey = dateFrom <= dateTo ? dateFrom : dateTo;
    const toKey = dateFrom <= dateTo ? dateTo : dateFrom;

    const workLogs = await db.workLog.findMany({
      where: {
        userId,
        date: {
          gte: zonedDayStartFromKey(fromKey),
          lte: zonedDayEndFromKey(toKey),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: "asc" },
    });

    const logsByDate = new Map<string, typeof workLogs>();
    for (const log of workLogs) {
      const dateKey = zonedDateKey(new Date(log.date));
      if (!logsByDate.has(dateKey)) {
        logsByDate.set(dateKey, []);
      }
      logsByDate.get(dateKey)!.push(log);
    }

    const allDates = zonedDateKeysBetween(fromKey, toKey);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mindora";

    const worksheet = workbook.addWorksheet("گزارش ساعات کاری", {
      views: [{ rightToLeft: true }],
    });

    const headerRow = worksheet.addRow([
      "روز هفته",
      "تاریخ",
      "جمع ساعات کاری",
      "گزارش کار",
    ]);

    headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 30;

    worksheet.columns = [
      { width: 18 },
      { width: 22 },
      { width: 18 },
      { width: 60 },
    ];

    let totalHoursSum = 0;

    for (const dateKey of allDates) {
      const logs = logsByDate.get(dateKey) ?? [];
      const dayOfWeek = weekdayLabel(dateKey);
      const persianDate = jalaliDayLabel(dateKey);
      const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
      totalHoursSum += totalHours;

      let workReport = "";
      if (logs.length > 0) {
        logs.forEach((log, index) => {
          const hoursStr = formatHoursToString(log.hours);
          const description = log.description || log.task.title;
          workReport += `${index + 1}. ${description} (${hoursStr})\n`;
        });
        workReport = workReport.trimEnd();
      }

      const row = worksheet.addRow([
        dayOfWeek,
        persianDate,
        formatHoursToString(totalHours),
        workReport,
      ]);

      row.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
        readingOrder: "rtl",
      };
      row.height = logs.length > 0 ? 40 + logs.length * 15 : 30;

      for (let col = 1; col <= 3; col++) {
        const cell = row.getCell(col);
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        };
        cell.font = { size: 11 };
      }

      const reportCell = row.getCell(4);
      reportCell.alignment = {
        horizontal: "right",
        vertical: "top",
        wrapText: true,
        readingOrder: "rtl",
      };
      reportCell.font = { size: 11 };
    }

    const totalRow = worksheet.addRow([
      "مجموع",
      "",
      formatHoursToString(totalHoursSum),
      "",
    ]);

    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    totalRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      readingOrder: "rtl",
    };
    totalRow.height = 30;

    for (let col = 1; col <= 4; col++) {
      const cell = totalRow.getCell(col);
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "double" },
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const filename = `گزارش_ساعات_${user?.name || "کاربر"}_${fromKey}_تا_${toKey}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          filename,
        )}`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 },
    );
  }
}
