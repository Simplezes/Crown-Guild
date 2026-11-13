import { Skeleton } from "@/shared/ui";
import { HostCardSkeleton } from "./HostCardSkeleton";

const lines = [100, 100, 100, 100, 62];

function HeaderSkeleton() {
  return (
    <section className="p mh" aria-hidden="true">
      <div>
        <Skeleton width={130} height={11} />
        <div className="top2">
          <div className="big">
            <Skeleton width={88} height={88} radius={20} />
          </div>
          <Skeleton width="min(320px, 55%)" height={48} />
        </div>
        <div className="quote" style={{ display: "flex", flexDirection: "column", gap: 11, paddingBottom: 11 }}>
          {lines.map((width, index) => (
            <Skeleton key={index} width={`${width}%`} height={12} />
          ))}
        </div>
      </div>
      <div className="k4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="tile" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Skeleton width={42} height={32} />
            <Skeleton width={96} height={10} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionSkeleton({ cards }: { cards: number }) {
  return (
    <div className="hsec">
      <div className="hsh">
        <Skeleton width={120} height={14} />
        <Skeleton width={30} height={20} radius={99} />
      </div>
      <div className="hostgrid">
        {Array.from({ length: cards }, (_, index) => (
          <HostCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function SideSkeleton() {
  return (
    <div>
      <div className="pp phys">
        <div className="sec-h">
          <Skeleton width={120} height={18} />
        </div>
        {[2, 1, 3].map((count, group) => (
          <div key={group} className="grp">
            <small>
              <Skeleton width={84} height={10} />
            </small>
            <div className="pills2">
              {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} width={72} height={26} radius={8} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pp" style={{ marginTop: 16 }}>
        <div className="sec-h">
          <Skeleton width={110} height={18} />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bd">
            <Skeleton width={64} height={11} />
            <Skeleton width={26} height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonsterSkeleton() {
  return (
    <div className="wrap" role="status" aria-label="Loading monster">
      <span className="back" aria-hidden="true">
        <Skeleton width={92} height={12} />
      </span>
      <HeaderSkeleton />
      <section className="mbody" aria-hidden="true">
        <div className="pp">
          <div className="sec-h" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <Skeleton width={110} height={10} />
              <Skeleton width={170} height={20} className="mt6" />
            </div>
            <Skeleton width={150} height={40} radius={12} />
          </div>
          <Skeleton width="85%" height={12} className="mt6" />
          <Skeleton width={248} height={40} radius={12} className="mt14" />
          <SectionSkeleton cards={4} />
          <SectionSkeleton cards={2} />
        </div>
        <SideSkeleton />
      </section>
    </div>
  );
}
