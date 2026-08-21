import { z } from "zod";

export const createWorkLogSchema = z.object({
  taskId: z.string().min(1, "Task is required."),
  hours: z.coerce.number().min(0.25, "Minimum 0.25 hours.").max(24, "Maximum 24 hours."),
  date: z.string().min(1, "Date is required."),
  description: z.string().max(1000, "Description is too long.").optional().or(z.literal("")),
});

export const updateWorkLogSchema = createWorkLogSchema.partial().extend({
  id: z.string().min(1, "ID is required."),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;