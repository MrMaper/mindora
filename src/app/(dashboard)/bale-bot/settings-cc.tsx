"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Switch } from "@/components/ui-kit/forms/switch";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import type { BaleSettingsView } from "@/features/external/bots/bale/config";
import {
  deleteBaleWebhook,
  saveBaleSettings,
  sendBaleTestMessage,
  setBaleWebhook,
  setMemberBaleId,
} from "@/features/external/bots/bale/settings-actions";

type Member = {
  id: string;
  name: string | null;
  email: string;
  baleUserId: string | null;
  status: "ACTIVE" | "INACTIVE";
  linkPending: boolean;
};

type Delivery = {
  id: string;
  at: string;
  kind: string;
  ok: boolean;
  error: string | null;
  preview: string;
};

const CHANNEL_FLAGS = [
  "notifyChannel",
  "notifyCreated",
  "notifyUpdated",
  "notifyStatus",
  "notifyAssigned",
  "notifyComment",
  "notifyWorkLog",
] as const;

const PERSONAL_FLAGS = [
  "notifyDmAssigned",
  "notifyDmStatus",
  "notifyDmComment",
  "notifyDueChange",
  "notifyDeadline",
  "notifyVocab",
  "notifyDigest",
  "notifyHabits",
] as const;

export function BaleSettingsCC({
  view,
  members,
  deliveries,
}: {
  view: BaleSettingsView;
  members: Member[];
  deliveries: Delivery[];
}) {
  const t = useTranslation();
  const copy = t.baleSettings;
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [enabled, setEnabled] = React.useState(view.enabled);
  const [botToken, setBotToken] = React.useState("");
  const [clearToken, setClearToken] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState(view.baseUrl);
  const [adminChatId, setAdminChatId] = React.useState(view.adminChatId);
  const [tasksChannelId, setTasksChannelId] = React.useState(view.tasksChannelId);
  const [flags, setFlags] = React.useState(() => pickFlags(view));
  const [testChat, setTestChat] = React.useState("");
  const [testText, setTestText] = React.useState("پیام آزمایشی Mindora");
  const [chats, setChats] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.baleUserId ?? ""])),
  );

  React.useEffect(() => {
    setEnabled(view.enabled);
    setBaseUrl(view.baseUrl);
    setAdminChatId(view.adminChatId);
    setTasksChannelId(view.tasksChannelId);
    setFlags(pickFlags(view));
    setBotToken("");
    setClearToken(false);
  }, [view]);

  React.useEffect(() => {
    setChats(
      Object.fromEntries(members.map((member) => [member.id, member.baleUserId ?? ""])),
    );
  }, [members]);

  function report(result: { success: boolean; error?: string }, ok: string) {
    if (result.success) {
      setError(null);
      setNotice(ok);
      router.refresh();
      return;
    }
    setNotice(null);
    setError(messageFor(copy, result.error));
  }

  function save() {
    setNotice(null);
    setError(null);
    startTransition(async () => {
      const result = await saveBaleSettings({
        enabled,
        botToken,
        clearToken,
        baseUrl,
        adminChatId,
        tasksChannelId,
        ...flags,
      });
      report(result, copy.saved);
    });
  }

  const webhookMismatch =
    Boolean(view.webhook?.url) &&
    Boolean(view.webhookExpected) &&
    view.webhook?.url !== view.webhookExpected;

  const tokenLine = !view.hasToken
    ? copy.tokenMissing
    : view.tokenFromEnv
      ? `${copy.tokenEnv}${view.tokenHint ? ` (${view.tokenHint})` : ""}`
      : `${copy.tokenStored}${view.tokenHint ? ` (${view.tokenHint})` : ""}`;

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
          }}
        >
          {copy.title}
        </h1>
        <p style={{ marginTop: "var(--space-2)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          {copy.subtitle}
        </p>
      </header>

      {!view.persisted && (
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{copy.notSaved}</p>
      )}
      {notice && (
        <p style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }} role="status">
          {notice}
        </p>
      )}
      {error && (
        <p style={{ color: "var(--danger, #b42318)", fontSize: "var(--text-sm)" }} role="alert">
          {error}
        </p>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Switch label={copy.enabled} checked={enabled} onChange={setEnabled} />
        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>{copy.enabledHint}</p>
        <Input
          label={copy.token}
          mode="password"
          value={botToken}
          onChange={(event) => setBotToken(event.target.value)}
          placeholder={copy.tokenPlaceholder}
          hint={tokenLine}
          autoComplete="new-password"
        />
        <Switch label={copy.clearToken} checked={clearToken} onChange={setClearToken} />
        <Input label={copy.baseUrl} value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        <Input
          label={copy.adminChat}
          value={adminChatId}
          onChange={(event) => setAdminChatId(event.target.value)}
          hint={copy.adminChatHint}
        />
        <Input
          label={copy.channel}
          value={tasksChannelId}
          onChange={(event) => setTasksChannelId(event.target.value)}
          hint={copy.channelHint}
        />
        <div>
          <h2 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
            {copy.channelEvents}
          </h2>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
            {copy.channelEventsHint}
          </p>
          <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
            {CHANNEL_FLAGS.map((flag) => (
              <Switch
                key={flag}
                label={copy[flag]}
                checked={flags[flag]}
                onChange={(checked) => setFlags((current) => ({ ...current, [flag]: checked }))}
              />
            ))}
          </div>
          <h2 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>
            {copy.personalEvents}
          </h2>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
            {copy.personalEventsHint}
          </p>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {PERSONAL_FLAGS.map((flag) => (
              <Switch
                key={flag}
                label={copy[flag]}
                checked={flags[flag]}
                onChange={(checked) => setFlags((current) => ({ ...current, [flag]: checked }))}
              />
            ))}
          </div>
        </div>
        <div>
          <Button variant="primary" loading={pending} onClick={save}>
            {copy.save}
          </Button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{copy.connection}</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          {copy.bot}:{" "}
          {view.bot
            ? `${view.bot.name}${view.bot.username ? ` (@${view.bot.username})` : ""} · ${view.bot.id}`
            : copy.botUnknown}
        </p>
        {view.botError && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--danger, #b42318)" }}>{view.botError}</p>
        )}
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", wordBreak: "break-all" }}>
          {copy.webhookExpected}: {view.webhookExpected || "—"}
        </p>
        {!view.appUrl && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{copy.noAppUrl}</p>
        )}
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", wordBreak: "break-all" }}>
          {copy.webhookCurrent}: {view.webhook?.url || copy.webhookEmpty}
        </p>
        {webhookMismatch && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{copy.webhookMismatch}</p>
        )}
        {view.webhook && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {copy.webhookPending}: {view.webhook.pending}
            {view.webhook.lastError ? ` · ${copy.webhookError}: ${view.webhook.lastError}` : ""}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <Button variant="secondary" onClick={() => router.refresh()}>
            {copy.check}
          </Button>
          <Button
            variant="primary"
            disabled={!view.hasToken || !view.webhookExpected || pending}
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                report(await setBaleWebhook(), copy.webhookSet);
              })
            }
          >
            {copy.setWebhook}
          </Button>
          <Button
            variant="danger"
            disabled={!view.hasToken || pending}
            onClick={() =>
              startTransition(async () => {
                report(await deleteBaleWebhook(), copy.webhookDeleted);
              })
            }
          >
            {copy.deleteWebhook}
          </Button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{copy.test}</h2>
        <Input
          label={copy.testChat}
          value={testChat}
          onChange={(event) => setTestChat(event.target.value)}
          placeholder={copy.testChatPlaceholder}
        />
        <Textarea
          label={copy.testText}
          rows={3}
          value={testText}
          onChange={(event) => setTestText(event.target.value)}
        />
        <div>
          <Button
            variant="secondary"
            disabled={!view.hasToken || pending}
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                report(await sendBaleTestMessage(testChat, testText), copy.testSent);
              })
            }
          >
            {copy.testSend}
          </Button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{copy.members}</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{copy.membersHint}</p>
        {members.length === 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>—</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "grid",
                  gap: "var(--space-2)",
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--border-default)",
                }}
              >
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                  {member.name || member.email}
                  {member.status === "INACTIVE" ? ` · ${copy.inactive}` : ""}
                  {member.linkPending ? ` · ${copy.linkPending}` : ""}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{member.email}</div>
                <Input
                  label={copy.memberChat}
                  value={chats[member.id] ?? ""}
                  onChange={(event) =>
                    setChats((current) => ({ ...current, [member.id]: event.target.value }))
                  }
                />
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        report(
                          await setMemberBaleId(member.id, chats[member.id] ?? ""),
                          copy.memberSaved,
                        );
                      })
                    }
                  >
                    {copy.memberSave}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || !member.baleUserId}
                    onClick={() =>
                      startTransition(async () => {
                        report(await setMemberBaleId(member.id, ""), copy.memberSaved);
                      })
                    }
                  >
                    {copy.memberClear}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>{copy.log}</h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{copy.logHint}</p>
        {deliveries.length === 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{copy.logEmpty}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {deliveries.map((row) => (
              <div key={row.id} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                <div>
                  {row.ok ? copy.logOk : copy.logFail} · {kindLabel(copy.kinds, row.kind)} · {row.at}
                </div>
                <div style={{ color: "var(--text-tertiary)" }}>{row.preview}</div>
                {row.error ? <div>{row.error}</div> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function kindLabel(kinds: object, kind: string) {
  const table = kinds as Record<string, string>;
  return table[kind] ?? kind;
}

function pickFlags(view: BaleSettingsView) {
  return {
    notifyChannel: view.notifyChannel,
    notifyCreated: view.notifyCreated,
    notifyUpdated: view.notifyUpdated,
    notifyStatus: view.notifyStatus,
    notifyAssigned: view.notifyAssigned,
    notifyComment: view.notifyComment,
    notifyWorkLog: view.notifyWorkLog,
    notifyDeadline: view.notifyDeadline,
    notifyVocab: view.notifyVocab,
    notifyDmAssigned: view.notifyDmAssigned,
    notifyDmStatus: view.notifyDmStatus,
    notifyDmComment: view.notifyDmComment,
    notifyDueChange: view.notifyDueChange,
    notifyDigest: view.notifyDigest,
    notifyHabits: view.notifyHabits,
  };
}

function messageFor(
  copy: {
    errorForbidden: string;
    errorNoToken: string;
    errorNoChat: string;
    errorNoText: string;
    errorTaken: string;
    errorNotFound: string;
    noAppUrl: string;
    errorGeneric: string;
  },
  error?: string,
) {
  switch (error) {
    case "forbidden":
      return copy.errorForbidden;
    case "no-token":
      return copy.errorNoToken;
    case "no-chat":
      return copy.errorNoChat;
    case "no-text":
      return copy.errorNoText;
    case "taken":
      return copy.errorTaken;
    case "not-found":
      return copy.errorNotFound;
    case "no-app-url":
      return copy.noAppUrl;
    default:
      return error || copy.errorGeneric;
  }
}
