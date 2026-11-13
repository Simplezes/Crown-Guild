import { Skeleton } from "@/shared/ui";

const stack = { display: "flex", flexDirection: "column", gap: 10 } as const;

function CardSkeleton() {
  return (
    <div className="m2" aria-hidden="true">
      <div className="m2t">
        <Skeleton width={44} height={44} radius={10} />
        <div style={{ ...stack, flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      <div className="m2s">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} style={{ ...stack, alignItems: "center", gap: 8 }}>
            <Skeleton width={34} height={22} />
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
        <div style={stack}>
          <Skeleton width={170} height={30} />
          <Skeleton width={360} height={14} />
        </div>
      </div>
      <div className="m2b">
        <Skeleton width={280} height={40} radius={10} />
        <div style={{ display: "flex", gap: 8 }}>
          {[70, 96, 100, 92].map((width, index) => (
            <Skeleton key={index} width={width} height={36} radius={10} />
          ))}
        </div>
        <span className="sp" />
        <Skeleton width={120} height={36} radius={10} />
      </div>
      <div className="m2g">
        {Array.from({ length: 8 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
