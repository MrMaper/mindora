"use client";

import { cn } from "@/lib/utils";
import { useResolvedValidationMessage } from "@/lib/validation-message";

/** Banner for server-action / form-level errors (Zod keys or plain text). */
export function ActionError({
  error,
  className,
}: {
  error: string | null | undefined;
  className?: string;
}) {
  const message = useResolvedValidationMessage(error);
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
        className,
      )}
    >
      {message}
    </div>
  );
}

/** Inline resolved validation / action text (keeps existing wrapper markup). */
export function ResolvedValidationText({
  text,
}: {
  text: string | null | undefined;
}) {
  const message = useResolvedValidationMessage(text);
  if (!message) return null;
  return <>{message}</>;
}
