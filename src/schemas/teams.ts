import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional(),
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