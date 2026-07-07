"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamSchema, updateTeamSchema, archiveTeamSchema, deleteTeamSchema } from "@/schemas/teams";
import {
  createTeam,
  updateTeam,
  archiveTeam,
  deleteTeam,
} from "@/features/teams/actions";
import type { CreateTeamInput, UpdateTeamInput } from "@/schemas/teams";
import type { TeamRow } from "@/features/teams/types";

type DrawerMode = "none" | "create" | "edit";

export function useTeams(initialSearch: string) {
  const router = useRouter();

  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("none");
  const [editingTeam, setEditingTeam] = React.useState<TeamRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TeamRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [search, setSearch] = React.useState(initialSearch);

  const createForm = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<UpdateTeamInput>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  function openCreate() {
    createForm.reset({ name: "", description: "" });
    setActionError(null);
    setDrawerMode("create");
  }

  function openEdit(team: TeamRow) {
    editForm.reset({ name: team.name, description: team.description ?? "" });
    setEditingTeam(team);
    setActionError(null);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode("none");
    setEditingTeam(null);
    setActionError(null);
  }

  const onCreateSubmit = createForm.handleSubmit((data) => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      const result = await createTeam(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to create team.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  const onEditSubmit = editForm.handleSubmit((data) => {
    if (!editingTeam) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description ?? "");
      const result = await updateTeam(editingTeam.id, fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update team.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  function onArchive(team: TeamRow) {
    startTransition(async () => {
      const result = await archiveTeam(team.id);
      if (!result.success) setActionError(result.error ?? "Failed to archive team.");
      else router.refresh();
    });
  }

  function onDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteTeam(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.success) setActionError(result.error ?? "Failed to delete team.");
      else router.refresh();
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/teams?${params.toString()}`);
  }

  return {
    drawerMode,
    editingTeam,
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
  };
}