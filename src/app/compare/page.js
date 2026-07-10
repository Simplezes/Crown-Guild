import Image from "next/image";
import CompareForm from "./CompareForm";
import MonsterIcon from "@/components/ui/MonsterIcon";
import { getRankProgress } from "@/lib/profile";
import { getCompareData } from "./compareData";
import UserAvatar from "@/components/ui/UserAvatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPlainUser(user, fallback) {
  if (!user) return fallback || null;
  return {
    id: String(user.id || fallback?.id || ""),
    username: user.username || fallback?.username || "Unknown Hunter",
    avatar_url: user.avatar_url || null,
  };
}

export async function generateMetadata({ searchParams }) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const data = await getCompareData(a, b);
  if (!data) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const overlapCount = data.both?.length || 0;
  const totalTracked = overlapCount + (data.onlyA?.length || 0) + (data.onlyB?.length || 0);
  const overlapRate = totalTracked > 0 ? Math.round((overlapCount / totalTracked) * 100) : 0;

  return {
    title: `${data.userA.username} vs ${data.userB.username} | Hunter Compare`,
    description: `${overlapCount} shared targets • ${data.sharedOwnedCount} shared crown species • ${overlapRate}% match`,
  };
}

function CrownIcons({ type }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {(type === "small" || type === "both") && (
        <Image src="/icons/smallcrown.png" width={14} height={14} alt="S" className="pixel-art" />
      )}
      {(type === "large" || type === "both") && (
        <Image src="/icons/largecrown.png" width={14} height={14} alt="L" className="pixel-art" />
      )}
    </span>
  );
}

function MetricTile({ label, value, emphasis }) {
  return (
    <div
      className={`rounded-xl border px-5 py-4 text-center ${
        emphasis ? "border-ember/30 bg-ember/10" : "border-white/5 bg-void"
      }`}
    >
      <p className="font-display text-2xl text-ember-bright">{value}</p>
      <p className="mt-1 font-body text-[11px] uppercase tracking-wider text-mist-dim">{label}</p>
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
      <h2 className="font-display text-sm uppercase tracking-[0.15em] text-mist">{title}</h2>
      {typeof count === "number" && (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-xs text-mist-dim">
          {count}
        </span>
      )}
    </div>
  );
}

function CrownListItem({ item }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-void px-3 py-2.5">
      <MonsterIcon imageName={item.image_name} name={item.monster_name} size={32} />
      <span className="flex-1 truncate font-body text-sm text-mist">{item.monster_name}</span>
      <CrownIcons type={item.type} />
    </div>
  );
}

