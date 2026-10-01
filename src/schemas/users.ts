import { z } from "zod";
import { PRIMARY_MODULES } from "@/lib/modules";

export const createUserSchema = z.object({
  name: z.string().min(1, "nameRequired").max(100, "nameTooLong"),
  email: z.string().email("invalidEmail"),
  /** Ignored by server — new users are always MEMBER. Kept for form compat. */
  role: z.enum(["ADMIN", "MEMBER"]),
  /** Empty string means the server generates a temporary password. */
  password: z
    .union([z.literal(""), z.string().min(6, "passwordTooShort6").max(100)])
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "nameRequired").max(100, "nameTooLong"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "nameRequired").max(100, "nameTooLong"),
});

export const moduleFlagsSchema = z.object(
  Object.fromEntries(PRIMARY_MODULES.map(k => [k, z.boolean()])) as Record<
    (typeof PRIMARY_MODULES)[number],
    z.ZodBoolean
  >,
);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
