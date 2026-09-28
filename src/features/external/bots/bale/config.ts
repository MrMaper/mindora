import { prisma as db } from "@/lib/db";

const DEFAULT_BASE = "https://tapi.bale.ai/bot";

export type BaleRuntime = {
  enabled: boolean;
  token: string;
  tokenFromEnv: boolean;
  baseUrl: string;
  adminChatId: string;
  tasksChannelId: string;
  notifyChannel: boolean;
  notifyCreated: boolean;
  notifyUpdated: boolean;
  notifyStatus: boolean;
  notifyAssigned: boolean;
  notifyComment: boolean;
  notifyWorkLog: boolean;
  notifyDeadline: boolean;
  notifyVocab: boolean;
  notifyDmAssigned: boolean;
  notifyDmStatus: boolean;
  notifyDmComment: boolean;
  notifyDueChange: boolean;
  notifyDigest: boolean;
  notifyHabits: boolean;
  persisted: boolean;
};

export type BaleBotIdentity = {
  id: number;
  name: string;
  username: string | null;
};

export type BaleWebhookState = {
  url: string;
  pending: number;
  lastError: string | null;
};

export type BaleSettingsView = Omit<BaleRuntime, "token"> & {
  hasToken: boolean;
  tokenHint: string;
  appUrl: string;
  webhookExpected: string;
  bot: BaleBotIdentity | null;
  botError: string | null;
  webhook: BaleWebhookState | null;
};

export type BaleSettingsInput = {
  enabled: boolean;
  botToken: string;
  clearToken: boolean;
  baseUrl: string;
  adminChatId: string;
  tasksChannelId: string;
  notifyChannel: boolean;
  notifyCreated: boolean;
  notifyUpdated: boolean;
  notifyStatus: boolean;
  notifyAssigned: boolean;
  notifyComment: boolean;
  notifyWorkLog: boolean;
  notifyDeadline: boolean;
  notifyVocab: boolean;
  notifyDmAssigned: boolean;
  notifyDmStatus: boolean;
  notifyDmComment: boolean;
  notifyDueChange: boolean;
  notifyDigest: boolean;
  notifyHabits: boolean;
};

function trimSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function appOrigin(): string {
  const raw =
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  return trimSlash(raw);
}

export function expectedWebhookUrl(): string {
  const origin = appOrigin();
  return origin ? `${origin}/api/bale/webhook` : "";
}

function envRuntime(): BaleRuntime {
  const token = (process.env.BALE_BOT_TOKEN ?? "").trim();
  return {
    enabled: token.length > 0,
    token,
    tokenFromEnv: token.length > 0,
    baseUrl: trimSlash(process.env.BALE_BASE_URL || DEFAULT_BASE) || DEFAULT_BASE,
    adminChatId: (process.env.BALE_ADMIN_CHAT_ID ?? "").trim(),
    tasksChannelId: (process.env.BALE_CHANNELS_TASKS ?? "").trim(),
    notifyChannel: true,
    notifyCreated: true,
    notifyUpdated: true,
    notifyStatus: true,
    notifyAssigned: true,
    notifyComment: true,
    notifyWorkLog: true,
    notifyDeadline: true,
    notifyVocab: true,
    notifyDmAssigned: true,
    notifyDmStatus: true,
    notifyDmComment: true,
    notifyDueChange: true,
    notifyDigest: true,
    notifyHabits: true,
    persisted: false,
  };
}

export async function getBaleRuntime(): Promise<BaleRuntime> {
  const row = await db.baleConfig.findUnique({ where: { id: "default" } });
  if (!row) return envRuntime();

  const envToken = (process.env.BALE_BOT_TOKEN ?? "").trim();
  const token = row.botToken.trim() || envToken;
  return {
    enabled: row.enabled,
    token,
    tokenFromEnv: !row.botToken.trim() && envToken.length > 0,
    baseUrl: trimSlash(row.baseUrl) || DEFAULT_BASE,
    adminChatId: row.adminChatId.trim(),
    tasksChannelId: row.tasksChannelId.trim(),
    notifyChannel: row.notifyChannel,
    notifyCreated: row.notifyCreated,
    notifyUpdated: row.notifyUpdated,
    notifyStatus: row.notifyStatus,
    notifyAssigned: row.notifyAssigned,
    notifyComment: row.notifyComment,
    notifyWorkLog: row.notifyWorkLog,
    notifyDeadline: row.notifyDeadline,
    notifyVocab: row.notifyVocab,
    notifyDmAssigned: row.notifyDmAssigned,
    notifyDmStatus: row.notifyDmStatus,
    notifyDmComment: row.notifyDmComment,
    notifyDueChange: row.notifyDueChange,
    notifyDigest: row.notifyDigest,
    notifyHabits: row.notifyHabits,
    persisted: true,
  };
}

