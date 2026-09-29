import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import type { z } from "zod";
import type { Translations } from "@/i18n/types";
import { I18nContext } from "@/i18n/provider";
import { AuthLanguageContext } from "@/app/(auth)/auth-language";

type ValidationDict = Translations["validation"];

/** Map a Zod / action message key (or legacy English string) to the active locale. */
export function resolveValidationMessage(
  t: Pick<Translations, "validation">,
  message: string | null | undefined,
): string {
  if (!message) return t.validation.required;
  const dict = t.validation as ValidationDict & Record<string, string>;
  if (dict[message]) return dict[message];

  // Legacy English strings that may still arrive from older clients / caches.
  const legacy: Record<string, keyof ValidationDict> = {
    "Title is required.": "titleRequired",
    "Title is too long.": "titleTooLong",
    "Name is required.": "nameRequired",
    "Name is too long.": "nameTooLong",
    "Enter a valid email address.": "invalidEmail",
    "Password is required.": "passwordRequired",
    "Password must be at least 8 characters.": "passwordTooShort",
    "Passwords do not match.": "passwordsDoNotMatch",
    "Current password is required.": "currentPasswordRequired",
    "Reset token is missing.": "resetTokenMissing",
    "Project name is required.": "projectNameRequired",
    "Description is too long.": "descriptionTooLong",
    "Team name is required.": "teamNameRequired",
    "User is required.": "userRequired",
    "Role is required.": "roleRequired",
    "Task is required.": "taskRequired",
    "Date is required.": "dateRequired",
    "ID is required.": "idRequired",
    "Minimum 0.25 hours.": "hoursMin",
    "Maximum 24 hours.": "hoursMax",
    "Comment cannot be empty.": "commentEmpty",
    "Comment is too long.": "commentTooLong",
    "Enter a valid hex color.": "invalidHexColor",
    "Message text is required.": "messageTextRequired",
    "Message is too long.": "messageTooLong",
    "Photo file_id or URL is required.": "photoRequired",
    "Document file_id or URL is required.": "documentRequired",
    "Callback query ID is required.": "callbackQueryRequired",
    "Something went wrong. Please try again.": "genericError",
  };
  const key = legacy[message];
  if (key && dict[key]) return dict[key];
  return message;
}

/** Resolve using whichever i18n tree is mounted (dashboard or auth). */
export function useResolvedValidationMessage(
  message: string | null | undefined,
): string | undefined {
  const i18n = React.useContext(I18nContext);
  const auth = React.useContext(AuthLanguageContext);
  const t = i18n?.t ?? auth?.t;
  if (!message) return undefined;
  if (!t) return message;
  return resolveValidationMessage(t, message);
}

function remapFieldErrors(
  errors: FieldErrors,
  t: Pick<Translations, "validation">,
): FieldErrors {
  const out: FieldErrors = { ...errors };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (!val || typeof val !== "object") continue;
    if ("message" in val && typeof val.message === "string") {
      out[key] = {
        ...(val as object),
        message: resolveValidationMessage(t, val.message),
      } as (typeof out)[string];
    } else {
      out[key] = remapFieldErrors(val as FieldErrors, t) as (typeof out)[string];
    }
  }
  return out;
}

/**
 * Drop-in for `zodResolver`. Pass `t` to rewrite messages at resolve time;
 * otherwise keep Zod keys and let form controls translate via
 * `useResolvedValidationMessage`.
 */
export function localizedZodResolver(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any, any, any>,
  t?: Pick<Translations, "validation">,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Resolver<any> {
  const base = zodResolver(schema);
  if (!t) return base;
  return async (values, context, options) => {
    const result = await base(values, context, options);
    if (!result.errors || Object.keys(result.errors).length === 0) {
      return result;
    }
    return {
      ...result,
      errors: remapFieldErrors(result.errors, t),
    };
  };
}
