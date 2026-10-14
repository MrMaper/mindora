/** Soft-nav skeleton for Today — matches the Starter one-column layout. */
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-11 min-w-0 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-11 w-16 shrink-0 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/70" />
        ))}
      </div>
    </div>
  );
}
