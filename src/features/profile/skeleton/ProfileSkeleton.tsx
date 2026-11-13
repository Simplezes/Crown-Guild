import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 10 } as const;

function RecordSkeleton() {
  return (
    <div className="aRec" aria-hidden="true">
      <div className="aHead">
        <Skeleton width={120} height={20} />
        <Skeleton width={74} height={26} radius={8} />
      </div>
      <div className="aParty">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} width="100%" height={118} radius={12} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pad pf" role="status" aria-label="Loading profile">
      <section className="pf-hero" aria-hidden="true">
        <Skeleton width={96} height={96} radius={99} />
        <div style={stack}>
          <Skeleton width={100} height={12} />
          <Skeleton width={240} height={34} />
          <Skeleton width={180} height={14} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Skeleton width={120} height={38} radius={10} />
          <Skeleton width={120} height={38} radius={10} />
        </div>
      </section>
      <div className="pf-cols">
        <aside className="pf-side" aria-hidden="true">
          <section className="wd pf-rank" style={stack}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Skeleton width={56} height={56} radius={14} />
              <div style={{ ...stack, gap: 8 }}>
                <Skeleton width={70} height={10} />
                <Skeleton width={110} height={20} />
              </div>
            </div>
            <Skeleton width="100%" height={36} />
            <Skeleton width="60%" height={12} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} width="100%" height={52} radius={10} />
              ))}
            </div>
          </section>
        </aside>
        <section className="wd pf-main" aria-hidden="true">
          <div style={{ display: "flex", gap: 10, padding: 16 }}>
            {[96, 110, 100].map((width, index) => (
              <Skeleton key={index} width={width} height={36} radius={10} />
            ))}
          </div>
          <div className="pf-body">
            <Skeleton width="50%" height={40} radius={10} />
            <div className="ggrid" style={{ marginTop: 14 }}>
              {Array.from({ length: 6 }, (_, index) => (
                <RecordSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
