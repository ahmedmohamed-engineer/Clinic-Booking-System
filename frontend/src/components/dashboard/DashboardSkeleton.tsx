import { Skeleton } from "@/components/feedback/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-hidden="true">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <Skeleton variant="card" className="h-56" />
        <Skeleton variant="card" className="h-40" />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-4">
        <Skeleton variant="card" className="h-44" />
        <Skeleton variant="card" className="h-44" />
      </div>
    </div>
  );
}