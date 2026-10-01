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
      ? "text-sm font-semibold leading-none tracking-tight"
      : size === "lg"
        ? "text-lg font-semibold leading-none tracking-tight"
        : "text-base font-semibold leading-none tracking-tight";
  const sloganCls =
    size === "sm"
      ? "text-[9px] leading-none tracking-wide text-muted-foreground"
      : "text-[10px] leading-none tracking-wide text-muted-foreground";

  return (
    <div
      dir="ltr"
      className={cn(
        "inline-flex items-center",
        showSlogan ? "gap-2.5" : "gap-1.5",
        className,
      )}
    >
      <BrandLogo size={logoPx} className="block" />
      {showSlogan ? (
        <div className="flex min-w-0 flex-col justify-center gap-0.5 text-start">
          <span className={cn(titleCls, "text-foreground")}>Mindora</span>
          <span className={sloganCls}>Think. Plan. Grow</span>
        </div>
      ) : (
        // Cap-height ink sits high in the em-box (no descenders); nudge down to
        // optically center with the logo in the compact mobile header.
        <span
          className={cn(
            titleCls,
            "translate-y-[2px] text-foreground",
          )}
        >
          Mindora
        </span>
      )}
    </div>
  );
}
