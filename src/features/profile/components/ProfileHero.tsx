import Link from "next/link";
import type { RankView } from "@/config/mastery";
import { CopyCrownsButton, type ShareCrown } from "@/features/crowns";
import { Emblem, Icon, UserAvatar } from "@/shared/ui";

interface ProfileHeroProps {
  user: { id: string; username: string; avatar_url: string | null; status_message: string };
  rank: RankView;
  crowns: ShareCrown[];
  isOwner: boolean;
  viewerId: string | null;
  shareUrl: boolean;
  onEdit: () => void;
}

export function ProfileHero({
  user,
  rank,
  crowns,
  isOwner,
  viewerId,
  shareUrl,
  onEdit,
}: ProfileHeroProps) {
  return (
    <section className="pf-hero">
      <div className="pf-av">
        <UserAvatar src={user.avatar_url} alt={user.username} size={96} className="pf-a" />
        <span className="pf-b" title={rank.title}>
          <Emblem rank={rank.rank} />
        </span>
      </div>
      <div className="pf-id">
        <span className="eyebrow">Hunter profile</span>
        <h1>{user.username}</h1>
        <div className="pf-m">
          <span className="pf-rk">{rank.title}</span>
          <span className="pf-idn">ID {user.id}</span>
        </div>
        {user.status_message && <p className="pf-q">&ldquo;{user.status_message}&rdquo;</p>}
      </div>
      <div className="pf-act">
        <CopyCrownsButton crowns={crowns} userId={user.id} includeUrl={shareUrl} />
        {viewerId && !isOwner && (
          <Link className="btn o sm" href={`/compare?a=${viewerId}&b=${user.id}`}>
            <Icon name="compare" />
            Compare with you
          </Link>
        )}
        {isOwner && (
          <Link className="btn o sm" href={`/compare?a=${user.id}`}>
            <Icon name="compare" />
            Compare with…
          </Link>
        )}
        {isOwner && (
          <button className="btn sm" onClick={onEdit}>
            <Icon name="edit" />
            Edit profile
          </button>
        )}
      </div>
    </section>
  );
}
