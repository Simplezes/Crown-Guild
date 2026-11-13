import Image from "next/image";
import Link from "next/link";
import { CopyCrownsButton } from "@/features/crowns";
import type { ProfileData } from "@/server/services/profile";
import type { UserSummary } from "@/server/services/summary";
import { Emblem } from "@/shared/ui";
import { ShelfThumb } from "./HomeActions";

const SHELF_SIZE = 7;

interface GuildCardProps {
  profile: ProfileData;
  summary: UserSummary;
  monsterCount: number;
  shareUrl: boolean;
  className: string;
}

export function GuildCard({ profile, summary, monsterCount, shareUrl, className }: GuildCardProps) {
  const { stats, collection } = profile;
  const nextRank = summary.rank < 8 ? summary.rank + 1 : null;
  const shelf = collection.slice(0, SHELF_SIZE);
  const hidden = monsterCount - shelf.length;

  return (
    <section className={`wd hm-gc ${className}`}>
      <div className="g4-top">
        <div className="g4e">
          <Emblem rank={summary.rank} />
        </div>
        <div className="g4w">
          <small>Your Guild Card</small>
          <h3 className="rk">{summary.title}</h3>
          <p className="g4s">
            <span>
              <Image src="/icons/smallcrown.png" alt="" width={15} height={15} className="px" />
              <b>{stats.small || 0}</b> small
            </span>
            <span>
              <Image src="/icons/largecrown.png" alt="" width={15} height={15} className="px" />
              <b>{stats.large || 0}</b> large
            </span>
            <span>
              <b>{stats.tempered || 0}</b> tempered
            </span>
          </p>
        </div>
        <div className="g4mp">
          <b>{summary.mp}</b>
          <span>MP</span>
        </div>
      </div>
      {nextRank ? (
        <div className="g4-next">
          <div className="g4row">
            <div className="g4bar">
              <i style={{ width: `${summary.progress}%` }} />
            </div>
            <div className="g4ne" title={summary.nextTitle ?? undefined}>
              <Emblem rank={nextRank} />
            </div>
          </div>
          <p className="g4np">
            <b>{summary.toNext} MP</b> to reach {summary.nextTitle}
          </p>
        </div>
      ) : (
        <p className="g4-max">You have reached the highest rank.</p>
      )}
      <div className="g4-shelf">
        <div className="g4-shelf-bar">
          <span className="g4c">
            <b>{collection.length}</b>/{monsterCount} collected
          </span>
          <CopyCrownsButton
            crowns={profile.crowns}
            userId={profile.user.id}
            includeUrl={shareUrl}
          />
        </div>
        <div className="g4r">
          {shelf.map((entry) => (
            <ShelfThumb
              key={entry.monster_id}
              name={entry.monster_name}
              image={entry.image_name}
              type={entry.type}
            />
          ))}
          {hidden > 0 && (
            <Link
              className="g4t empty"
              href={`/profile/${profile.user.id}`}
              title="See your full collection"
            >
              <span>+{hidden}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
