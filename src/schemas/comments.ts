import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "commentEmpty").max(4000, "commentTooLong"),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, "commentEmpty").max(4000, "commentTooLong"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
