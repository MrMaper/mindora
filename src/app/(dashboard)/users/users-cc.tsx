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
import { useUsers } from "./use-users";
import { getTranslations } from "@/i18n";
import type { GetUsersResult } from "@/features/users/types";
import type { Language } from "@/types/db";

interface UsersCCProps {
  initialData: GetUsersResult;
  search: string;
  page: number;
  language: Language;
}

export function UsersCC({ initialData, search, page, language }: UsersCCProps) {
  const u = useUsers(search);
  const t = getTranslations(language);
  const { users, total, totalPages } = initialData;

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
            {t.users.title}
          </h1>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            {total} {total === 1 ? t.users.admin : t.users.totalUsers}
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={u.openCreate}>
          {t.common.add} {t.users.title.toLowerCase()}
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
          placeholder={t.users.search}
          icon="search"
          value={u.search}
          onChange={e => u.setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button type="submit" variant="secondary">
          Search
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

      {/* ── Users table ──────────────────────────────────────────────── */}
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
            gridTemplateColumns: "1fr 120px 100px 40px",
            gap: "var(--space-3)",
            padding: "0 var(--space-4)",
            height: 36,
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-sunken)",
          }}
        >
          {[t.users.name, t.users.role, t.users.status, ""].map(h => (
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
        {users.length === 0 ? (
          <div
            style={{
              padding: "var(--space-10)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
            }}
          >
            {t.users.noResults}
          </div>
        ) : (
          users.map(user => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 100px 40px",
                gap: "var(--space-3)",
                padding: "0 var(--space-4)",
                height: "var(--row-height)",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {/* Identity */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  minWidth: 0,
                }}
              >
                <Avatar
                  name={user.name}
                  src={user.avatar ?? undefined}
                  size="sm"
                />
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
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Role */}
              <Badge tone={user.role === "ADMIN" ? "solid" : "neutral"}>
                {user.role === "ADMIN" ? t.users.admin : t.users.member}
              </Badge>

              {/* Status */}
              <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
                {user.status === "ACTIVE" ? t.users.active : t.users.inactive}
              </Badge>

              {/* Actions */}
              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    aria-label="User actions"
                    size="sm"
                  />
                }
                align="end"
                items={[
                  {
                    label: "Edit",
                    icon: "pencil",
                    onClick: () => u.openEdit(user),
                  },
                  {
                    label: user.status === "ACTIVE" ? "Deactivate" : "Activate",
                    icon: user.status === "ACTIVE" ? "x" : "check",
                    onClick: () => u.onToggleStatus(user),
                  },
                  { divider: true },
                  {
                    label: "Delete",
                    icon: "trash",
                    danger: true,
                    onClick: () => u.setDeleteTarget(user),
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
            Page {page} of {totalPages}
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
                window.location.href = `/users?${p.toString()}`;
              }}
            >
              Previous
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
                window.location.href = `/users?${p.toString()}`;
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Create user drawer ───────────────────────────────────────── */}
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
            Create user
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
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onCreateSubmit}
            >
              Create user
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
          {u.createdPassword ? (
            <div>
              <div
                className="auth-card__alert auth-card__alert--success"
                style={{ marginBottom: "var(--space-4)" }}
              >
                User created successfully.
              </div>
              <div
                style={{
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-control)",
                  padding: "var(--space-3)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  Temporary password
                </div>
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-primary)",
                    fontWeight: "var(--weight-semibold)",
                  }}
                >
                  {u.createdPassword}
                </code>
              </div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-2)",
                }}
              >
                Share this with the user. They should change it after signing
                in.
              </p>
              <Button
                variant="secondary"
                style={{ marginTop: "var(--space-4)" }}
                onClick={u.closeDrawer}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
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
                    label="Full name"
                    placeholder="Jane Smith"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={u.createForm.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    label="Email"
                    type="email"
                    placeholder="jane@company.com"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="role"
                control={u.createForm.control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label="Role"
                    options={[
                      { value: "MEMBER", label: "Member" },
                      { value: "ADMIN", label: "Admin" },
                    ]}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </>
          )}
        </div>
      </Drawer>

      {/* ── Edit user drawer ─────────────────────────────────────────── */}
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
            Edit user
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
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onEditSubmit}
            >
              Save changes
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
          {u.editingUser && (
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
              <Avatar
                name={u.editingUser.name}
                src={u.editingUser.avatar ?? undefined}
                size="md"
              />
              <div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                  }}
                >
                  {u.editingUser.name}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {u.editingUser.email}
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
                label="Full name"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="role"
            control={u.editForm.control}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label="Role"
                options={[
                  { value: "MEMBER", label: "Member" },
                  { value: "ADMIN", label: "Admin" },
                ]}
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
        title="Delete user"
        description={`Are you sure you want to delete ${u.deleteTarget?.name}? This action cannot be undone.`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => u.setDeleteTarget(null)}
              disabled={u.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={u.isPending}
              onClick={u.onDeleteConfirm}
            >
              Delete user
            </Button>
          </>
        }
      />
    </>
  );
}
