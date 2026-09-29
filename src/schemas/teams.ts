import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "teamNameRequired").max(100, "nameTooLong"),
  description: z.string().max(500, "descriptionTooLong").optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1, "teamNameRequired").max(100, "nameTooLong"),
  description: z.string().max(500, "descriptionTooLong").optional(),
});

export const archiveTeamSchema = z.object({
  id: z.string().cuid(),
});

export const deleteTeamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ArchiveTeamInput = z.infer<typeof archiveTeamSchema>;
export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;
