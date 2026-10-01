"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import { createUserSchema, updateUserSchema } from "@/schemas/users";
import {
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
  forceLogoutUser,
  listUserLoginEventsAction,
} from "@/features/users/actions";
import type { CreateUserInput, UpdateUserInput } from "@/schemas/users";
import type { UserLoginEventRow, UserRow } from "@/features/users/types";
import {
  DEFAULT_MODULE_FLAGS,
  type ModuleFlags,
} from "@/lib/modules";

type DrawerMode = "none" | "create" | "edit";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
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
  const [resetPassword, setResetPassword] = React.useState<string | null>(null);
  const [loginEvents, setLoginEvents] = React.useState<UserLoginEventRow[]>(
    [],
  );
  const [isPending, startTransition] = React.useTransition();
  const [createModules, setCreateModules] = React.useState<ModuleFlags>({
    ...DEFAULT_MODULE_FLAGS,
  });
  const [editModules, setEditModules] = React.useState<ModuleFlags>({
    ...DEFAULT_MODULE_FLAGS,
  });

  const [search, setSearch] = React.useState(initialSearch);

  const [filters, setFilters] = React.useState<UserFilters>({
    search: initialSearch,
    role: "",
    status: "",
    sort: "createdAt",
    order: "desc",
  });

  const createForm = useForm<CreateUserInput>({
    resolver: localizedZodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "MEMBER", password: "" },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: localizedZodResolver(updateUserSchema),
    defaultValues: { name: "", role: "MEMBER" },
  });

  function openCreate() {
    createForm.reset({ name: "", email: "", role: "MEMBER", password: "" });
    setCreateModules({ ...DEFAULT_MODULE_FLAGS });
    setActionError(null);
    setCreatedPassword(null);
    setDrawerMode("create");
  }

  function openEdit(user: UserRow) {
    editForm.reset({ name: user.name, role: user.role });
    setEditModules({ ...user.enabledModules });
    setEditingUser(user);
    setActionError(null);
    setResetPassword(null);
    setLoginEvents([]);
    setDrawerMode("edit");
    startTransition(async () => {
      const result = await listUserLoginEventsAction(user.id);
      if (result.success) setLoginEvents(result.events);
    });
  }

  function closeDrawer() {
    setDrawerMode("none");
    setEditingUser(null);
    setActionError(null);
    setCreatedPassword(null);
    setResetPassword(null);
    setLoginEvents([]);
  }

  function appendModules(fd: FormData, flags: ModuleFlags) {
    for (const [k, v] of Object.entries(flags)) {
      fd.append(`module_${k}`, v ? "true" : "false");
    }
  }

  const onCreateSubmit = createForm.handleSubmit(data => {
    setActionError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("email", data.email);
      fd.append("role", "MEMBER");
      if (data.password) fd.append("password", data.password);
      appendModules(fd, createModules);
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
      fd.append("role", editingUser.role === "ADMIN" ? "ADMIN" : "MEMBER");
      if (editingUser.role !== "ADMIN") appendModules(fd, editModules);
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

  function onForceLogout(user: UserRow) {
    startTransition(async () => {
      const result = await forceLogoutUser(user.id);
      if (!result.success)
        setActionError(result.error ?? "Failed to revoke session.");
      else router.refresh();
    });
  }

  function onResetPassword() {
    if (!editingUser) return;
    startTransition(async () => {
      const result = await resetUserPassword(editingUser.id);
      if (!result.success) {
        setActionError(result.error ?? "Failed to reset password.");
        return;
      }
      setResetPassword((result.data?.tempPassword as string) ?? null);
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
    const merged = { ...filters, search, ...next };
    const params = new URLSearchParams();
    if (merged.search) params.set("search", merged.search);
    if (merged.role) params.set("role", merged.role);
    if (merged.status) params.set("status", merged.status);
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
    params.set("page", "1");
    router.push(`/users?${params.toString()}`);
  }

  function onClearFilters() {
    router.push(`/users?page=1`);
    setSearch("");
    setFilters({
      search: "",
      role: "",
      status: "",
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
    resetPassword,
    loginEvents,
    isPending,
    search,
    setSearch,
    filters,
    createForm,
    editForm,
    createModules,
    setCreateModules,
    editModules,
    setEditModules,
    openCreate,
    openEdit,
    closeDrawer,
    onCreateSubmit,
    onEditSubmit,
    onToggleStatus,
    onForceLogout,
    onResetPassword,
    onDeleteConfirm,
    onSearchSubmit,
    applyFilters,
    onFiltersChange,
    onClearFilters,
  };
}
