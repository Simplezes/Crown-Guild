import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 8 } as const;

function CardSkeleton() {
  return (
    <div className="m2" aria-hidden="true">
      <div className="m2t">
        <Skeleton width={52} height={52} radius={14} />
        <div style={{ ...stack, flex: 1 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      <div className="m2s">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} style={{ ...stack, alignItems: "center", gap: 6 }}>
            <Skeleton width={34} height={24} />
            <Skeleton width={54} height={10} />
          </div>
        ))}
      </div>
      <div className="m2f">
        <Skeleton width={90} height={22} />
        <Skeleton width={96} height={32} radius={8} />
      </div>
    </div>
  );
}

export function RegistrySkeleton() {
  return (
    <div className="pad m2page" role="status" aria-label="Loading monsters">
      <div className="m2h">
        <div>
          <h2>
            <Skeleton width={200} height={48} />
          </h2>
          <p>
            <Skeleton width="min(360px, 100%)" height={20} />
          </p>
        </div>
      </div>
      <div className="m2b">
        <div className="m2b-q">
          <Skeleton width="100%" height={40} radius={12} />
        </div>
        <div className="m2ch">
          {[70, 96, 100, 92].map((width, index) => (
            <span key={index} className="m2ch-sk" style={{ minWidth: width }}>
              <Skeleton width="100%" />
            </span>
          ))}
        </div>
        <span className="sp" />
        <Skeleton width={120} height={36} radius={10} />
        <Skeleton width={80} height={36} radius={10} className="vt" />
      </div>
      <div className="m2g">
        {Array.from({ length: 8 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <Skeleton width={236} height={44} radius={14} />
      </div>
    </div>
  );
}
