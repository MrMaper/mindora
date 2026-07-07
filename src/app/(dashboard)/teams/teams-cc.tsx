"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { useTeams } from "./use-teams";
import { getTranslations } from "@/i18n";
import type { GetTeamsResult } from "@/features/teams/types";
import type { Language } from "@/types/db";

interface TeamsCCProps {
  initialData: GetTeamsResult;
  search: string;
  page: number;
  language: Language;
}

export function TeamsCC({ initialData, search, page, language }: TeamsCCProps) {
  const u = useTeams(search);
  const t = getTranslations(language);
  const { teams, total, totalPages } = initialData;

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-5)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--text-primary)",
            }}
          >
            {t.teams.title}
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            {total} {total === 1 ? t.teams.team : t.teams.totalTeams}
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={u.openCreate}>
          {t.common.add} {t.teams.team.toLowerCase()}
        </Button>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <form
        onSubmit={u.onSearchSubmit}
        style={{
          marginBottom: "var(--space-4)",
          display: "flex",
          gap: "var(--space-2)",
        }}
      >
        <Input
          placeholder={t.teams.search}
          icon="search"
          value={u.search}
          onChange={e => u.setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button type="submit" variant="secondary">
          {t.teams.searchButton}
        </Button>
      </form>

      {/* ── Global error ─────────────────────────────────────────────── */}
      {u.actionError && !u.drawerMode && (
        <div
          className="auth-card__alert auth-card__alert--error"
          style={{ marginBottom: "var(--space-4)" }}
          role="alert"
        >
          {u.actionError}
        </div>
      )}

      {/* ── Teams table ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 200px 100px 40px",
            gap: "var(--space-3)",
            padding: "0 var(--space-4)",
            height: 36,
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-sunken)",
          }}
        >
          {[t.teams.name, t.teams.members, t.teams.status, ""].map(h => (
            <span
              key={h}
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-caps)",
                color: "var(--text-tertiary)",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {teams.length === 0 ? (
          <div
            style={{
              padding: "var(--space-10)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
            }}
          >
            {t.teams.noResults}
          </div>
        ) : (
          teams.map(team => (
            <div
              key={team.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 200px 100px 40px",
                gap: "var(--space-3)",
                padding: "0 var(--space-4)",
                height: "var(--row-height)",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {/* Name & Description */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team.name}
                </div>
                {team.description && (
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}
                  >
                    {team.description}
                  </div>
                )}
              </div>

              {/* Members */}
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                }}
              >
                {team.memberCount} {team.memberCount === 1 ? t.teams.member : t.teams.members}
              </div>

              {/* Status */}
              <Badge tone={team.status === "ACTIVE" ? "success" : "neutral"}>
                {team.status === "ACTIVE" ? t.teams.active : t.teams.archived}
              </Badge>

              {/* Actions */}
              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    aria-label={t.teams.teamActionsLabel}
                    size="sm"
                  />
                }
                align="end"
                items={[
                  {
                    label: t.common.edit,
                    icon: "pencil",
                    onClick: () => u.openEdit(team),
                  },
                  {
                    label: team.status === "ACTIVE" ? t.teams.archive : t.teams.restore,
                    icon: team.status === "ACTIVE" ? "archive" : "rotate-ccw",
                    onClick: () => u.onArchive(team),
                  },
                  { divider: true },
                  {
                    label: t.common.delete,
                    icon: "trash",
                    danger: true,
                    onClick: () => u.setDeleteTarget(team),
                  },
                ]}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "var(--space-4)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
            }}
          >
            {t.teams.page} {page} {t.teams.of} {totalPages}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams({
                  search: u.search,
                  page: String(page - 1),
                });
                window.location.href = `/teams?${p.toString()}`;
              }}
            >
              {t.teams.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconRight="chevron-right"
              disabled={page >= totalPages}
              onClick={() => {
                const p = new URLSearchParams({
                  search: u.search,
                  page: String(page + 1),
                });
                window.location.href = `/teams?${p.toString()}`;
              }}
            >
              {t.teams.next}
            </Button>
          </div>
        </div>
      )}

      {/* ── Create team drawer ───────────────────────────────────────── */}
      <Drawer
        open={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        header={
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--text-primary)",
            }}
          >
            {t.teams.createTeam}
          </span>
        }
        footer={
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginLeft: "auto",
            }}
          >
            <Button
              variant="ghost"
              onClick={u.closeDrawer}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onCreateSubmit}
            >
              {t.teams.createTeam}
            </Button>
          </div>
        }
      >
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {u.actionError && (
            <div
              className="auth-card__alert auth-card__alert--error"
              role="alert"
            >
              {u.actionError}
            </div>
          )}
          <Controller
            name="name"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.teams.name}
                placeholder={t.teams.namePlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.teams.description}
                placeholder={t.teams.descriptionPlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Drawer>

      {/* ── Edit team drawer ─────────────────────────────────────────── */}
      <Drawer
        open={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        header={
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--text-primary)",
            }}
          >
            {t.teams.editTeam}
          </span>
        }
        footer={
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginLeft: "auto",
            }}
          >
            <Button
              variant="ghost"
              onClick={u.closeDrawer}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onEditSubmit}
            >
              {t.teams.saveChanges}
            </Button>
          </div>
        }
      >
        <div
          style={{
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {u.actionError && (
            <div
              className="auth-card__alert auth-card__alert--error"
              role="alert"
            >
              {u.actionError}
            </div>
          )}
          {u.editingTeam && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                background: "var(--bg-sunken)",
                borderRadius: "var(--radius-control)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary-foreground)",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {u.editingTeam.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                  }}
                >
                  {u.editingTeam.name}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {u.editingTeam.memberCount} members
                </div>
              </div>
            </div>
          )}
          <Controller
            name="name"
            control={u.editForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.teams.name}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={u.editForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.teams.description}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Drawer>

      {/* ── Delete confirmation dialog ───────────────────────────────── */}
      <Dialog
        open={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        title={t.teams.deleteTeam}
        description={`${t.teams.deleteConfirmPrefix} ${u.deleteTarget?.name} ${t.teams.deleteConfirmSuffix}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => u.setDeleteTarget(null)}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={u.isPending}
              onClick={u.onDeleteConfirm}
            >
              {t.teams.deleteTeam}
            </Button>
          </>
        }
      />
    </>
  );
}