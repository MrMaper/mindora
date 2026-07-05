"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong bg-bg-surface text-text-on-brand transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-[var(--gray-400)] focus-visible:border-border-focus focus-visible:shadow-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:shadow-[0_0_0_3px_var(--red-tint)] data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-on-brand",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
