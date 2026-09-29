import { z } from "zod";

export const createWorkLogSchema = z.object({
  taskId: z.string().min(1, "taskRequired"),
  hours: z.coerce
    .number()
    .min(0.25, "hoursMin")
    .max(24, "hoursMax"),
  date: z.string().min(1, "dateRequired"),
  description: z
    .string()
    .max(1000, "descriptionTooLong")
    .optional()
    .or(z.literal("")),
});

export const updateWorkLogSchema = createWorkLogSchema.partial().extend({
  id: z.string().min(1, "idRequired"),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
