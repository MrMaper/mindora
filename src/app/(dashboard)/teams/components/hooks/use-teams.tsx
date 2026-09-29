"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
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

export interface TeamFilters {
  status: string;
}

export function useTeams(initialSearch: string) {
  const router = useRouter();

  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("none");
  const [editingTeam, setEditingTeam] = React.useState<TeamRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TeamRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [search, setSearch] = React.useState(initialSearch);

  const [filters, setFilters] = React.useState<TeamFilters>({
    status: "",
  });

  const createForm = useForm<CreateTeamInput>({
    resolver: localizedZodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<UpdateTeamInput>({
    resolver: localizedZodResolver(updateTeamSchema),
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

  const hasActiveFilters = !!search || !!filters.status;

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({});
  }

  function onFiltersChange(filter: Partial<TeamFilters>) {
    setFilters(prev => ({ ...prev, ...filter }));
    const params = new URLSearchParams();
    const newFilters = { ...filters, ...filter };
    if (search) params.set("search", search);
    if (newFilters.status) params.set("status", newFilters.status);
    params.set("page", "1");
    router.push(`/teams?${params.toString()}`);
  }

  function applyFilters(next: Partial<TeamFilters>) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (next.status) params.set("status", next.status);
    else if (filters.status) params.set("status", filters.status);
    params.set("page", "1");
    router.push(`/teams?${params.toString()}`);
  }

  function onClearFilters() {
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`/teams?${params.toString()}`);
    setSearch("");
    setFilters({ status: "" });
  }

  function onView(team: TeamRow) {
    router.push(`/teams/${team.id}`);
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
    hasActiveFilters,
    filters,
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
    onFiltersChange,
    onClearFilters,
    onView,
  };
}