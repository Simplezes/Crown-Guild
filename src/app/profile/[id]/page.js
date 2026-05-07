import db from "@/lib/db";
import styles from "./profile.module.css";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ProfileCrowns from "@/components/crowns/ProfileCrowns";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { getProfileData, getRankProgress } from "@/lib/profile";
import DiscordShare from "@/components/ui/DiscordShare";
import { getAllMonsters } from "@/lib/monsters";
import CompletionTracker from "@/components/profile/CompletionTracker";
import MasteryInfo from "@/components/profile/MasteryInfo";
import CompareWithButton from "@/components/profile/CompareWithButton";

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
    Number(data.activity?.hosted || 0),
    Number(data.activity?.joined || 0),
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
  const session = await auth();
  const isOwner = session?.user?.id === id;
  const data = await getProfileData(id);

  if (!data) notFound();

  const { user, crowns, stats, activity, topAssist, masteryPoints } = data;
  const { currentRank, nextRank, progress } = getRankProgress(masteryPoints || 0);
  const userRank = currentRank.title;
  const allMonsters = await getAllMonsters(true);

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <div className={styles.bentoGrid + " animate-mh"}>
          <div className={styles.tile + " " + styles.identityTile}>
            <div className={styles.avatarGlow}>
              <img src={user.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.avatar} />
            </div>
            <div className={styles.idContent}>
              <div className={styles.rankBadge}>{userRank}</div>
              <h1 className="gold-text">{user.username}</h1>
              <p className={styles.memberId}>ID: {user.id}</p>

              {user.status_message && (
                <div className={styles.statusBox}>
                  <p>"{user.status_message}"</p>
                </div>
              )}

              <div className={styles.identityActions}>
                <CompareWithButton baseUserId={user.id} baseUsername={user.username} variant="identity" />
              </div>
            </div>
          </div>

          <div className={styles.tile + " " + styles.opTile}>
            <div className={styles.tileHeader}>
              <Image src="/icons/MHWilds-Lobby_Icon.png" width={16} height={16} alt="" className="pixel-art" />
              <span>LOBBY INFO</span>
            </div>
            {user.lobby_id ? (
              <div className={styles.opBody}>
                <div className={styles.opData}>
                  <label>LOBBY ID</label>
                  <code>{user.lobby_id}</code>
                </div>
                {user.quest_password && (
                  <div className={styles.opData}>
                    <label>PASSCODE</label>
                    <code>{user.quest_password}</code>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noOp}>Standby - No Active Operation</div>
            )}
            <div className={styles.opActions}>
              <ProfileSettings user={user} isOwner={isOwner} />
            </div>
          </div>

          <div className={styles.tile + " " + styles.progressTile}>
            <div className={styles.tileHeader}>
              <div className={styles.headerTitleArea}>
                <Image src="/icons/MHWilds-Item_Pouch_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <span>COLLECTION MASTERY</span>
              </div>
              <div className={styles.infoWrapper}>
                <button className={styles.infoTrigger}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
                <div className={styles.infoPopover}>
                  <MasteryInfo
                    points={masteryPoints}
                    rank={userRank}
                    nextRank={nextRank}
                    progress={progress}
                  />
                </div>
              </div>
            </div>
            <div className={styles.progressBody}>
              <div className={styles.masteryVal}>{masteryPoints} <span className={styles.mpLabel}>MP</span></div>
              <div className={styles.rankBadgeSmall}>{userRank}</div>
            </div>
            <div className={styles.masteryMeta}>
              <span>{Math.round(progress)}% Rank Progress</span>
              {nextRank && <span>{nextRank.minPoints - masteryPoints} to {nextRank.title}</span>}
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <section className={styles.ledgerSection}>
          <header className={styles.ledgerHeader}>
            <div className={styles.ledgerTitle}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={24} height={24} alt="" className="pixel-art" />
              <h2 className="mh-title">Crown Collection</h2>
            </div>
            <div className={styles.ledgerMeta}>
              <DiscordShare id={user.id} username={user.username} crowns={crowns} wishlist={data.wishlist} />
            </div>
          </header>

          <div className={styles.summarySection}>
            <CompletionTracker
              initialCrowns={crowns}
              initialCollection={data.collection}
              initialWishlist={data.wishlist}
              allMonsters={allMonsters}
              isOwner={isOwner}
              userId={user.id}
            />
          </div>

          <div className={styles.galleryHeader} style={{ marginTop: '60px' }}>
            <h2 className="mh-title">My Crowns</h2>
            <div className={styles.recordCount}>
              <span>{crowns.length} Crowns</span>
            </div>
          </div>

          <ProfileCrowns initialCrowns={crowns} isOwner={isOwner} userId={user.id} />
        </section>

        <div className={styles.footer}>
          <Link href="/registry" className={styles.backLink}>← Back to Global Crown List</Link>
        </div>
      </div>
    </main>
  );
}
