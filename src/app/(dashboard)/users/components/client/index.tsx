"use client";

import * as React from "react";
import { useUsers, type UserFilters } from "../hooks/use-users";
import { useTranslation } from "@/i18n/provider";
import {
  getAllOptionsWithLabels,
  withEmptyOption,
} from "@/components/ui-kit/forms/select-utils";
import type { GetUsersResult } from "@/features/users/types";
import type { Language } from "@/types/db";
import { UsersHeader } from "../ui/users-header";
import { UserTable } from "../ui/user-table";
import { CreateUserDrawer } from "../ui/create-user-drawer";
import { EditUserDrawer } from "../ui/edit-user-drawer";
import { DeleteUserDialog } from "../ui/delete-user-dialog";
import { Pagination } from "../ui/pagination";
import { SearchFilters } from "../ui/search-filters";

interface UsersCCProps {
  initialData: GetUsersResult;
  page: number;
  language: Language;
  teams: { id: string; name: string }[];
  filters: UserFilters;
}

export function UsersCC({
  initialData,
  page,
  language,
  teams,
  filters,
}: UsersCCProps) {
  const t = useTranslation();
  const u = useUsers(filters.search);

  const { users, total, totalPages } = initialData;

  const roleOptions = withEmptyOption(
    getAllOptionsWithLabels(language, "userRole"),
    t.users.allRoles,
  );

  const statusOptions = withEmptyOption(
    getAllOptionsWithLabels(language, "userStatus"),
    t.users.allStatuses,
  );

  const teamOptions = withEmptyOption(
    teams.map(team => ({ value: team.id, label: team.name })),
    t.users.allTeams,
  );

  const hasActiveFilters = !!(
    filters.search ||
    filters.role ||
    filters.status ||
    filters.teamId
  );

  return (
    <>
      <UsersHeader total={total} openCreate={u.openCreate} />

      <SearchFilters
        search={u.search}
        filters={filters}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
        onFiltersChange={u.onFiltersChange}
        onClearFilters={u.onClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {u.actionError && !u.drawerMode && (
        <div
          className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          {u.actionError}
        </div>
      )}

      <UserTable
        users={users}
        t={t}
        onEdit={u.openEdit}
        onToggleStatus={u.onToggleStatus}
        onDelete={u.setDeleteTarget}
        emptyMessage={t.users.noResults}
      />

      <Pagination page={page} totalPages={totalPages} t={t} search={u.search} />

      <CreateUserDrawer
        open={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        t={t}
        teams={teams}
        createForm={u.createForm}
        actionError={u.actionError}
        isPending={u.isPending}
        createdPassword={u.createdPassword}
        onCreateSubmit={u.onCreateSubmit}
      />

      <EditUserDrawer
        open={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        t={t}
        teams={teams}
        editForm={u.editForm}
        editingUser={u.editingUser}
        actionError={u.actionError}
        isPending={u.isPending}
        onEditSubmit={u.onEditSubmit}
      />

      <DeleteUserDialog
        open={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        t={t}
        deleteTarget={u.deleteTarget}
        isPending={u.isPending}
        onDeleteConfirm={u.onDeleteConfirm}
      />
    </>
  );
}
