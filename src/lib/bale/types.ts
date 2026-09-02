export interface BaleUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface BaleChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface BaleMessage {
  message_id: number;
  from?: BaleUser;
  date: number;
  chat: BaleChat;
  text?: string;
  photo?: BalePhotoSize[];
  caption?: string;
}

export interface BaleCallbackQuery {
  id: string;
  from: BaleUser;
  message?: BaleMessage;
  data?: string;
}

export interface BalePreCheckoutQuery {
  id: string;
  from: BaleUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

export interface BaleUpdate {
  update_id: number;
  message?: BaleMessage;
  // one of the following fields will be present, depending on the type of update
  edited_message?: BaleMessage;
  callbackQuery?: BaleCallbackQuery;
  pre_checkout_query?: BalePreCheckoutQuery;
}

export interface BalePhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface BaleResponse<T> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export interface SendMessageParams {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "Markdown";
  // disable_web_page_preview?: boolean;
  // disable_notification?: boolean;
  reply_to_message_id?: number;
}

export interface ForwardMessageParams {
  chat_id: number;
  from_chat_id: number;
  message_id: number;
  disable_notification?: boolean;
}

export interface SendPhotoParams {
  chat_id: number;
  photo: string;
  caption?: string;
  parse_mode?: "HTML" | "Markdown";
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

export type BaleActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: number };

export type GetUpdatesParams = {
  offset?: number;
  limit?: number;
  timeout?: number;
};
