"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useProjects } from "./use-projects";
import { getTranslations } from "@/i18n";
import type { GetProjectsResult } from "@/features/projects/types";
import type { Language } from "@/types/db";

interface ProjectsCCProps {
  initialData: GetProjectsResult;
  search: string;
  page: number;
  language: Language;
}

export function ProjectsCC({
  initialData,
  search,
  page,
  language,
}: ProjectsCCProps) {
  const u = useProjects(search);
  const t = getTranslations(language);
  const { projects, total, totalPages } = initialData;

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
            {t.projects.title}
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            {total} {total === 1 ? t.projects.project : t.projects.projects}
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={u.openCreate}>
          {t.common.add} {t.projects.project.toLowerCase()}
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
          placeholder={t.projects.search}
          icon="search"
          value={u.search}
          onChange={(e) => u.setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button type="submit" variant="secondary">
          {t.projects.searchButton}
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

      {/* ── Projects table ───────────────────────────────────────────── */}
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
            gridTemplateColumns: "1fr 160px 100px 40px",
            gap: "var(--space-3)",
            padding: "0 var(--space-4)",
            height: 36,
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-sunken)",
          }}
        >
          {[t.projects.name, t.projects.team, t.projects.status, ""].map((h) => (
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
        {projects.length === 0 ? (
          <div
            style={{
              padding: "var(--space-10)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
            }}
          >
            {t.projects.noResults}
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 100px 40px",
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
                  {project.name}
                </div>
                {project.description && (
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
                    {project.description}
                  </div>
                )}
              </div>

              {/* Team */}
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                }}
              >
                {project.teamName ?? t.projects.noTeam}
              </div>

              {/* Status */}
              <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
                {project.status === "ACTIVE" ? t.projects.active : t.projects.archived}
              </Badge>

              {/* Actions */}
              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    aria-label={t.projects.projectActionsLabel}
                    size="sm"
                  />
                }
                align="end"
                items={[
                  {
                    label: t.common.edit,
                    icon: "pencil",
                    onClick: () => u.openEdit(project),
                  },
                  {
                    label: project.status === "ACTIVE" ? t.projects.archive : t.projects.restore,
                    icon: project.status === "ACTIVE" ? "archive" : "rotate-ccw",
                    onClick: () => u.onArchive(project),
                  },
                  { divider: true },
                  {
                    label: t.common.delete,
                    icon: "trash",
                    danger: true,
                    onClick: () => u.setDeleteTarget(project),
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
            {t.projects.page} {page} {t.projects.of} {totalPages}
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
                window.location.href = `/projects?${p.toString()}`;
              }}
            >
              {t.projects.previous}
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
                window.location.href = `/projects?${p.toString()}`;
              }}
            >
              {t.projects.next}
            </Button>
          </div>
        </div>
      )}

      {/* ── Create project drawer ─────────────────────────────────────── */}
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
            {t.projects.createProject}
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
              {t.projects.createProject}
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
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.actionError}
            </div>
          )}
          <Controller
            name="name"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.projects.name}
                placeholder={t.projects.namePlaceholder}
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
                label={t.projects.description}
                placeholder={t.projects.descriptionPlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Drawer>

      {/* ── Edit project drawer ───────────────────────────────────────── */}
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
            {t.projects.editProject}
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
              {t.projects.saveChanges}
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
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.actionError}
            </div>
          )}
          {u.editingProject && (
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
                {u.editingProject.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                  }}
                >
                  {u.editingProject.name}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {u.editingProject.memberCount} members
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
                label={t.projects.name}
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
                label={t.projects.description}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Drawer>

      {/* ── Delete confirmation dialog ────────────────────────────────── */}
      <Dialog
        open={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        title={t.projects.deleteProject}
        description={`${t.projects.deleteConfirmPrefix} ${u.deleteTarget?.name} ${t.projects.deleteConfirmSuffix}`}
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
              {t.projects.deleteProject}
            </Button>
          </>
        }
      />
    </>
  );
}