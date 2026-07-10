import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="mb-8 flex flex-col gap-6 rounded-2xl border border-white/5 bg-void-panel p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="max-w-xl flex-1 flex flex-col gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm" />
        </div>
        <div className="flex shrink-0 gap-3">
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-16 w-36" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 lg:col-span-2">
          <Skeleton className="mb-4 h-4 w-40" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-10 w-10 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-void-panel p-5">
          <Skeleton className="mb-4 h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
