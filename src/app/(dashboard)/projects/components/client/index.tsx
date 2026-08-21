"use client";

import * as React from "react";
import { Pagination } from "@/components/ui-kit/tables/pagination";
import { useProjects } from "../hooks/use-projects";
import type { GetProjectsResult, ProjectRow } from "@/features/projects/types";
import { useTranslation } from "@/i18n/provider";

import { PageHeader } from "../ui/page-header";
import { SearchFilter } from "../ui/search-filters";
import { ProjectsTable } from "../ui/projects-table";
import { CreateProjectDrawer } from "../ui/create-project-drawer";
import { EditProjectDrawer } from "../ui/edit-project-drawer";
import { DeleteConfirmationDialog } from "../ui/delete-confirmation-dialog";
import { GlobalError } from "@/components/ui-kit/global";

interface ProjectsCCProps {
  initialData: GetProjectsResult;
  search: string;
  page: number;
  currentUserRole: string;
}

export function ProjectsCC({ initialData, search, page, currentUserRole }: ProjectsCCProps) {
  const u = useProjects(search);
  const t = useTranslation();

  const { projects, total, totalPages } = initialData;

  const mappedProjects: ProjectRow[] = projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    teamName: p.teamName,
    status: p.status === "ON_HOLD" ? "ARCHIVED" : p.status,
    teamId: p.teamId,
    memberCount: p.memberCount,
    createdAt: p.createdAt,
  }));

  const canCreateProject = currentUserRole === "ADMIN";

  return (
    <>
      <PageHeader total={total} onCreate={canCreateProject ? u.openCreate : undefined} />

      <SearchFilter
        search={u.search}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
      />

      <GlobalError error={u.actionError} drawerMode={u.drawerMode} />

      <ProjectsTable
        projects={mappedProjects}
        onView={u.onView}
        onEdit={u.openEdit}
        onArchive={u.onArchive}
        onDelete={u.setDeleteTarget}
      />

      <Pagination page={page} totalPages={totalPages} filters={{ search }} />

      {canCreateProject && (
        <CreateProjectDrawer
          isOpen={u.drawerMode === "create"}
          onClose={u.closeDrawer}
          form={{
            control: u.createForm.control,
            isPending: u.isPending,
          }}
          onSubmit={u.onCreateSubmit}
          actionError={u.actionError}
          isPending={u.isPending}
        />
      )}

      <EditProjectDrawer
        isOpen={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        form={{
          control: u.editForm.control,
          isPending: u.isPending,
        }}
        editingProject={
          u.editingProject
            ? { name: u.editingProject.name, memberCount: 0 }
            : null
        }
        onSubmit={u.onEditSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
      />

      <DeleteConfirmationDialog
        isOpen={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        t={{
          deleteProject: t.projects.deleteProject,
          deleteConfirmPrefix: t.projects.deleteConfirmPrefix,
          deleteConfirmSuffix: t.projects.deleteConfirmSuffix,
          common: { cancel: t.common.cancel },
        }}
        projectName={u.deleteTarget?.name ?? null}
        onConfirm={u.onDeleteConfirm}
        isPending={u.isPending}
      />
    </>
  );
}
