import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional(),
  teamId: z.string().min(1, "Team is required."),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "ON_HOLD"]).optional(),
});

export const archiveProjectSchema = z.object({
  id: z.string().cuid(),
});

export const deleteProjectSchema = z.object({
  id: z.string().cuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;