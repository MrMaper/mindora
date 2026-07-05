import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-18 w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors outline-none placeholder:text-text-tertiary hover:not-focus:border-[var(--gray-400)] focus-visible:border-border-focus focus-visible:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-text-disabled disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:shadow-[0_0_0_3px_var(--red-tint)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
