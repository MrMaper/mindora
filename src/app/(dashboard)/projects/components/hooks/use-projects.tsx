"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
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
import { updateUserAreaAction } from "@/features/projects/area-actions";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateAreaBucketInput,
} from "@/schemas/projects";
import type { ProjectRow } from "@/features/projects/types";
import { DrawerMode } from "@/components/ui-kit/global/error";
import { useAreaHelpers } from "@/components/member-areas-provider";

export type ProjectsDrawerMode = DrawerMode | "edit-area";

export function useProjects(initialSearch: string) {
  const router = useRouter();
  const { defaultAreaId } = useAreaHelpers();

  const [drawerMode, setDrawerMode] =
    React.useState<ProjectsDrawerMode>("none");
  const [editingProject, setEditingProject] = React.useState<ProjectRow | null>(
    null,
  );
  const [editingArea, setEditingArea] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectRow | null>(
    null,
  );
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [search, setSearch] = React.useState(initialSearch);

  const editForm = useForm<UpdateProjectInput>({
    resolver: localizedZodResolver(updateProjectSchema),
    defaultValues: { name: "", description: "", status: "ACTIVE" },
  });

  const createForm = useForm<CreateProjectInput>({
    resolver: localizedZodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
      areaId: defaultAreaId,
    },
  });

  const areaForm = useForm<UpdateAreaBucketInput>({
    resolver: localizedZodResolver(updateAreaBucketSchema),
    defaultValues: { areaId: "", name: "", description: "" },
  });

  function openCreate(areaId?: string) {
    createForm.reset({
      name: "",
      description: "",
      teamId: "",
      areaId: areaId || defaultAreaId,
    });
    setActionError(null);
    setDrawerMode("create");
  }

  function openEdit(project: ProjectRow) {
    editForm.reset({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
    });
    setEditingProject(project);
    setActionError(null);
    setDrawerMode("edit");
  }

  function openEditArea(bucket: ProjectRow) {
    areaForm.reset({
      areaId: bucket.areaId,
      name: bucket.name,
      description: bucket.description ?? "",
    });
    setEditingArea(bucket.areaId);
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
      fd.append("areaId", data.areaId);
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
      if (data.status) fd.append("status", data.status);
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
      if (editingProject?.areaId) {
        const result = await updateUserAreaAction({
          areaId: editingProject.areaId,
          name: data.name,
        });
        if (!result.success) {
          setActionError(result.error ?? "Failed to update area.");
          return;
        }
        closeDrawer();
        router.refresh();
        return;
      }
      const fd = new FormData();
      fd.append("areaId", data.areaId);
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
