import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional().or(z.literal("")),
  teamId: z.string().optional().or(z.literal("")),
  area: z.enum(["PHD", "WORK", "LIFE", "LANG"]),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ARCHIVED", "ON_HOLD"]).optional(),
});

export const updateAreaBucketSchema = z.object({
  area: z.enum(["PHD", "WORK", "LIFE", "LANG"]),
  name: z.string().min(1, "Name is required.").max(100, "Name is too long."),
  description: z.string().max(500, "Description is too long.").optional().or(z.literal("")),
});

export const archiveProjectSchema = z.object({
  id: z.string().min(1),
});

export const deleteProjectSchema = z.object({
  id: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateAreaBucketInput = z.infer<typeof updateAreaBucketSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
