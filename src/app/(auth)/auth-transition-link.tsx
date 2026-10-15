"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./auth-stage.module.css";

const EXIT_MS = 420;

type AuthTransitionLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Auth page link with shell exit animation before navigation
 * (forgot ↔ login, reset, etc.).
 */
export function AuthTransitionLink({
  href,
  className,
  children,
}: AuthTransitionLinkProps) {
  const router = useRouter();
  const [leaving, setLeaving] = React.useState(false);

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      leaving
    ) {
      return;
    }

    e.preventDefault();
    setLeaving(true);

    const shell =
      document.querySelector<HTMLElement>("[data-auth-shell]") ??
      document.querySelector<HTMLElement>(`.${styles.shell}`);
    shell?.classList.add(styles.shellLeaving);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : EXIT_MS;

    window.setTimeout(() => {
      router.push(href);
    }, delay);
  }

  return (
    <Link
      href={href}
      className={cn(className, leaving && styles.linkLeaving)}
      onClick={onClick}
      aria-busy={leaving || undefined}
    >
      {children}
    </Link>
  );
}
