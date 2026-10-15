import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "nameTooShort").max(80, "nameTooLong"),
    email: z.string().email("invalidEmail"),
    password: z.string().min(8, "passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("invalidEmail"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "resetTokenMissing"),
    password: z.string().min(8, "passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "currentPasswordRequired"),
    password: z.string().min(8, "passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
