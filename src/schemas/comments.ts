import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty.").max(4000, "Comment is too long."),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty.").max(4000, "Comment is too long."),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
