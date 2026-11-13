import { Skeleton } from "@/shared/ui";
import { ProfileSidebarSkeleton } from "./ProfileSidebarSkeleton";

function RecordSkeleton() {
  return (
    <div className="aRec" aria-hidden="true">
      <div className="aHead pf-hunt-header">
        <div className="aH1">
          <Skeleton width={150} height={14} />
        </div>
        <div className="aH2">
          <Skeleton width={30} height={30} radius={8} />
        </div>
      </div>
      <div className="aParty">
        <Skeleton width="100%" height={148} radius={12} />
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="pf-hero" aria-hidden="true">
      <Skeleton width={96} height={96} radius={26} />
      <div className="pf-id">
        <Skeleton width={120} height={11} />
        <h1>
          <Skeleton width="min(300px, 80%)" height={38} />
        </h1>
        <div className="pf-m">
          <Skeleton width={84} height={24} radius={99} />
          <Skeleton width={150} height={12} />
        </div>
        <p className="pf-q">
          <Skeleton width="min(280px, 90%)" height={16} />
        </p>
      </div>
      <div className="pf-act">
        <Skeleton width={160} height={40} radius={10} />
        <Skeleton width={40} height={40} radius={10} />
      </div>
    </section>
  );
}

function MainSkeleton() {
  return (
    <section className="wd pf-main" aria-hidden="true">
      <div className="tabs3">
        {[110, 130, 120].map((width, index) => (
          <span key={index} style={{ padding: "18px 12px" }}>
            <Skeleton width={width} height={16} />
          </span>
        ))}
      </div>
      <div className="pf-body">
        <div className="ptools">
          <div className="pf-tools-main">
            <Skeleton width="100%" height={42} radius={12} />
          </div>
        </div>
        <div className="ggrid">
          {Array.from({ length: 6 }, (_, index) => (
            <RecordSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pad pf" role="status" aria-label="Loading profile">
      <HeroSkeleton />
      <div className="pf-cols">
        <ProfileSidebarSkeleton />
        <MainSkeleton />
      </div>
    </div>
  );
}
