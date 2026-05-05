import db from "@/lib/db";
import styles from "./profile.module.css";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ProfileCrowns from "@/components/crowns/ProfileCrowns";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { getProfileData, getHunterRank } from "@/lib/profile";
import CrownSummary from "@/components/crowns/CrownSummary";
import DiscordShare from "@/components/ui/DiscordShare";
import { getAllMonsters } from "@/lib/monsters";
import WishlistGrid from "@/components/wishlist/WishlistGrid";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getProfileData(id);
  if (!data) return { title: "Hunter Not Found" };

  const imageUrl = `/profile/${encodeURIComponent(id)}/og?v=${data.stats.total || 0}`;
  return {
    openGraph: {
      title: `${data.user.username}'s Guild Card`,
      description: `MR ${data.stats.total || 0} Hunter • Guide Progress: ${data.completion}%`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' }
  };
}

export default async function Profile({ params }) {
  const { id } = await params;
  const session = await auth();
  const isOwner = session?.user?.id === id;
  const data = await getProfileData(id);

  if (!data) notFound();

  const { user, crowns, stats, activity, completion, topAssist } = data;
  const userRank = getHunterRank(activity.hosted || 0, activity.joined || 0);
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
              <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={16} height={16} alt="" className="pixel-art" />
              <span>COLLECTION PROGRESS</span>
            </div>
            <div className={styles.progressBody}>
              <div className={styles.completionVal}>{completion}%</div>
              <div className={styles.miniStats}>
                <div className={styles.miniStat}>
                  <label>S</label><span>{stats.small || 0}</span>
                </div>
                <div className={styles.miniStat}>
                  <label>L</label><span>{stats.large || 0}</span>
                </div>
                <div className={styles.miniStat}>
                  <label>T</label><span>{stats.tempered || 0}</span>
                </div>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className={styles.tile + " " + styles.wishlistTile}>
            <div className={styles.tileHeader}>
              <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={16} height={16} alt="" className="pixel-art" />
              <span>MY WISHLIST</span>
            </div>
            <div className={styles.wishlistScroll}>
              <WishlistGrid wishlist={data.wishlist} isOwner={isOwner} userId={user.id} />
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
            <div className={styles.summaryHeader}>
              <h3 className="mh-title">Completion Tracker</h3>
              <p>Visual view of all monsters in the game and your current progress.</p>
            </div>
            <CrownSummary crowns={crowns} allMonsters={allMonsters} />
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
