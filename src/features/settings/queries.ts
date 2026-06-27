import { prisma as db } from "@/lib/db";
import type { Language } from "@/types/db";

export interface UserPreferences {
  id: string;
  userId: string;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      language: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return prefs as UserPreferences | null;
}
