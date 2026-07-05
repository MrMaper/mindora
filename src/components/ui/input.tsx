import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[var(--control-height)] w-full min-w-0 rounded-[var(--radius-sm)] border border-border-strong bg-bg-surface px-3 py-1 text-sm text-text-primary transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-tertiary hover:not-focus:border-[var(--gray-400)] focus-visible:border-border-focus focus-visible:shadow-[var(--ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-text-disabled disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:shadow-[0_0_0_3px_var(--red-tint)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
