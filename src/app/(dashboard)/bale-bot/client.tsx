"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { Input } from "@/components/ui-kit/forms/input";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Tabs } from "@/components/ui-kit/navigation/tabs";
import { useTranslation, useLanguage } from "@/i18n/provider";

interface MessageFormData {
  method: "sendMessage" | "forwardMessage" | "sendPhoto";
  chatId: string;
  // sendMessage
  text: string;
  parseMode: "HTML" | "Markdown" | "";
  // forwardMessage
  fromChatId: string;
  messageId: string;
  // sendPhoto
  photo: string;
  caption: string;
}

type Provider = "bale" | "telegram";

const initialFormData: MessageFormData = {
  method: "sendMessage",
  chatId: "",
  text: "",
  parseMode: "",
  fromChatId: "",
  messageId: "",
  photo: "",
  caption: "",
};

export function BaleBotTester() {
  const t = useTranslation();
  const language = useLanguage();
  const isRTL = language === "FA";

  const [activeTab, setActiveTab] = React.useState<
    "editor" | "preview" | "split"
  >("split");
  const [provider, setProvider] = React.useState<Provider>("bale");
  const [formData, setFormData] =
    React.useState<MessageFormData>(initialFormData);
  const [result, setResult] = React.useState<{
    success: boolean;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (field: keyof MessageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange =
    (field: keyof MessageFormData) => (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      if (formData.method === "sendMessage") {
        const { sendMessage } =
          await import("@/features/external/bots/bale/actions");
        response = await sendMessage({
          chat_id: Number(formData.chatId),
          text: formData.text,
          parse_mode: formData.parseMode || undefined,
        });
      } else if (formData.method === "forwardMessage") {
        const { forwardMessage } =
          await import("@/features/external/bots/bale/actions");
        response = await forwardMessage({
          chat_id: Number(formData.chatId),
          from_chat_id: Number(formData.fromChatId),
          message_id: Number(formData.messageId),
        });
      } else if (formData.method === "sendPhoto") {
        const { sendPhoto } =
          await import("@/features/external/bots/bale/actions");
        response = await sendPhoto({
          chat_id: Number(formData.chatId),
          photo: formData.photo,
          caption: formData.caption || undefined,
        });
      }
      setResult(
        response as { success: boolean; data?: unknown; error?: string },
      );
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatedCurl = React.useMemo(() => {
    const token = "<BOT_TOKEN>";
    const baseUrl =
      provider === "bale"
        ? `https://tapi.bale.ai/business/bot${token}`
        : `https://api.telegram.org/bot${token}`;

    if (formData.method === "sendMessage") {
      return `curl --request POST \\
  '${baseUrl}/sendMessage' \\
  --header 'Content-Type: application/json' \\
  --data '${JSON.stringify(
    {
      chat_id: Number(formData.chatId),
      text: formData.text,
      parse_mode: formData.parseMode || undefined,
    },
    null,
    2,
  )}'`;
    } else if (formData.method === "forwardMessage") {
      return `curl --request POST \\
  '${baseUrl}/forwardMessage' \\
  --header 'Content-Type: application/json' \\
  --data '${JSON.stringify(
    {
      chat_id: Number(formData.chatId),
      from_chat_id: Number(formData.fromChatId),
      message_id: Number(formData.messageId),
    },
    null,
    2,
  )}'`;
    } else {
      return `curl --request POST \\
  '${baseUrl}/sendPhoto' \\
  --header 'Content-Type: application/json' \\
  --data '${JSON.stringify(
    {
      chat_id: Number(formData.chatId),
      photo: formData.photo,
      caption: formData.caption || undefined,
    },
    null,
    2,
  )}'`;
    }
  }, [formData, provider]);

  const renderLabel = (children: React.ReactNode, htmlFor: string) => (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-text-secondary mb-1.5"
    >
      {children}
    </label>
  );

  const renderCard = (children: React.ReactNode, className = "") => (
    <div
      className={`bg-card border border-border-default rounded-lg ${className}`}
    >
      {children}
    </div>
  );

  const providerOptions = [
    { value: "bale", label: "Bale" },
    { value: "telegram", label: "Telegram" },
  ];

  const methodOptions = [
    { value: "sendMessage", label: "sendMessage" },
    { value: "forwardMessage", label: "forwardMessage" },
    { value: "sendPhoto", label: "sendPhoto" },
  ];

  const parseModeOptions = [
    { value: "", label: "None" },
    { value: "HTML", label: "HTML" },
    { value: "Markdown", label: "Markdown" },
  ];

  const tabOptions = [
    { value: "split", label: t.baleBot.split },
    { value: "editor", label: t.baleBot.editor },
    { value: "preview", label: t.baleBot.preview },
  ];

  return (
    <div
      className="flex h-[calc(100vh-48px)] flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-lg font-semibold text-text-primary">
          {t.baleBot.title}
        </h1>
      </div>

      {/* Provider Selector */}
      <div className="border-b border-border-default px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-3 max-w-2xl">
          <label
            htmlFor="provider"
            className="text-sm font-medium text-text-secondary whitespace-nowrap"
          >
            {t.baleBot.provider}
          </label>
          <Select
            id="provider"
            value={provider}
            onChange={(value: string) => setProvider(value as Provider)}
            options={providerOptions}
            className="w-48"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Panel - Form */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4">
          {renderCard(
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border-default">
                <h2 className="font-medium text-text-primary">
                  {t.baleBot.subtitle}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    {renderLabel(t.baleBot.method, "method")}
                    <Select
                      id="method"
                      value={formData.method}
                      onChange={handleSelectChange("method")}
                      options={methodOptions}
                    />
                  </div>

                  <div>
                    {renderLabel(t.baleBot.chatId, "chatId")}
                    <Input
                      id="chatId"
                      type="number"
                      placeholder={t.baleBot.chatIdPlaceholder}
                      value={formData.chatId}
                      onChange={e => handleChange("chatId", e.target.value)}
                      required
                    />
                  </div>

                  {formData.method === "sendMessage" && (
                    <>
                      <div>
                        {renderLabel(t.baleBot.text, "text")}
                        <Textarea
                          id="text"
                          placeholder={t.baleBot.textPlaceholder}
                          value={formData.text}
                          onChange={e => handleChange("text", e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        {renderLabel(t.baleBot.parseMode, "parseMode")}
                        <Select
                          id="parseMode"
                          value={formData.parseMode}
                          onChange={handleSelectChange("parseMode")}
                          options={parseModeOptions}
                        />
                      </div>
                    </>
                  )}

                  {formData.method === "forwardMessage" && (
                    <>
                      <div>
                        {renderLabel(t.baleBot.fromChatId, "fromChatId")}
                        <Input
                          id="fromChatId"
                          type="number"
                          placeholder="987654321"
                          value={formData.fromChatId}
                          onChange={e =>
                            handleChange("fromChatId", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        {renderLabel(t.baleBot.messageId, "messageId")}
                        <Input
                          id="messageId"
                          type="number"
                          placeholder="1234"
                          value={formData.messageId}
                          onChange={e =>
                            handleChange("messageId", e.target.value)
                          }
                          required
                        />
                      </div>
                    </>
                  )}

                  {formData.method === "sendPhoto" && (
                    <>
                      <div>
                        {renderLabel(t.baleBot.photo, "photo")}
                        <Input
                          id="photo"
                          placeholder={t.baleBot.photoPlaceholder}
                          value={formData.photo}
                          onChange={e => handleChange("photo", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        {renderLabel(t.baleBot.caption, "caption")}
                        <Textarea
                          id="caption"
                          placeholder={t.baleBot.captionPlaceholder}
                          value={formData.caption}
                          onChange={e =>
                            handleChange("caption", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    className="w-full"
                  >
                    <Icon
                      name="paperclip"
                      size={18}
                      className={isRTL ? "ml-2" : "mr-2"}
                    />
                    {isLoading ? t.baleBot.sending : t.baleBot.send}
                  </Button>
                </form>
              </div>
            </div>,
          )}

          {/* Generated cURL */}
          {renderCard(
            <div>
              <div className="p-4 border-b border-border-default flex items-center justify-between">
                <h3 className="font-medium text-text-primary">
                  {t.baleBot.generatedCurl}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generatedCurl)}
                >
                  <Icon name="copy" size={16} />
                  <span className="ml-1">{t.baleBot.copy}</span>
                </Button>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                  <code>{generatedCurl}</code>
                </pre>
              </div>
            </div>,
          )}
        </div>

        {/* Right Panel - Preview/Result */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {renderCard(
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border-default">
                <Tabs
                  value={activeTab}
                  onChange={(value: string) =>
                    setActiveTab(value as "editor" | "preview" | "split")
                  }
                  tabs={tabOptions}
                />
              </div>
              <div className="flex-1 flex overflow-hidden">
                {(activeTab === "editor" || activeTab === "split") && (
                  <div
                    className={`${activeTab === "split" ? "w-1/2" : "w-full"} border-r border-border-default flex flex-col`}
                  >
                    <div className="p-2 bg-gray-50 border-b border-border-default text-xs text-text-tertiary font-mono">
                      {t.baleBot.jsonPayload}
                    </div>
                    <div className="flex-1 p-3 overflow-auto">
                      <pre className="text-sm font-mono text-text-primary">
                        <code>
                          {JSON.stringify(
                            formData.method === "sendMessage"
                              ? {
                                  chat_id: Number(formData.chatId),
                                  text: formData.text,
                                  parse_mode: formData.parseMode || undefined,
                                }
                              : formData.method === "forwardMessage"
                                ? {
                                    chat_id: Number(formData.chatId),
                                    from_chat_id: Number(formData.fromChatId),
                                    message_id: Number(formData.messageId),
                                  }
                                : {
                                    chat_id: Number(formData.chatId),
                                    photo: formData.photo,
                                    caption: formData.caption || undefined,
                                  },
                            null,
                            2,
                          )}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
                {(activeTab === "preview" || activeTab === "split") && (
                  <div
                    className={`${activeTab === "split" ? "w-1/2" : "w-full"} flex flex-col`}
                  >
                    <div className="p-2 bg-gray-50 border-b border-border-default text-xs text-text-tertiary font-mono">
                      {t.baleBot.apiResponse}
                    </div>
                    <div className="flex-1 p-3 overflow-auto">
                      {result ? (
                        <pre className="text-sm font-mono">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      ) : (
                        <div className="flex items-center justify-center h-full text-text-tertiary">
                          <span className="italic">
                            {t.baleBot.submitToSee}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>,
          )}

          {result &&
            renderCard(
              <div
                className={
                  result.success
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      name={result.success ? "circle-check" : "alert-triangle"}
                      size={20}
                      className={
                        result.success ? "text-green-500" : "text-red-500"
                      }
                    />
                    <span className="font-medium text-text-primary">
                      {result.success ? t.baleBot.success : t.baleBot.error}
                    </span>
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-500 font-mono bg-red-500/10 p-2 rounded">
                      {result.error}
                    </div>
                  )}
                  {result.data ? (
                    <details className="mt-2">
                      <summary className="text-sm text-text-secondary cursor-pointer">
                        {t.baleBot.viewResponse}
                      </summary>
                      <pre className="mt-2 text-xs font-mono text-text-tertiary bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data as object, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              </div>,
            )}
        </div>
      </div>
    </div>
  );
}
