import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 8 } as const;

function RankSkeleton() {
  return (
    <section className="wd pf-rank" aria-hidden="true">
      <div className="pf-rt">
        <Skeleton width={76} height={76} radius={18} />
        <div style={stack}>
          <Skeleton width={72} height={10} />
          <Skeleton width={150} height={26} />
          <Skeleton width={64} height={13} />
        </div>
      </div>
      <div className="ladder mini">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} width="100%" height={30} radius={8} />
        ))}
      </div>
      <p className="pf-next">
        <Skeleton width={180} height={14} />
      </p>
      <div className="pf-tiles">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} style={{ ...stack, alignItems: "center", gap: 6 }}>
            <Skeleton width={28} height={20} />
            <Skeleton width={44} height={9} />
          </div>
        ))}
      </div>
    </section>
  );
}

function LobbySkeleton() {
  return (
    <section className="wd pf-lobby" aria-hidden="true">
      <div className="wh">
        <Skeleton width={110} height={16} />
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="lrow2">
          <div style={{ ...stack, flex: 1, gap: 6 }}>
            <Skeleton width={56} height={10} />
            <Skeleton width={110} height={16} />
          </div>
          <Skeleton width={36} height={36} radius={10} />
        </div>
      ))}
    </section>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <aside className="pf-side">
      <RankSkeleton />
      <LobbySkeleton />
    </aside>
  );
}
