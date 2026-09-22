import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

/** Logo + name + slogan as one LTR lockup (works inside RTL layouts). */
export function BrandMark({
  size = "md",
  className,
  showSlogan = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showSlogan?: boolean;
}) {
  const logoPx = size === "sm" ? 28 : size === "lg" ? 40 : 34;
  const titleCls =
    size === "sm"
      ? "text-sm font-semibold leading-tight tracking-tight"
      : size === "lg"
        ? "text-lg font-semibold leading-tight tracking-tight"
        : "text-base font-semibold leading-tight tracking-tight";
  const sloganCls =
    size === "sm"
      ? "text-[9px] leading-tight tracking-wide text-muted-foreground"
      : "text-[10px] leading-tight tracking-wide text-muted-foreground";

  return (
    <div
      dir="ltr"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <BrandLogo size={logoPx} />
      <div className="flex min-w-0 flex-col justify-center gap-0.5 text-start">
        <span className={cn(titleCls, "text-foreground")}>Mindora</span>
        {showSlogan ? (
          <span className={sloganCls}>Think. Plan. Grow</span>
        ) : null}
      </div>
    </div>
  );
}
