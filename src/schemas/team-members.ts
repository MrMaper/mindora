import { z } from "zod";

export const inviteMemberSchema = z.object({
  userId: z.string().min(1, "User is required."),
  roleId: z.string().min(1, "Role is required."),
});

export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required."),
});

export const removeMemberSchema = z.object({
  memberId: z.string().cuid(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;