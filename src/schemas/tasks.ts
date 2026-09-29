import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "titleRequired").max(255, "titleTooLong"),
  description: z.string().max(10000).optional().or(z.literal("")),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]),
  type: z.enum(["TASK", "STORY", "BUG", "EPIC"]),
  projectId: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  durationMinutes: z.string().optional().or(z.literal("")),
  waitingOn: z.string().optional().or(z.literal("")),
  labelIds: z.string().optional(),
  area: z.enum(["PHD", "WORK", "LIFE", "LANG"]).optional().or(z.literal("")),
  recurrence: z
    .enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"])
    .optional()
    .or(z.literal("")),
  recurrenceEndsAt: z.string().optional().or(z.literal("")),
  applyRecurrenceToSeries: z.string().optional().or(z.literal("")),
});

export const updateTaskSchema = createTaskSchema;

export const createLabelSchema = z.object({
  name: z.string().min(1, "nameRequired").max(50, "nameTooLong"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "invalidHexColor"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
