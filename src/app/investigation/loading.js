import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="mb-8 rounded-2xl border border-white/5 bg-void-panel p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl flex-1 flex flex-col gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-32" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-void-panel p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="mt-3 h-8 w-full" />
          </div>
        ))}
      </section>
    </main>
  );
}