function hint(token: string) {
  if (token.length < 6) return "";
  return `…${token.slice(-4)}`;
}

type BaleOk<T> = { ok: true; result: T };
type BaleErr = { ok: false; description?: string };

async function baleCall<T>(
  runtime: BaleRuntime,
  method: string,
  body?: unknown,
): Promise<{ data: T | null; error: string | null }> {
  if (!runtime.token) return { data: null, error: "no-token" };
  try {
    const response = await fetch(`${runtime.baseUrl}${runtime.token}/${method}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json()) as BaleOk<T> | BaleErr;
    if (!payload.ok) return { data: null, error: payload.description ?? "Bale API error" };
    return { data: payload.result, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getBaleSettingsView(): Promise<BaleSettingsView> {
  const runtime = await getBaleRuntime();
  const { token, ...rest } = runtime;
  const view: BaleSettingsView = {
    ...rest,
    hasToken: token.length > 0,
    tokenHint: hint(token),
    appUrl: appOrigin(),
    webhookExpected: expectedWebhookUrl(),
    bot: null,
    botError: null,
    webhook: null,
  };
  if (!token) return view;

  const me = await baleCall<{ id: number; first_name?: string; username?: string }>(
    runtime,
    "getMe",
  );
  if (me.data) {
    view.bot = {
      id: me.data.id,
      name: me.data.first_name ?? "",
      username: me.data.username ?? null,
    };
  } else if (me.error && me.error !== "no-token") {
    view.botError = me.error;
  }

  const hook = await baleCall<{
    url?: string;
    pending_update_count?: number;
    last_error_message?: string;
  }>(runtime, "getWebhookInfo");
  if (hook.data) {
    view.webhook = {
      url: hook.data.url ?? "",
      pending: hook.data.pending_update_count ?? 0,
      lastError: hook.data.last_error_message ?? null,
    };
  }
  return view;
}

export async function saveBaleConfig(input: BaleSettingsInput) {
  const current = await db.baleConfig.findUnique({ where: { id: "default" } });
  let botToken = current?.botToken ?? "";
  if (input.clearToken) botToken = "";
  else if (input.botToken.trim()) botToken = input.botToken.trim();

  await db.baleConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled: input.enabled,
      botToken,
      baseUrl: trimSlash(input.baseUrl) || DEFAULT_BASE,
      adminChatId: input.adminChatId.trim(),
      tasksChannelId: input.tasksChannelId.trim(),
      notifyChannel: input.notifyChannel,
      notifyCreated: input.notifyCreated,
      notifyUpdated: input.notifyUpdated,
      notifyStatus: input.notifyStatus,
      notifyAssigned: input.notifyAssigned,
      notifyComment: input.notifyComment,
      notifyWorkLog: input.notifyWorkLog,
      notifyDeadline: input.notifyDeadline,
      notifyVocab: input.notifyVocab,
      notifyDmAssigned: input.notifyDmAssigned,
      notifyDmStatus: input.notifyDmStatus,
      notifyDmComment: input.notifyDmComment,
      notifyDueChange: input.notifyDueChange,
      notifyDigest: input.notifyDigest,
      notifyHabits: input.notifyHabits,
    },
    update: {
      enabled: input.enabled,
      botToken,
      baseUrl: trimSlash(input.baseUrl) || DEFAULT_BASE,
      adminChatId: input.adminChatId.trim(),
      tasksChannelId: input.tasksChannelId.trim(),
      notifyChannel: input.notifyChannel,
      notifyCreated: input.notifyCreated,
      notifyUpdated: input.notifyUpdated,
      notifyStatus: input.notifyStatus,
      notifyAssigned: input.notifyAssigned,
      notifyComment: input.notifyComment,
      notifyWorkLog: input.notifyWorkLog,
      notifyDeadline: input.notifyDeadline,
      notifyVocab: input.notifyVocab,
      notifyDmAssigned: input.notifyDmAssigned,
      notifyDmStatus: input.notifyDmStatus,
      notifyDmComment: input.notifyDmComment,
      notifyDueChange: input.notifyDueChange,
      notifyDigest: input.notifyDigest,
      notifyHabits: input.notifyHabits,
    },
  });
}

export async function callBale<T>(method: string, body?: unknown) {
  const runtime = await getBaleRuntime();
  return baleCall<T>(runtime, method, body);
}
