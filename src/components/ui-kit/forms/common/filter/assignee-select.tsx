"use client";

import * as React from "react";
import { Select } from "../../select";
import { getTranslations } from "@/i18n";
import { useSelectLanguage } from "../select-provider";
import type { UserRow } from "@/features/users/types";

export interface FilterAssigneeSelectProps {
  value: string;
  onChange: (value: string) => void;
  users?: UserRow[];
  className?: string;
  placeholder?: string;
}

export function FilterAssigneeSelect({
  value = "",
  onChange,
  users = [],
  className,
  placeholder,
}: FilterAssigneeSelectProps) {
  const language = useSelectLanguage();
  const t = getTranslations(language);

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
    { value: "", label: t.tasks.allAssignees },
    ...effectiveUsers.map(usr => ({ value: usr.id, label: usr.name })),
  ];

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  );
}
