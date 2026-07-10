import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
        <div className="rounded-2xl border border-white/5 bg-void-panel p-6 sm:p-8">
          <Skeleton className="h-3 w-28" />
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
            <Skeleton className="h-[84px] w-[84px] shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="mt-6 h-11 w-full" />
        </div>

        <div className="rounded-2xl border border-white/5 bg-void-panel p-6">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/5 bg-void-panel p-5 sm:p-6">
        <Skeleton className="mb-5 h-5 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
