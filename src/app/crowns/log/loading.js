import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Skeleton className="mb-6 h-4 w-16" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />

      <Skeleton className="mt-6 h-48 w-full rounded-2xl" />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </main>
  );
}
