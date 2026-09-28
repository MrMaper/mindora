import { prisma as db } from "@/lib/db";
import type { Language, Theme } from "@/types/db";

export interface UserPreferencesData {
  id: string;
  userId: string;
  language: Language;
  theme: Theme;
  emailNotifs: boolean;
  notifications: boolean;
  soundNotifs: boolean;
  notifyTaskAssigned: boolean;
  notifyTaskUpdated: boolean;
  notifyTaskCommented: boolean;
  notifyMention: boolean;
  notifySprintStarted: boolean;
  notifySprintEnded: boolean;
  notifyDeadlineApproaching: boolean;
  notifyStatusChanged: boolean;
  baleDigestHour: number;
  baleHabitHour: number;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferencesData | null> {
  if (!userId) return null;
  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      language: true,
      theme: true,
      emailNotifs: true,
      notifications: true,
      soundNotifs: true,
      notifyTaskAssigned: true,
      notifyTaskUpdated: true,
      notifyTaskCommented: true,
      notifyMention: true,
      notifySprintStarted: true,
      notifySprintEnded: true,
      notifyDeadlineApproaching: true,
      notifyStatusChanged: true,
      baleDigestHour: true,
      baleHabitHour: true,
      onboardingCompletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return prefs as UserPreferencesData | null;
}
