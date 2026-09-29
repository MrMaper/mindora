import { z } from "zod";

export const lifeAreaSchema = z.enum(["PHD", "WORK", "LIFE", "LANG"]);
export const projectStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "ON_HOLD",
  "PLANNED",
  "COMPLETED",
]);

export const createProjectSchema = z.object({
  name: z.string().min(1, "projectNameRequired").max(100, "nameTooLong"),
  description: z
    .string()
    .max(500, "descriptionTooLong")
    .optional()
    .or(z.literal("")),
  teamId: z.string().optional().or(z.literal("")),
  area: lifeAreaSchema,
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "projectNameRequired").max(100, "nameTooLong"),
  description: z
    .string()
    .max(500, "descriptionTooLong")
    .optional()
    .or(z.literal("")),
  status: projectStatusSchema.optional(),
});

export const updateAreaBucketSchema = z.object({
  area: lifeAreaSchema,
  name: z.string().min(1, "nameRequired").max(100, "nameTooLong"),
  description: z
    .string()
    .max(500, "descriptionTooLong")
    .optional()
    .or(z.literal("")),
});

export const updateAreaPreferenceSchema = z.object({
  area: lifeAreaSchema,
  color: z.string().max(32).nullable().optional(),
  icon: z.string().max(48).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  archived: z.boolean().optional(),
});

export const reorderAreasSchema = z.object({
  orderedAreas: z.array(lifeAreaSchema).length(4),
});

export const reorderPathsSchema = z.object({
  area: lifeAreaSchema,
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const movePathSchema = z.object({
  pathId: z.string().min(1),
  toArea: lifeAreaSchema,
  /** Optional insert index within destination (append if omitted). */
  toIndex: z.number().int().min(0).optional(),
});

export const togglePinSchema = z.object({
  pathId: z.string().min(1),
  pinned: z.boolean(),
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
export type UpdateAreaPreferenceInput = z.infer<typeof updateAreaPreferenceSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
