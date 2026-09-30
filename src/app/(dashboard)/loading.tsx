/** Instant feedback while soft-nav waits on the next page RSC. Shell/sidebar stay. */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-muted/60"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/50" />
    </div>
  );
}
