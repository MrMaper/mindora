import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-transparent text-sm font-medium leading-none transition-colors outline-none select-none focus-visible:border-border-focus focus-visible:shadow-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:shadow-[0_0_0_3px_var(--red-tint)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-action-primary text-text-on-brand hover:bg-action-primary-hover active:bg-action-primary-active",
        outline:
          "border-border-strong bg-bg-surface text-text-primary hover:bg-bg-hover active:bg-bg-active",
        secondary:
          "border-border-strong bg-bg-surface text-text-primary hover:bg-bg-hover active:bg-bg-active",
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-active",
        destructive:
          "bg-red-500 text-white hover:bg-[#c93b40] active:bg-[#b23338]",
        link: "border-transparent bg-transparent p-0 text-text-brand underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[var(--control-height)] px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-[var(--control-height-sm)] gap-1 rounded-[var(--radius-sm)] px-2 text-xs in-data-[slot=button-group]:rounded-[var(--radius-sm)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[var(--control-height-sm)] gap-1 rounded-[var(--radius-sm)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[var(--radius-sm)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[var(--control-height-lg)] px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8 rounded-[var(--radius-sm)]",
        "icon-xs":
          "size-6 rounded-[var(--radius-sm)] in-data-[slot=button-group]:rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[var(--radius-sm)] in-data-[slot=button-group]:rounded-[var(--radius-sm)]",
        "icon-lg": "size-9 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
