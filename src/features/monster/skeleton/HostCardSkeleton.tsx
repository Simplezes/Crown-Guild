import { Skeleton } from "@/shared/ui";

export function HostCardSkeleton() {
  return (
    <div className="hk">
      <div className="hk-top">
        <Skeleton width={104} height={24} radius={99} />
        <Skeleton width={92} height={24} radius={99} />
      </div>
      <div className="hk-id">
        <Skeleton width={48} height={48} radius={14} />
        <div className="hk-nm">
          <Skeleton width={96} height={15} />
          <Skeleton width={72} height={12} className="mt6" />
        </div>
      </div>
      <div className="hk-rows">
        <div className="hk-row">
          <Skeleton width={16} height={16} radius={4} />
          <Skeleton width={56} height={11} />
          <Skeleton width={28} height={16} />
        </div>
      </div>
      <Skeleton width={170} height={14} />
      <Skeleton width="100%" height={42} radius={10} />
    </div>
  );
}
