import { cn } from "./utils";
import { Card } from "./Card";

/** Single shimmering block. Compose these into page-shaped placeholders. */
export function Skeleton({ className, style }) {
  return <div className={cn("ds-skeleton h-4 w-full", className)} style={style} aria-hidden />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={index === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"} />
      ))}
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="min-h-[104px]">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-16" />
        </Card>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-line bg-surface-sunken px-4 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Full-page placeholder used as the Suspense fallback for lazy routes. */
export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-56" />
      </div>
      <SkeletonStatRow />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-64">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-44 w-full" />
        </Card>
        <Card className="h-64">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-44 w-full" />
        </Card>
      </div>
    </div>
  );
}
