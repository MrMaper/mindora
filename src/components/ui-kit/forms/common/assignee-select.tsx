"use client";

import * as React from "react";
import { Select } from "../select";
import { useTranslation } from "@/i18n/provider";
import type { UserRow } from "@/features/users/types";

export interface AssigneeSelectProps {
  label?: string;
  users?: UserRow[];
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function AssigneeSelect({
  label,
  users = [],
  disabled = false,
  className,
  value = "",
  onChange,
  placeholder,
}: AssigneeSelectProps) {
  const t = useTranslation();

  const [fetchedUsers, setFetchedUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!users.length && !loading && !fetchedUsers.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch("/api/users/active")
        .then(r => r.json())
        .then((data: UserRow[]) => {
          setFetchedUsers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const effectiveUsers = users.length ? users : fetchedUsers;

  const options = [
    { value: "", label: t.tasks.unassigned },
    ...effectiveUsers.map(usr => ({ value: usr.id, label: usr.name })),
  ];

  return (
    <Select
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}
