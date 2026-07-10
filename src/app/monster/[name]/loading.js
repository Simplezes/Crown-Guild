import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Skeleton className="mb-6 h-4 w-20" />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
        <div className="rounded-2xl border border-white/5 bg-void-panel p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-[140px] w-[140px] shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-void-panel p-6">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]">
        <section className="rounded-2xl border border-white/5 bg-void-panel p-5 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2.5 h-16 w-full" />
          ))}
        </section>
        <aside className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </aside>
      </div>
    </main>
  );
}
