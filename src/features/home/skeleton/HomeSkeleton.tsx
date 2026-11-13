import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 10 } as const;
const row = { display: "flex", alignItems: "center", gap: 14 } as const;

function WantedSkeleton() {
  return (
    <section className="wd s7 hm-wanted" aria-hidden="true">
      <Skeleton width={104} height={104} radius={16} />
      <div style={{ ...stack, flex: 1 }}>
        <Skeleton width={90} height={12} />
        <Skeleton width="60%" height={34} />
        <div style={row}>
          <Skeleton width={92} height={28} radius={99} />
          <Skeleton width={120} height={14} />
        </div>
        <Skeleton width="85%" height={8} radius={99} />
        <Skeleton width="55%" height={8} radius={99} />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Skeleton width={130} height={40} radius={10} />
          <Skeleton width={96} height={40} radius={10} />
        </div>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <section className="wd s5 hm-out" style={stack} aria-hidden="true">
      <Skeleton width={110} height={12} />
      <Skeleton width="60%" height={30} />
      <Skeleton width="85%" height={14} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} width={42} height={42} radius={99} />
        ))}
      </div>
      <div style={{ ...row, marginTop: "auto" }}>
        <Skeleton width={150} height={40} radius={10} />
        <Skeleton width={90} height={14} />
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="wd s12 hm-stats" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index}>
          <Skeleton width={30} height={30} radius={8} />
          <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={56} height={24} />
            <Skeleton width={84} height={10} />
          </span>
        </div>
      ))}
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div className="wd s12 board hm-board" style={{ minHeight: 385 }} aria-hidden="true">
      <div style={{ ...row, padding: "14px 0", gap: 12 }}>
        {[96, 86, 98, 90].map((width, index) => (
          <Skeleton key={index} width={width} height={40} radius={10} />
        ))}
      </div>
      <div className="b3">
        <div className="b3m" style={stack}>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} style={row}>
              <Skeleton width={24} height={24} radius={99} />
              <Skeleton width={34} height={34} radius={9} />
              <div style={{ ...stack, flex: 1, gap: 8 }}>
                <Skeleton width="30%" height={13} />
                <Skeleton width="100%" height={4} radius={99} />
              </div>
            </div>
          ))}
        </div>
        <aside className="b3s" style={stack}>
          <Skeleton width={90} height={10} />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} style={row}>
              <Skeleton width={26} height={26} radius={8} />
              <div style={{ ...stack, flex: 1, gap: 6 }}>
                <Skeleton width="55%" height={12} />
                <Skeleton width="80%" height={10} />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function RosterSkeleton() {
  return (
    <section className="wd s12 hm-roster" style={{ minHeight: 341 }} aria-hidden="true">
      <div className="hm-sech">
        <Skeleton width={140} height={20} />
        <Skeleton width={130} height={12} />
      </div>
      <div className="hm-rost">
        {Array.from({ length: 25 }, (_, index) => (
          <div key={index} style={row}>
            <Skeleton width={32} height={32} radius={8} />
            <Skeleton width="60%" height={12} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeSkeleton() {
  return (
    <div className="pad hm" role="status" aria-label="Loading">
      <div className="greet" style={stack}>
        <Skeleton width={300} height={32} />
        <Skeleton width={320} height={14} />
      </div>
      <div className="bento">
        <WantedSkeleton />
        <CardSkeleton />
        <StatsSkeleton />
        <BoardSkeleton />
        <RosterSkeleton />
      </div>
    </div>
  );
}
