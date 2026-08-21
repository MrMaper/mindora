"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, updateProjectSchema } from "@/schemas/projects";
import {
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from "@/features/projects/actions";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/schemas/projects";
import type { ProjectRow } from "@/features/projects/types";
import { DrawerMode } from "@/components/ui-kit/global/error";

export function useProjects(initialSearch: string) {
  const router = useRouter();

  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("none");
  const [editingProject, setEditingProject] = React.useState<ProjectRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectRow | null>(
    null,
  );
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [search, setSearch] = React.useState(initialSearch);

  const editForm = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const createForm = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "", teamId: "" },
  });

  function openCreate() {
    createForm.reset({ name: "", description: "", teamId: "" });
    setActionError(null);
    setDrawerMode("create");
  }

  function openEdit(project: ProjectRow) {
    editForm.reset({
      name: project.name,
      description: project.description ?? "",
    });
    setEditingProject(project);
    setActionError(null);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode("none");
    setEditingProject(null);
    setActionError(null);
  }

  const onCreateSubmit = createForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      fd.append("teamId", data.teamId ?? "");
      const result = await createProject(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to create project.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  const onEditSubmit = editForm.handleSubmit(data => {
    if (!editingProject) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      const result = await updateProject(editingProject.id, fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update project.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  function onArchive(project: ProjectRow) {
    startTransition(async () => {
      const result = project.status === "ARCHIVED"
        ? await unarchiveProject(project.id)
        : await archiveProject(project.id);
      if (!result.success)
        setActionError(result.error ?? "Failed to archive project.");
      else router.refresh();
    });
  }

  const onDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.success)
        setActionError(result.error ?? "Failed to delete project.");
      else router.refresh();
    });
  };

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/projects?${params.toString()}`);
  }

  function onView(project: ProjectRow) {
    router.push(`/projects/${project.id}`);
  }

  return {
    drawerMode,
    editingProject,
    deleteTarget,
    setDeleteTarget,
    actionError,
    setActionError,
    isPending,
    search,
    setSearch,
    createForm,
    editForm,
    openCreate,
    openEdit,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
    onArchive,
    onDeleteConfirm,
    onSearchSubmit,
    onView,
  };
}
