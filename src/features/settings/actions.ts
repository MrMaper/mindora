"use server";

import { prisma as db } from "@/lib/db";
import { requireAuth } from "@/lib/require-role";
import type { Language } from "@/types/db";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateLanguagePreference(
  language: Language,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    // Upsert user preferences
    await db.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        language,
      },
      update: {
        language,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating language preference:", error);
    return {
      success: false,
      error: "Failed to update language preference",
    };
  }
}
