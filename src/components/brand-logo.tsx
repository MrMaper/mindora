import { cn } from "@/lib/utils";

/** Brand mark — plain img so auth middleware / image optimizer cannot break it. */
export function BrandLogo({
  size = 28,
  className,
  alt = "Mindora",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public asset; avoid _next/image failures
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
