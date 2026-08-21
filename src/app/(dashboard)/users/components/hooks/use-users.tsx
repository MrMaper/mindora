"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema } from "@/schemas/users";
import {
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "@/features/users/actions";
import type { CreateUserInput, UpdateUserInput } from "@/schemas/users";
import type { UserRow } from "@/features/users/types";

type DrawerMode = "none" | "create" | "edit";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  teamId: string;
  sort: string;
  order: string;
}

export function useUsers(initialSearch: string) {
  const router = useRouter();

  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("none");
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserRow | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = React.useState<string | null>(
    null,
  );
  const [isPending, startTransition] = React.useTransition();

  const [search, setSearch] = React.useState(initialSearch);

  const [filters, setFilters] = React.useState<UserFilters>({
    search: initialSearch,
    role: "",
    status: "",
    teamId: "",
    sort: "createdAt",
    order: "desc",
  });

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "MEMBER" },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: "", role: "MEMBER" },
  });

  function openCreate() {
    createForm.reset({ name: "", email: "", role: "MEMBER" });
    setActionError(null);
    setCreatedPassword(null);
    setDrawerMode("create");
  }

  function openEdit(user: UserRow) {
    editForm.reset({ name: user.name, role: user.role });
    setEditingUser(user);
    setActionError(null);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode("none");
    setEditingUser(null);
    setActionError(null);
    setCreatedPassword(null);
  }

  const onCreateSubmit = createForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("email", data.email);
      fd.append("role", data.role);
      const result = await createUser(fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to create user.");
        return;
      }
      setCreatedPassword((result.data?.tempPassword as string) ?? null);
      router.refresh();
    });
  });

  const onEditSubmit = editForm.handleSubmit(data => {
    if (!editingUser) return;
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("role", data.role);
      const result = await updateUser(editingUser.id, fd);
      if (!result.success) {
        setActionError(result.error ?? "Failed to update user.");
        return;
      }
      closeDrawer();
      router.refresh();
    });
  });

  function onToggleStatus(user: UserRow) {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id);
      if (!result.success)
        setActionError(result.error ?? "Failed to update status.");
      else router.refresh();
    });
  }

  function onDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      if (!result.success)
        setActionError(result.error ?? "Failed to delete user.");
      else router.refresh();
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search });
  }

  function applyFilters(next: Partial<UserFilters>) {
    const merged = { search, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", search);
    if (merged.role) params.set("role", merged.role);
    if (merged.status) params.set("status", merged.status);
    if (merged.teamId) params.set("teamId", merged.teamId);
    if (merged.sort) params.set("sort", merged.sort);
    if (merged.order) params.set("order", merged.order);
    params.set("page", "1");
    router.push(`/users?${params.toString()}`);
  }

  function onFiltersChange(filter: Partial<UserFilters>) {
    setFilters(prev => ({ ...prev, ...filter }));
    const params = new URLSearchParams();
    const newFilters = { ...filters, ...filter };
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.role) params.set("role", newFilters.role);
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.teamId) params.set("teamId", newFilters.teamId);
    params.set("page", "1");
    router.push(`/users?${params.toString()}`);
  }

  function onClearFilters() {
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`/users?${params.toString()}`);
    setSearch("");
    setFilters({
      search: "",
      role: "",
      status: "",
      teamId: "",
      sort: "createdAt",
      order: "desc",
    });
  }

  return {
    drawerMode,
    editingUser,
    deleteTarget,
    setDeleteTarget,
    actionError,
    setActionError,
    createdPassword,
    isPending,
    search,
    setSearch,
    filters,
    setFilters,
    createForm,
    editForm,
    openCreate,
    openEdit,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
    onToggleStatus,
    onDeleteConfirm,
    onSearchSubmit,
    applyFilters,
    onFiltersChange,
    onClearFilters,
  };
}
