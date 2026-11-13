import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 10 } as const;

function SelectorSkeleton() {
  return (
    <div className="cmp-field" style={stack}>
      <Skeleton width={80} height={12} />
      <Skeleton width="100%" height={58} radius={12} />
    </div>
  );
}

export function CompareSkeleton() {
  return (
    <div className="pad cmp-page" role="status" aria-label="Loading comparison">
      <header className="cmp-head" aria-hidden="true">
        <div style={stack}>
          <Skeleton width={230} height={30} />
          <Skeleton width={360} height={14} />
        </div>
        <Skeleton width={110} height={28} radius={99} />
      </header>
      <section className="cmp-pair" aria-hidden="true">
        <div className="cmp-pair-head">
          <div style={stack}>
            <Skeleton width={150} height={18} />
            <Skeleton width={340} height={12} />
          </div>
          <Skeleton width={110} height={22} radius={99} />
        </div>
        <div className="cmp-selectors">
          <SelectorSkeleton />
          <span className="cmp-vs">VS</span>
          <SelectorSkeleton />
          <Skeleton width={170} height={44} radius={10} />
        </div>
      </section>
      <section className="cmp-empty-state" aria-hidden="true">
        <Skeleton width={44} height={44} radius={12} />
        <div style={stack}>
          <Skeleton width={220} height={16} />
          <Skeleton width={420} height={12} />
        </div>
      </section>
    </div>
  );
}
