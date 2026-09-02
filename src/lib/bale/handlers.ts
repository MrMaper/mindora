"use server";

import type {
  BaleResponse,
  SendMessageParams,
  ForwardMessageParams,
  SendPhotoParams,
  BaleActionResult,
  BaleMessage,
  GetUpdatesParams,
  BaleUpdate,
} from "./types";

function getBaseAddress(): string {
  const token = process.env.BALE_BOT_TOKEN;
  const baseUrl = process.env.BALE_BASE_URL;

  if (!token || !baseUrl) {
    throw new Error(
      "BALE_BOT_TOKEN or BALE_BASE_URL environment variable is not set",
    );
  }

  return `${baseUrl}${token}`;
}

async function baleRequest<T>(
  action: string,
  method: "GET" | "POST" = "GET",
  params?: unknown,
): Promise<BaleActionResult<T>> {
  const token = process.env.BALE_BOT_TOKEN;
  const baseUrl = process.env.BALE_BASE_URL;

  if (!token || !baseUrl) {
    throw new Error(
      "BALE_BOT_TOKEN or BALE_BASE_URL environment variable is not set",
    );
  }

  const baseAddress = `${baseUrl}${token}`;
  const url = `${baseAddress}/${action}`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data: BaleResponse<T> = await response.json();

    console.log(data);

    if (!data.ok) {
      return {
        success: false,
        error: data.description ?? "Unknown Bale API error",
        errorCode: data.error_code,
      };
    }

    return { success: true, data: data.result! };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function sendMessage(
  params: SendMessageParams,
): Promise<BaleActionResult<BaleMessage>> {
  return baleRequest<BaleMessage>("sendMessage", "POST", params);
}

export async function forwardMessage(
  params: ForwardMessageParams,
): Promise<BaleActionResult<BaleMessage>> {
  return baleRequest<BaleMessage>("forwardMessage", "POST", params);
}

export async function sendPhoto(
  params: SendPhotoParams,
): Promise<BaleActionResult<BaleMessage>> {
  return baleRequest<BaleMessage>("sendPhoto", "POST", params);
}

export async function getUpdates(
  params?: GetUpdatesParams,
): Promise<BaleActionResult<BaleUpdate[]>> {
  return baleRequest<BaleUpdate[]>("getUpdates", "GET", params);
}
