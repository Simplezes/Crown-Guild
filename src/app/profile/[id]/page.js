import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { getProfileData, getRankProgress } from "@/lib/profile";
import DiscordShare from "@/components/ui/DiscordShare";
import { getAllMonsters } from "@/lib/monsters";
import Inventory from "@/components/profile/Inventory";
import MasteryInfo from "@/components/profile/MasteryInfo";
import CompareWithButton from "@/components/profile/CompareWithButton";
import InfoTrigger from "@/components/ui/InfoTrigger";
import UserAvatar from "@/components/ui/UserAvatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildProfileOgVersion(data) {
  let checksum = 0;

  for (const crown of data.crowns || []) {
    checksum = (checksum * 31 + Number(crown.id || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.tempered || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.strength_rating || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.remaining_uses ?? 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.investigation_id || 0)) >>> 0;
  }

  for (const w of data.wishlist || []) {
    checksum = (checksum * 31 + Number(w.monster_id || 0)) >>> 0;
    checksum = (checksum * 31 + Number(w.tempered || 0)) >>> 0;
    checksum = (checksum * 31 + String(w.type || "").length) >>> 0;
  }

  checksum = (checksum * 31 + String(data.user?.username || "").length) >>> 0;
  checksum = (checksum * 31 + String(data.user?.status_message || "").length) >>> 0;

  return [
    Number(data.stats?.total || 0),
    Number(data.stats?.small || 0),
    Number(data.stats?.large || 0),
    Number(data.masteryPoints || 0),
    checksum.toString(36),
  ].join("-");
}

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const search = await searchParams;
  const shareNonce = search?.share || search?.t || null;
  const data = await getProfileData(id);

  if (!data) {
    return { title: "Hunter Not Found" };
  }

  const ogVersion = buildProfileOgVersion(data);
  const nonceParam = shareNonce ? `&share=${encodeURIComponent(String(shareNonce))}` : "";
  const imageUrl = `/profile/${encodeURIComponent(id)}/og?v=${encodeURIComponent(ogVersion)}${nonceParam}`;
  const { currentRank } = getRankProgress(Number(data.masteryPoints || 0));
  const rankTitle = currentRank?.title || "Fledgling";

  return {
    openGraph: {
      title: `${data.user.username}'s Guild Card`,
      description: `${rankTitle} Hunter • ${data.masteryPoints || 0} MP`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function Profile({ params }) {
  const { id } = await params;
  const [session, data, allMonsters] = await Promise.all([
    auth(),
    getProfileData(id),
    getAllMonsters(true),
  ]);
  const isOwner = session?.user?.id === id;

  if (!data) notFound();

  const { user, crowns, stats, masteryPoints } = data;
  const { currentRank, nextRank, progress } = getRankProgress(masteryPoints || 0);
  const userRank = currentRank.title;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-void-panel">
        <div className="border-b border-white/5 bg-gradient-to-r from-ember/10 via-transparent to-transparent px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                src={user.avatar_url}
                alt={user.username}
                size={84}
                className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em] text-ember-dim">
                  <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                  Hunter Profile
                </span>
                <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">{user.username}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blood/30 bg-blood/20 px-3 py-1 font-display text-xs uppercase tracking-wider text-blood-bright">{userRank}</span>
                  <span className="font-body text-xs text-mist-faint">ID: {user.id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{stats.total || 0}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Crowns</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{stats.small || 0}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Small</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <p className="font-display text-xl sm:text-2xl text-ember-bright">{stats.large || 0}</p>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Large</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-void px-2 py-3 sm:px-4 text-center">
                <div className="flex items-center gap-1.5">
                  <p className="font-display text-xl sm:text-2xl text-ember-bright">{masteryPoints}</p>
                  <InfoTrigger title="Collection Mastery" content={<MasteryInfo points={masteryPoints} rank={userRank} nextRank={nextRank} progress={progress} />} align="right" />
                </div>
                <p className="mt-1 font-body text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-mist-dim truncate">Mastery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:px-7">
          {user.status_message && (
            <p className="font-body text-sm italic text-mist-dim border-b border-white/5 pb-4">&quot;{user.status_message}&quot;</p>
          )}
          
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 lg:max-w-md">
              <div className="flex items-center justify-between mb-1.5 font-body text-xs text-mist-dim">
                <span>{Math.round(progress)}% to {nextRank ? nextRank.title : 'Max'}</span>
                {nextRank && <span>{nextRank.minPoints - masteryPoints} MP</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-void">
                <div className="h-full rounded-full bg-ember" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CompareWithButton baseUserId={user.id} baseUsername={user.username} variant="identity" />
              <DiscordShare id={user.id} username={user.username} crowns={crowns} wishlist={data.wishlist} />
            </div>
          </div>
        </div>
      </section>

      
      {(user.lobby_id || isOwner) && (
        <section className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-void-panel p-5">
          <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-mist">
            <Image src="/icons/MHWilds-Lobby_Icon.png" width={16} height={16} alt="" className="pixel-art" />
            Lobby Info
          </div>
          {user.lobby_id ? (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-void px-3 py-2">
                <span className="font-body text-xs uppercase tracking-wider text-mist-dim">Lobby ID</span>
                <code className="font-display text-sm text-ember-bright">{user.lobby_id}</code>
              </div>
              {user.quest_password && (
                <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-void px-3 py-2">
                  <span className="font-body text-xs uppercase tracking-wider text-mist-dim">Passcode</span>
                  <code className="font-display text-sm text-ember-bright">{user.quest_password}</code>
                </div>
              )}
            </div>
          ) : (
            <p className="font-body text-sm italic text-mist-dim">No active lobby — standing by.</p>
          )}
          <div className="ml-auto">
            <ProfileSettings user={user} isOwner={isOwner} />
          </div>
        </section>
      )}

      
      <section className="mt-4">
        <Inventory
          initialCrowns={crowns}
          initialCollection={data.collection}
          initialWishlist={data.wishlist}
          allMonsters={allMonsters}
          isOwner={isOwner}
          userId={user.id}
        />
      </section>

      <div className="mt-6 text-center">
        <Link href="/registry" className="font-body text-xs text-mist-dim underline decoration-white/20 underline-offset-4 hover:text-ember-bright">
          ← Back to Global Crown List
        </Link>
      </div>
    </main>
  );
}
