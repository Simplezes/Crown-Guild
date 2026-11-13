import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 10 } as const;
const row = { display: "flex", alignItems: "center", gap: 14 } as const;

function WantedSkeleton() {
  return (
    <section className="wd s7 hm-wanted" aria-hidden="true">
      <Skeleton className="hm-wsk" radius={22} />
      <div style={{ ...stack, flex: 1, gap: 14 }}>
        <Skeleton width={100} height={12} />
        <Skeleton width="min(320px, 70%)" height={52} />
        <div style={row}>
          <Skeleton width={96} height={30} radius={99} />
          <Skeleton width={120} height={14} />
        </div>
        <Skeleton width="85%" height={14} />
        <Skeleton width="85%" height={14} />
        <Skeleton width={110} height={12} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Skeleton width="min(160px, 100%)" height={44} radius={10} />
          <Skeleton width="min(96px, 100%)" height={44} radius={10} />
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
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} width={38} height={38} radius={99} />
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
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={56} height={31} />
            <Skeleton width={84} height={11} />
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
    <section className="wd s12 hm-roster" aria-hidden="true">
      <div className="hm-sech">
        <Skeleton width={140} height={20} />
        <Skeleton width={130} height={12} />
      </div>
      <div className="hm-rost">
        {Array.from({ length: 28 }, (_, index) => (
          <div key={index} className="hm-rsk">
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
      <div className="greet" aria-hidden="true">
        <h2>
          <Skeleton width="min(300px, 80%)" height={36} />
        </h2>
        <p>
          <Skeleton width="min(320px, 90%)" height={20} />
        </p>
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
