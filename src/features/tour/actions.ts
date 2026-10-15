"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import type { TourId } from "./types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const KNOWN: readonly TourId[] = [
  "overview",
  "today",
  "board",
  "tasks",
  "calendar",
  "projects",
  "docs",
  "research",
  "language",
  "review",
  "settings",
];

function isTourId(v: string): v is TourId {
  return (KNOWN as readonly string[]).includes(v);
}

/** Mark a tour finished or skipped (idempotent add to completedTourIds). */
export async function completeTourAction(tourId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") return { success: true };
  if (!isTourId(tourId)) return { success: false, error: "تور نامعتبر" };

  const prefs = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
    select: { completedTourIds: true },
  });
  const ids = new Set(prefs?.completedTourIds ?? []);
  ids.add(tourId);

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      completedTourIds: [...ids],
      ...(tourId === "overview" ? { productTourCompletedAt: new Date() } : {}),
    },
    update: {
      completedTourIds: [...ids],
      ...(tourId === "overview" ? { productTourCompletedAt: new Date() } : {}),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/** Clear one tour so invite / restart can run again. */
export async function resetTourAction(tourId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "تور محصول برای مدیر نیست" };
  }
  if (!isTourId(tourId)) return { success: false, error: "تور نامعتبر" };

  const prefs = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
    select: { completedTourIds: true },
  });
  const ids = (prefs?.completedTourIds ?? []).filter(id => id !== tourId);

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      completedTourIds: ids,
      ...(tourId === "overview" ? { productTourCompletedAt: null } : {}),
    },
    update: {
      completedTourIds: ids,
      ...(tourId === "overview" ? { productTourCompletedAt: null } : {}),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/** Clear overview + every page tour so soft invites can show again. */
export async function resetAllToursAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "تور محصول برای مدیر نیست" };
  }

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      completedTourIds: [],
      productTourCompletedAt: null,
    },
    update: {
      completedTourIds: [],
      productTourCompletedAt: null,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/** @deprecated Prefer completeTourAction("overview") */
export async function completeProductTourAction(): Promise<ActionResult> {
  return completeTourAction("overview");
}

/** @deprecated Prefer resetTourAction("overview") */
export async function resetProductTourAction(): Promise<ActionResult> {
  return resetTourAction("overview");
}
