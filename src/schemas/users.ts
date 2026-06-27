import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
