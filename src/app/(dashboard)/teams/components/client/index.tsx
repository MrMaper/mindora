"use client";

import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";

import * as React from "react";
import { useTeams } from "../hooks/use-teams";
import { useTranslation } from "@/i18n/provider";
import { Pagination } from "@/components/ui-kit/tables/pagination";

import { TeamHeader } from "../ui/team-header";
import { TeamTable } from "../ui/team-table";
import { CreateTeamDrawer } from "../ui/create-team-drawer";
import { EditTeamDrawer } from "../ui/edit-team-drawer";
import { DeleteTeamDialog } from "../ui/delete-team-dialog";
import type { GetTeamsResult } from "@/features/teams/types";
import type { Language } from "@/types/db";

interface TeamsCCProps {
  initialData: GetTeamsResult;
  search: string;
  page: number;
  language: Language;
}

export function TeamsCC({ initialData, search, page }: TeamsCCProps) {
  const t = useTranslation();
  const u = useTeams(search);
  const { teams, total, totalPages } = initialData;

  return (
    <>
      <TeamHeader
        total={total}
        search={u.search}
        filters={u.filters}
        hasActiveFilters={u.hasActiveFilters}
        onCreate={u.openCreate}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
        onFiltersChange={u.onFiltersChange}
        onClearFilters={u.onClearFilters}
      />

      {u.actionError && !u.drawerMode && (
        <div
          className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <ResolvedValidationText text={u.actionError} />
        </div>
      )}

      <TeamTable
        teams={teams}
        onView={u.onView}
        onEdit={u.openEdit}
        onArchive={u.onArchive}
        onDelete={u.setDeleteTarget}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        filters={{ search: u.search }}
      />

      <CreateTeamDrawer
        open={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        actionError={u.actionError}
        isPending={u.isPending}
        createForm={u.createForm}
        onCreateSubmit={u.onCreateSubmit}
      />

      <EditTeamDrawer
        open={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        actionError={u.actionError}
        isPending={u.isPending}
        editForm={u.editForm}
        editingTeam={u.editingTeam}
        onEditSubmit={u.onEditSubmit}
      />

      <DeleteTeamDialog
        deleteTarget={u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        isPending={u.isPending}
        onDeleteConfirm={u.onDeleteConfirm}
      />
    </>
  );
}
