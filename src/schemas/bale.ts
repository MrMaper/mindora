import { z } from "zod";

export const sendMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  text: z
    .string()
    .min(1, "messageTextRequired")
    .max(4096, "messageTooLong"),
  parse_mode: z.enum(["HTML", "Markdown"]).optional(),
  disable_web_page_preview: z.boolean().optional(),
  disable_notification: z.boolean().optional(),
  reply_to_message_id: z.number().optional(),
});

export const forwardMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  from_chat_id: z.union([z.string(), z.number()]),
  message_id: z.number().int().positive(),
  disable_notification: z.boolean().optional(),
});

export const sendPhotoSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  photo: z.string().min(1, "photoRequired"),
  caption: z.string().max(1024).optional(),
  parse_mode: z.enum(["HTML", "Markdown"]).optional(),
  disable_notification: z.boolean().optional(),
  reply_to_message_id: z.number().optional(),
});

export const sendDocumentSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  document: z.string().min(1, "documentRequired"),
  caption: z.string().max(1024).optional(),
  parse_mode: z.enum(["HTML", "Markdown"]).optional(),
  disable_notification: z.boolean().optional(),
  reply_to_message_id: z.number().optional(),
});

export const editMessageTextSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  message_id: z.number().int().positive(),
  text: z
    .string()
    .min(1, "messageTextRequired")
    .max(4096, "messageTooLong"),
  parse_mode: z.enum(["HTML", "Markdown"]).optional(),
  disable_web_page_preview: z.boolean().optional(),
});

export const deleteMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  message_id: z.number().int().positive(),
});

export const answerCallbackQuerySchema = z.object({
  callback_query_id: z.string().min(1, "callbackQueryRequired"),
  text: z.string().max(200).optional(),
  show_alert: z.boolean().optional(),
  url: z.string().url().optional(),
  cache_time: z.number().int().min(0).optional(),
});

export const setMyCommandsSchema = z.object({
  commands: z.array(
    z.object({
      command: z.string().min(1).max(32).regex(/^[a-z0-9_]+$/),
      description: z.string().min(1).max(256),
    }),
  ),
  scope: z
    .object({
      type: z.enum([
        "default",
        "all_private_chats",
        "all_group_chats",
        "all_chat_administrators",
        "chat",
      ]),
      chat_id: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
  language_code: z.string().length(2).optional(),
});

export const getChatSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
});

export const getChatMemberSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  user_id: z.number().int().positive(),
});

export const sendChatActionSchema = z.object({
  chat_id: z.union([z.string(), z.number()]),
  action: z.enum([
    "typing",
    "upload_photo",
    "record_video",
    "upload_video",
    "record_audio",
    "upload_audio",
    "upload_document",
    "find_location",
    "record_video_note",
    "upload_video_note",
  ]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type SendPhotoInput = z.infer<typeof sendPhotoSchema>;
export type SendDocumentInput = z.infer<typeof sendDocumentSchema>;
export type EditMessageTextInput = z.infer<typeof editMessageTextSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type AnswerCallbackQueryInput = z.infer<typeof answerCallbackQuerySchema>;
export type SetMyCommandsInput = z.infer<typeof setMyCommandsSchema>;
export type GetChatInput = z.infer<typeof getChatSchema>;
export type GetChatMemberInput = z.infer<typeof getChatMemberSchema>;
export type SendChatActionInput = z.infer<typeof sendChatActionSchema>;
