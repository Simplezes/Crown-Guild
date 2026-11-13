import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 12 } as const;

function HostSkeleton() {
  return (
    <div className="hk" aria-hidden="true">
      <Skeleton width={96} height={22} radius={99} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={48} height={48} radius={99} />
        <div style={{ ...stack, flex: 1, gap: 8 }}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="80%" height={10} />
        </div>
      </div>
      <Skeleton width="100%" height={18} />
      <Skeleton width="100%" height={38} radius={10} />
    </div>
  );
}

export function MonsterSkeleton() {
  return (
    <div className="wrap" role="status" aria-label="Loading monster">
      <Skeleton width={96} height={14} />
      <section className="p mh" aria-hidden="true">
        <div style={stack}>
          <Skeleton width={120} height={12} />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Skeleton width={88} height={88} radius={18} />
            <Skeleton width={240} height={36} />
          </div>
          <Skeleton width="90%" height={14} />
          <Skeleton width="70%" height={14} />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Skeleton width={130} height={40} radius={10} />
            <Skeleton width={140} height={40} radius={10} />
          </div>
        </div>
        <div className="k4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="tile" style={{ ...stack, gap: 8 }}>
              <Skeleton width={40} height={28} />
              <Skeleton width={90} height={10} />
            </div>
          ))}
        </div>
      </section>
      <section className="mbody" aria-hidden="true">
        <div className="pp" style={stack}>
          <Skeleton width={160} height={24} />
          <div className="hostgrid">
            {Array.from({ length: 3 }, (_, index) => (
              <HostSkeleton key={index} />
            ))}
          </div>
        </div>
        <div className="pp" style={stack}>
          <Skeleton width={110} height={20} />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} width="100%" height={28} />
          ))}
        </div>
      </section>
    </div>
  );
}