function WishlistColumn({ title, items, emptyText, accent }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-void-panel p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className={`font-display text-sm uppercase tracking-[0.15em] ${accent}`}>{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-xs text-mist-dim">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center font-body text-sm italic text-mist-dim">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <CrownListItem key={item.monster_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountPanel({ user, rank, stats, masteryPoints, completion }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-void-panel p-5">
      <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
        <UserAvatar
          src={user.avatar_url}
          alt={user.username}
          size={44}
          className="h-11 w-11 rounded-full border border-white/10 object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate font-display text-base text-ember-bright">{user.username}</h3>
          <p className="font-body text-xs uppercase tracking-wider text-mist-dim">{rank || "Fledgling"}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[
          ["Total Crowns", stats?.total || 0],
          ["Mastery Points", masteryPoints || 0],
          ["Collection Completion", `${completion || 0}%`],
          ["Small Crowns", stats?.small || 0],
          ["Large Crowns", stats?.large || 0],
          ["Tempered Crowns", stats?.tempered || 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-void px-3 py-2 font-body text-sm text-mist-dim"
          >
            <span>{label}</span>
            <strong className="font-display text-sm font-normal text-mist">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }) {
  const { a, b } = await searchParams;
  const data = a && b ? await getCompareData(a, b) : null;
  const initialA = toPlainUser(data?.userA, a ? { id: a, username: "Hunter A" } : null);
  const initialB = toPlainUser(data?.userB, b ? { id: b, username: "Hunter B" } : null);
  const overlapCount = data?.both?.length || 0;
  const onlyACount = data?.onlyA?.length || 0;
  const onlyBCount = data?.onlyB?.length || 0;
  const totalTracked = overlapCount + onlyACount + onlyBCount;
  const overlapRate = totalTracked > 0 ? Math.round((overlapCount / totalTracked) * 100) : 0;
  const rankA = data ? getRankProgress(Number(data.profileA?.masteryPoints || 0)).currentRank?.title : null;
  const rankB = data ? getRankProgress(Number(data.profileB?.masteryPoints || 0)).currentRank?.title : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      
      <section className="mb-6 flex flex-col gap-6 rounded-2xl border border-white/5 bg-void-panel p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="max-w-xl">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-ember-dim">Wishlist Tools</span>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">Compare Hunters</h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-mist-dim">
            Find which crowns two hunters share, and where their goals diverge.
          </p>
        </div>

        {data && (
          <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
            <div className="rounded-xl border border-white/5 bg-void px-5 py-4 text-center sm:min-w-[9rem]">
              <p className="font-display text-2xl text-ember-bright">{overlapCount}</p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-wider text-mist-dim">Shared Targets</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-void px-5 py-4 text-center sm:min-w-[9rem]">
              <p className="font-display text-2xl text-ember-bright">{overlapRate}%</p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-wider text-mist-dim">Match Rate</p>
            </div>
          </div>
        )}
      </section>

      
      <section className="mb-8 rounded-2xl border border-white/5 bg-void-panel p-5">
        <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ember-dim">Hunter Pairing</h2>
        <CompareForm initialA={initialA} initialB={initialB} />
      </section>

      {data && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label="Shared Targets" value={overlapCount} />
            <MetricTile label={`${data.userA.username}'s Wishlist`} value={onlyACount} />
            <MetricTile label={`${data.userB.username}'s Wishlist`} value={onlyBCount} />
            <MetricTile label="Shared Match" value={`${overlapRate}%`} emphasis />
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AccountPanel
              user={data.userA}
              rank={rankA}
              stats={data.profileA?.stats}
              masteryPoints={data.profileA?.masteryPoints}
              completion={data.profileA?.completion}
            />
            <AccountPanel
              user={data.userB}
              rank={rankB}
              stats={data.profileB?.stats}
              masteryPoints={data.profileB?.masteryPoints}
              completion={data.profileB?.completion}
            />
          </section>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile label="Shared Crown Species" value={data.sharedOwnedCount} />
            <MetricTile label={`Unique Species ${data.userA.username}`} value={data.onlyOwnedA} />
            <MetricTile label={`Unique Species ${data.userB.username}`} value={data.onlyOwnedB} />
            <MetricTile
              label="Combined Species"
              value={data.sharedOwnedCount + data.onlyOwnedA + data.onlyOwnedB}
              emphasis
            />
          </section>

          <section className="mb-6 rounded-2xl border border-white/5 bg-void-panel p-5">
            <SectionHeader title="Shared Hunt Board" count={data.both.length} />
            {data.both.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.both.map((item) => (
                  <CrownListItem key={item.monster_id} item={item} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center font-body text-sm italic text-mist-dim">
                No overlap yet. Try comparing another pair to find matching hunts.
              </p>
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WishlistColumn
              title={`${data.userA.username}'s Wishlist`}
              items={data.onlyA}
              emptyText="Nothing exclusive to this hunter."
              accent="text-ember-bright"
            />
            <WishlistColumn
              title={`${data.userB.username}'s Wishlist`}
              items={data.onlyB}
              emptyText="Nothing exclusive to this hunter."
              accent="text-tempered"
            />
          </section>
        </>
      )}

      {a && b && !data && (
        <div className="rounded-2xl border border-white/5 bg-void-panel p-5 font-body text-sm text-mist-dim">
          Could not load comparison. Try selecting both hunters again.
        </div>
      )}
    </main>
  );
}
