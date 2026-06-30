"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { markAsRead, markAllAsRead } from "@/features/notifications/actions";

export function useNotifications() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function onMarkAsRead(id: string) {
    startTransition(async () => {
      await markAsRead(id);
      router.refresh();
    });
  }

  function onMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
    });
  }

  return { isPending, onMarkAsRead, onMarkAllAsRead };
}
