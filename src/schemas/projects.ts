import type { LifeArea } from "@/types/db";
import { z } from "zod";
import { LIFE_AREAS } from "@/lib/areas";

export const lifeAreaSchema = z.enum(LIFE_AREAS as [LifeArea, ...LifeArea[]]);
export const projectStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "ON_HOLD",
  "PLANNED",
  "COMPLETED",
]);

export const createProjectSchema = z
  .object({
    name: z.string().min(1, "projectNameRequired").max(100, "nameTooLong"),
    description: z
      .string()
      .max(500, "descriptionTooLong")
      .optional()
      .or(z.literal("")),
    teamId: z.string().optional().or(z.literal("")),
    area: lifeAreaSchema.optional().or(z.literal("")),
    areaId: z.string().min(1).optional().or(z.literal("")),
  })
  .refine(d => !!d.areaId || !!d.area, { message: "areaId required" });

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
  area: lifeAreaSchema.optional(),
  areaId: z.string().min(1).optional(),
  color: z.string().max(32).nullable().optional(),
  icon: z.string().max(48).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  archived: z.boolean().optional(),
}).refine(d => !!d.area || !!d.areaId, { message: "areaId required" });

export const reorderAreasSchema = z.object({
  /** @deprecated Prefer orderedIds (UserArea ids). */
  orderedAreas: z.array(lifeAreaSchema).min(1).max(20).optional(),
  orderedIds: z.array(z.string().min(1)).min(1).max(20).optional(),
}).refine(d => (d.orderedIds?.length ?? 0) > 0 || (d.orderedAreas?.length ?? 0) > 0, {
  message: "orderedIds required",
});

export const reorderPathsSchema = z.object({
  area: lifeAreaSchema,
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const movePathSchema = z.object({
  pathId: z.string().min(1),
  toArea: lifeAreaSchema.optional(),
  toAreaId: z.string().min(1).optional(),
  /** Optional insert index within destination (append if omitted). */
  toIndex: z.number().int().min(0).optional(),
}).refine(d => !!d.toArea || !!d.toAreaId, { message: "toAreaId required" });

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
