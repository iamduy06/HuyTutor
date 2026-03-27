import { Skeleton } from "@/components/ui/skeleton";

export default function DecksLoading() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-72 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
