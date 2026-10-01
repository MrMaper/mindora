"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { Button } from "@/components/ui-kit/forms/button";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";
import {
  formatOnlineDuration,
  formatPresenceInstant,
} from "@/lib/presence";
import { formatBytes } from "@/lib/format-bytes";
import {
  sendBroadcastAction,
  unlockLoginAction,
  updatePlanAction,
} from "@/features/admin/actions";
import type { AdminOpsPayload } from "@/features/admin/queries";
import type { Language } from "@/types/db";
import { cn } from "@/lib/utils";

export function AdminOverviewCC({
  ops,
  language,
}: {
  ops: AdminOpsPayload;
  language: Language;
}) {
  const t = useTranslation();
  const router = useRouter();
  const lang = language === "EN" ? "EN" : "FA";
  const { overview, audits, health, plan, lockedUsers } = ops;
  const { stats, recentLogins, bale, membersWithBale, inactiveUsers } =
    overview;

  const [pending, startTransition] = React.useTransition();
  const [broadcastMsg, setBroadcastMsg] = React.useState<string | null>(null);
  const [broadcastErr, setBroadcastErr] = React.useState<string | null>(null);
  const [planErr, setPlanErr] = React.useState<string | null>(null);
  const [planCode, setPlanCode] = React.useState(plan.planCode);
  const [planLabel, setPlanLabel] = React.useState(plan.planLabel);
  const [quotaGb, setQuotaGb] = React.useState(
    String(Math.round(plan.storageQuotaBytes / (1024 * 1024 * 1024)) || 5),
  );
  const [maxMembers, setMaxMembers] = React.useState(
    String(plan.maxActiveMembers),
  );

  const [audience, setAudience] = React.useState("members_only");
  const [channel, setChannel] = React.useState("both");

  const summary = [
    {
      label: t.users.statsOnlineNow,
      value: String(stats.onlineNow),
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t.users.statsLoggedInToday,
      value: String(stats.loggedInToday),
      accent: "text-foreground",
    },
    {
      label: t.users.statsActiveAccounts,
      value: String(stats.activeUsers),
      accent: "text-foreground",
    },
    {
      label: t.users.adminInactive,
      value: String(inactiveUsers),
      accent: "text-foreground",
    },
    {
      label: t.users.adminBaleLinked,
      value: String(membersWithBale),
      accent: "text-foreground",
    },
    {
      label: t.users.statsTotalOnline,
      value: formatOnlineDuration(stats.totalOnlineSeconds, lang),
      accent: "text-foreground",
    },
  ] as const;

  function onBroadcast(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBroadcastErr(null);
    setBroadcastMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("audience", audience);
    fd.set("channel", channel);
    startTransition(async () => {
      const res = await sendBroadcastAction(fd);
      if (!res.success) {
        setBroadcastErr(res.error ?? "error");
        return;
      }
      setBroadcastMsg(
        t.users.adminBroadcastSent
          .replace("{n}", String(res.data?.recipients ?? 0))
          .replace("{e}", String(res.data?.emailed ?? 0)),
      );
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function onSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setPlanErr(null);
    const fd = new FormData();
    fd.set("planCode", planCode);
    fd.set("planLabel", planLabel);
    fd.set("storageQuotaGb", quotaGb);
    fd.set("maxActiveMembers", maxMembers);
    startTransition(async () => {
      const res = await updatePlanAction(fd);
      if (!res.success) {
        setPlanErr(res.error ?? "error");
        return;
      }
      router.refresh();
    });
  }

  function onUnlock(userId: string) {
    startTransition(async () => {
      await unlockLoginAction(userId);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageHeaderBar
        title={t.users.adminOverview}
        description={t.users.adminOverviewHint}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/users">
              <Button variant="primary" icon="users">
                {t.users.adminGoUsers}
              </Button>
            </Link>
            <Link href="/bale-bot">
              <Button variant="secondary" icon="bot">
                {t.users.adminGoBale}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map(card => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <div className="text-[11px] font-medium text-muted-foreground">
              {card.label}
            </div>
            <div
              className={cn(
                "mt-0.5 text-lg font-semibold tabular-nums tracking-tight",
                card.accent,
              )}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Health + Plan */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">{t.users.adminHealthTitle}</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            <HealthRow
              label={t.users.adminHealthMigrations}
              ok={health.migrations.ok}
              value={
                health.migrations.ok
                  ? t.users.adminHealthMigrationsOk
                  : t.users.adminHealthMigrationsPending.replace(
                      "{n}",
                      String(health.migrations.pendingCount),
                    )
              }
              hint={health.migrations.latestName}
            />
            <HealthRow
              label={t.users.adminHealthDisk}
              ok={health.disk.ok}
              value={
                health.disk.freeBytes != null
                  ? `${formatBytes(health.disk.freeBytes, lang)} / ${formatBytes(health.disk.totalBytes ?? 0, lang)}`
                  : t.users.adminHealthDiskUnknown
              }
            />
            <HealthRow
              label={t.users.adminHealthStorage}
              ok={health.storageConfigured}
              value={
                health.storageConfigured
                  ? t.users.adminHealthStorageOn
                  : t.users.adminHealthStorageOff
              }
            />
            <HealthRow
              label={t.users.adminHealthSmtp}
              ok={health.smtpConfigured}
              value={
                health.smtpConfigured
                  ? t.users.adminHealthSmtpOn
                  : t.users.adminHealthSmtpOff
              }
            />
            <HealthRow
              label={t.users.adminHealthCron}
              ok={!health.cron.stale && health.cron.ok}
              value={
                !health.cron.lastRunAt
                  ? t.users.adminHealthCronNever
                  : health.cron.stale
                    ? t.users.adminHealthCronStale
                    : t.users.adminHealthCronOk
              }
              hint={
                health.cron.lastRunAt
                  ? formatPresenceInstant(health.cron.lastRunAt, lang)
                  : undefined
              }
            />
            <HealthRow
              label={t.users.adminHealthUsage}
              ok={health.storageUsedBytes <= health.storageQuotaBytes}
              value={`${health.storageUsedLabel} / ${health.storageQuotaLabel}`}
            />
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">{t.users.adminPlanTitle}</h2>
          <form onSubmit={onSavePlan} className="flex flex-col gap-3">
            <Select
              label={t.users.adminPlanCode}
              value={planCode}
              onChange={setPlanCode}
              options={[
                { value: "personal", label: t.users.adminPlanPersonal },
                { value: "team", label: t.users.adminPlanTeam },
                { value: "custom", label: t.users.adminPlanCustom },
              ]}
            />
            {planCode === "custom" ? (
              <>
                <Input
                  label={t.users.adminPlanLabel}
                  value={planLabel}
                  onChange={e => setPlanLabel(e.target.value)}
                />
                <Input
                  label={t.users.adminPlanQuotaGb}
                  type="number"
                  min={1}
                  value={quotaGb}
                  onChange={e => setQuotaGb(e.target.value)}
                />
                <Input
                  label={t.users.adminPlanMaxMembers}
                  type="number"
                  min={1}
                  value={maxMembers}
                  onChange={e => setMaxMembers(e.target.value)}
                />
              </>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {t.users.adminPlanMembersNow}: {plan.activeMembers} /{" "}
                {plan.maxActiveMembers}
              </span>
              {plan.membersOverCap ? (
                <Badge tone="danger">{t.users.adminPlanOverCap}</Badge>
              ) : null}
            </div>
            {planErr ? (
              <p className="text-xs text-destructive">{planErr}</p>
            ) : null}
            <Button type="submit" variant="primary" loading={pending} size="sm">
              {t.users.adminPlanSave}
            </Button>
          </form>
        </section>
      </div>

      {/* Broadcast + Bale */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t.users.adminBroadcastTitle}</h2>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
            {t.users.adminBroadcastHint}
          </p>
          <form onSubmit={onBroadcast} className="flex flex-col gap-3">
            <Input
              name="title"
              label={t.users.adminBroadcastTitleField}
              required
              maxLength={120}
            />
            <label className="block text-sm">
              <span className="mb-1.5 block text-sm font-medium">
                {t.users.adminBroadcastBodyField}
              </span>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-border bg-bg-surface px-3 py-2 text-sm outline-none focus-visible:border-ring"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={t.users.adminBroadcastAudience}
                value={audience}
                onChange={setAudience}
                options={[
                  { value: "all_active", label: t.users.adminBroadcastAll },
                  {
                    value: "members_only",
                    label: t.users.adminBroadcastMembers,
                  },
                  {
                    value: "admins_only",
                    label: t.users.adminBroadcastAdmins,
                  },
                ]}
              />
              <Select
                label={t.users.adminBroadcastChannel}
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "in_app", label: t.users.adminBroadcastInApp },
                  { value: "email", label: t.users.adminBroadcastEmail },
                  { value: "both", label: t.users.adminBroadcastBoth },
                ]}
              />
            </div>
            {broadcastErr ? (
              <p className="text-xs text-destructive">{broadcastErr}</p>
            ) : null}
            {broadcastMsg ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {broadcastMsg}
              </p>
            ) : null}
            <Button type="submit" variant="primary" loading={pending} size="sm">
              {t.users.adminBroadcastSend}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {t.users.adminBaleStatus}
            </h2>
            <Badge tone={bale.enabled ? "success" : "neutral"}>
              {bale.enabled ? t.users.adminBaleOn : t.users.adminBaleOff}
            </Badge>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                {t.users.adminBaleNoToken}
              </dt>
              <dd>
                <Badge tone={bale.hasToken ? "success" : "warning"}>
                  {bale.hasToken
                    ? bale.botUsername
                      ? `@${bale.botUsername}`
                      : bale.botName || "OK"
                    : t.users.adminBaleNoToken}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                {bale.webhookOk
                  ? t.users.adminBaleWebhookOk
                  : t.users.adminBaleWebhookBad}
              </dt>
              <dd>
                <Badge tone={bale.webhookOk ? "success" : "danger"}>
                  {bale.webhookOk
                    ? t.users.adminBaleWebhookOk
                    : t.users.adminBaleWebhookBad}
                </Badge>
              </dd>
            </div>
            {bale.webhookError ? (
              <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                {bale.webhookError}
              </p>
            ) : null}
          </dl>
          <div className="mt-3">
            <Link href="/bale-bot">
              <Button size="sm" variant="subtle">
                {t.users.adminGoBale}
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Locks + recent logins */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            {t.users.adminLocksTitle}
          </h2>
          {lockedUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t.users.adminLocksEmpty}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lockedUsers.map(u => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground" dir="ltr">
                      {u.email}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatPresenceInstant(u.lockedUntil, lang)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="subtle"
                    loading={pending}
                    onClick={() => onUnlock(u.id)}
                  >
                    {t.users.adminUnlock}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {t.users.adminRecentLogins}
          </h2>
          {recentLogins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t.users.adminNoLogins}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentLogins.map(ev => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {ev.userName}
                    </div>
                    <div
                      className="truncate text-[11px] text-muted-foreground"
                      dir="ltr"
                    >
                      {ev.userEmail}
                    </div>
                  </div>
                  <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {formatPresenceInstant(ev.createdAt, lang)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Audit log */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t.users.adminAuditTitle}</h2>
        {audits.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.users.adminAuditEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-border-muted">
            {audits.map(a => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{a.action}</Badge>
                    <span className="text-sm text-foreground">{a.summary}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.actorName}
                    {a.targetName ? ` → ${a.targetName}` : ""}
                  </div>
                </div>
                <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {formatPresenceInstant(a.createdAt, lang)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function HealthRow({
  label,
  value,
  hint,
  ok,
}: {
  label: string;
  value: string;
  hint?: string | null;
  ok: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        {hint ? (
          <div className="truncate text-[11px] text-muted-foreground/80" dir="ltr">
            {hint}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "size-2 rounded-full",
            ok ? "bg-emerald-500" : "bg-amber-500",
          )}
        />
        <span className="max-w-[12rem] text-end text-xs font-medium text-foreground">
          {value}
        </span>
      </div>
    </li>
  );
}
