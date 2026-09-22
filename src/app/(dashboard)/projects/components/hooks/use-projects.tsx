"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProjectSchema,
  updateProjectSchema,
  updateAreaBucketSchema,
} from "@/schemas/projects";
import {
  createProject,
  updateProject,
  updateAreaBucket,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from "@/features/projects/actions";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateAreaBucketInput,
} from "@/schemas/projects";
import type { ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";
import { DrawerMode } from "@/components/ui-kit/global/error";

export type ProjectsDrawerMode = DrawerMode | "edit-area";

export function useProjects(initialSearch: string) {
  const router = useRouter();

  const [drawerMode, setDrawerMode] =
    React.useState<ProjectsDrawerMode>("none");
  const [editingProject, setEditingProject] = React.useState<ProjectRow | null>(
    null,
  );
  const [editingArea, setEditingArea] = React.useState<LifeArea | null>(null);
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
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
      area: "LIFE",
    },
  });

  const areaForm = useForm<UpdateAreaBucketInput>({
    resolver: zodResolver(updateAreaBucketSchema),
    defaultValues: { area: "LIFE", name: "", description: "" },
  });

  function openCreate(area?: LifeArea) {
    createForm.reset({
      name: "",
      description: "",
      teamId: "",
      area: area ?? "LIFE",
    });
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

  function openEditArea(bucket: ProjectRow) {
    areaForm.reset({
      area: bucket.area,
      name: bucket.name,
      description: bucket.description ?? "",
    });
    setEditingArea(bucket.area);
    setEditingProject(bucket);
    setActionError(null);
    setDrawerMode("edit-area");
  }

  function closeDrawer() {
    setDrawerMode("none");
    setEditingProject(null);
    setEditingArea(null);
    setActionError(null);
  }

  const onCreateSubmit = createForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      fd.append("teamId", data.teamId ?? "");
      fd.append("area", data.area);
      const result = await createProject(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to create path.");
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
        setActionError(result.error ?? "Failed to update path.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  const onAreaSubmit = areaForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("area", data.area);
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      const result = await updateAreaBucket(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update area.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  function onArchive(project: ProjectRow) {
    startTransition(async () => {
      const result =
        project.status === "ARCHIVED"
          ? await unarchiveProject(project.id)
          : await archiveProject(project.id);
      if (!result.success)
        setActionError(result.error ?? "Failed to archive path.");
      else router.refresh();
    });
  }

  const onDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.success)
        setActionError(result.error ?? "Failed to delete path.");
      else router.refresh();
    });
  };

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    router.push(`/projects?${params.toString()}`);
  }

  function onView(project: ProjectRow) {
    router.push(`/projects/${project.id}`);
  }

  return {
    drawerMode,
    editingProject,
    editingArea,
    deleteTarget,
    setDeleteTarget,
    actionError,
    setActionError,
    isPending,
    search,
    setSearch,
    createForm,
    editForm,
    areaForm,
    openCreate,
    openEdit,
    openEditArea,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
    onAreaSubmit,
    onArchive,
    onDeleteConfirm,
    onSearchSubmit,
    onView,
  };
}
