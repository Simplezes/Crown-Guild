import db from "@/lib/db";
import styles from "./profile.module.css";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchDiscordUser } from "@/lib/discord";
import { getMonsterCount } from "@/lib/monsters";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import ProfileCrowns from "@/components/ProfileCrowns";
import StatusEditor from "@/components/StatusEditor";

import { getProfileData, getHunterRank } from "@/lib/profile";


export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) {
    return {
      title: "Hunter Not Found | Crown Guild",
    };
  }

  const { user } = data;
  const userRank = getHunterRank(data.activity.hosted || 0, data.activity.joined || 0);

  return {
    title: `${user.username} | Crown Guild`,
    description: `[${userRank}] Check out ${user.username}'s hunting records and crown collection on Crown Guild.`,
    openGraph: {
      title: `${user.username} | Crown Guild Profile`,
      description: `Hunter Rank: ${userRank} • ${data.stats.total || 0} Crowns Collected`,
      images: [
        {
          url: `/profile/${id}/og`,
          width: 1200,
          height: 630,
          alt: `${user.username}'s Hunter Card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.username} | Crown Guild`,
      description: `Hunter Rank: ${userRank} • ${data.stats.total || 0} Crowns Collected`,
      images: [`/profile/${id}/og`],
    },
  };
}

export default async function Profile({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === id;
  const data = await getProfileData(id);

  if (!data) notFound();

  const { user, crowns, stats, activity, completion, topAssist } = data;
  const userRank = getHunterRank(activity.hosted || 0, activity.joined || 0);

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <div className={styles.layout + " animate-mh"}>
          <aside className={styles.sidebar}>
            <div className={styles.hunterCard}>
              <div className={styles.cardHeader}>
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={40} height={40} alt="" className="pixel-art" style={{ borderRadius: 10 }} />
                <h2 className="mh-title">Hunter Card</h2>
              </div>

              <div className={styles.avatarWrapper}>
                <img
                  src={user.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                  alt=""
                  className={styles.profileAvatar}
                  style={{ borderRadius: 10 }}
                />
              </div>

              <div className={styles.identity}>
                <h1 className="gold-text">{user.username}</h1>
                <p className={styles.hunterRank}>{userRank}</p>
                <p className={styles.guildId}>Member ID: {user.id}</p>
              </div>

              <StatusEditor initialStatus={user.status_message} isOwner={isOwner} />

              {user.lobby_id && (
                <div className={styles.lobbyBlock}>
                  <div className={styles.lobbyHeader}>
                    <Image src="/icons/MHWilds-Lobby_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                    <label>Lobby</label>
                  </div>
                  <code>{user.lobby_id}</code>
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Image src="/icons/smallcrown.png" width={14} height={14} alt="" className="pixel-art" />
                  <span className="mh-title">Crown Collection</span>
                </div>
                <div className={styles.statLine}>
                  <label>Small</label>
                  <span>{stats.small || 0}</span>
                </div>
                <div className={styles.statLine}>
                  <label>Large</label>
                  <span>{stats.large || 0}</span>
                </div>
                <div className={styles.statLine}>
                  <label>Tempered</label>
                  <span style={{ color: 'var(--mh-red)' }}>{stats.tempered || 0}</span>
                </div>
                <div className={styles.totalLine}>
                  <label>Total</label>
                  <span className="gold-text">{stats.total || 0}</span>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                  <span className="mh-title">Guild Activity</span>
                </div>
                <div className={styles.statLine}>
                  <div className={styles.iconLabel}>
                    <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={12} height={12} alt="" className="pixel-art" />
                    <label>Hosted</label>
                  </div>
                  <span>{activity.hosted || 0}</span>
                </div>
                <div className={styles.statLine}>
                  <div className={styles.iconLabel}>
                    <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={12} height={12} alt="" className="pixel-art" />
                    <label>Joined</label>
                  </div>
                  <span>{activity.joined || 0}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className={styles.gallery}>
            <div className={styles.topDashboard}>
              <div className={styles.dashboardCard}>
                <div className={styles.dbHeader}>
                  <div className={styles.dbTitle}>
                    <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                    <h3 className="mh-title">Field Guide Completion</h3>
                  </div>
                  <span className="gold-text">{completion}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${completion}%` }}></div>
                </div>
              </div>

              {topAssist && (
                <div className={styles.dashboardCard}>
                  <div className={styles.dbTitle} style={{ marginBottom: '12px' }}>
                    <Image src="/icons/MHWilds-Link_Party_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                    <h3 className="mh-title">Top Assist</h3>
                  </div>
                  <div className={styles.assistBox}>
                    <Image src={`/monsters/${topAssist.image_name}`} width={40} height={40} alt="" className="pixel-art" />
                    <div className={styles.assistDetails}>
                      <span className={styles.assistMonster}>{topAssist.name}</span>
                      <span className={styles.assistNote}>Shared {topAssist.count} times</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <header className={styles.galleryHeader}>
              <h2 className="mh-title">Crown in Stock</h2>
              <div className={styles.recordCount}>
                <span>{crowns.length} Crowns</span>
              </div>
            </header>

            <ProfileCrowns initialCrowns={crowns} isOwner={isOwner} userId={user.id} />
          </section>
        </div>
      </div>
    </main>
  );
}
