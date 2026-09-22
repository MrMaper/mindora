"use client";

import * as React from "react";
import { useProjects } from "../hooks/use-projects";
import type { ProjectsHubData } from "@/features/projects/types";
import { useTranslation } from "@/i18n/provider";
import { PageHeader } from "../ui/page-header";
import { AreaSection } from "../ui/area-section";
import { CreateProjectDrawer } from "../ui/create-project-drawer";
import { EditProjectDrawer } from "../ui/edit-project-drawer";
import { EditAreaDrawer } from "../ui/edit-area-drawer";
import { DeleteConfirmationDialog } from "../ui/delete-confirmation-dialog";
import { GlobalError } from "@/components/ui-kit/global";

interface ProjectsCCProps {
  initialData: ProjectsHubData;
  search: string;
}

export function ProjectsCC({ initialData, search }: ProjectsCCProps) {
  const u = useProjects(search);
  const t = useTranslation();

  const pathCount = initialData.sections.reduce(
    (n, s) => n + s.paths.length,
    0,
  );

  const areaOptions = initialData.sections.map(s => ({
    value: s.area,
    label: s.bucket.name,
  }));

  return (
    <>
      <PageHeader
        pathCount={pathCount}
        search={u.search}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
        onCreate={() => u.openCreate()}
      />

      <GlobalError
        error={u.actionError}
        drawerMode={u.drawerMode === "edit-area" ? "edit" : u.drawerMode}
      />

      {initialData.sections.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-lg p-10 text-center text-sm text-muted-foreground">
          {t.projects.noResults}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {initialData.sections.map(section => (
            <AreaSection
              key={section.area}
              section={section}
              onEditArea={u.openEditArea}
              onAddPath={u.openCreate}
              onView={u.onView}
              onEditPath={u.openEdit}
              onArchive={u.onArchive}
              onDelete={u.setDeleteTarget}
            />
          ))}
        </div>
      )}

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
        areaOptions={areaOptions}
      />

      <EditProjectDrawer
        isOpen={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        form={{
          control: u.editForm.control,
          isPending: u.isPending,
        }}
        editingProject={
          u.editingProject
            ? {
                name: u.editingProject.name,
                memberCount: u.editingProject.memberCount,
              }
            : null
        }
        onSubmit={u.onEditSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
      />

      <EditAreaDrawer
        isOpen={u.drawerMode === "edit-area"}
        onClose={u.closeDrawer}
        form={{
          control: u.areaForm.control,
          isPending: u.isPending,
        }}
        areaName={u.editingProject?.name ?? null}
        onSubmit={u.onAreaSubmit}
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
