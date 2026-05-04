import db from "@/lib/db";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "@/components/MonsterIcon";

export const metadata = {
  openGraph: {
    title: "Crown Guild | Monster Hunter Wilds Registry",
    description: "The premium crown tracking and matchmaking hub for Monster Hunter Wilds.",
    images: ["/hero.png"],
  },
};

async function getHomeData() {
  try {
    const huntersRes = await db.execute("SELECT COUNT(*) as count FROM users");
    const crownsRes = await db.execute("SELECT COUNT(*) as count FROM crowns");

    const activeMissionsRes = await db.execute(`
      SELECT 
        am.id, am.type, am.tempered, am.strength_rating,
        am.host_id, am.requester_id,
        m.name as monster_name, m.emoji, m.image_name,
        u_host.username as host_name, u_host.avatar_url as host_avatar,
        u_req.username as requester_name, u_req.avatar_url as requester_avatar
      FROM active_missions am
      JOIN monsters m ON am.monster_id = m.id
      JOIN users u_host ON am.host_id = u_host.id
      JOIN users u_req ON am.requester_id = u_req.id
      LIMIT 10
    `);

    return {
      stats: {
        hunters: huntersRes.rows[0]?.count || 0,
        crowns: crownsRes.rows[0]?.count || 0,
      },
      activeMissions: activeMissionsRes.rows
    };
  } catch (e) {
    console.error("Failed to fetch home data", e);
    return { stats: { hunters: 0, crowns: 0 }, activeMissions: [] };
  }
}

export default async function Home() {
  const { stats, activeMissions } = await getHomeData();

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <div className={styles.layout}>
          <section className={styles.liveBoard}>
            <header className={styles.boardHeader}>
              <div className={styles.liveIndicator}>
                <span className={styles.dot}></span>
                LIVE OPERATIONS
              </div>
              <h1 className="gold-text">Active Hunts</h1>
            </header>

            <div className={styles.missionsGrid}>
              {activeMissions.length > 0 ? (
                activeMissions.map((mission) => (
                  <div key={mission.id} className={styles.missionCard}>
                    <Link href={`/monster/${mission.monster_name}`} className={styles.monsterSection}>
                      <MonsterIcon
                        imageName={mission.image_name}
                        name={mission.monster_name}
                        tempered={mission.tempered}
                        size={64}
                      />
                      <div className={styles.monsterInfo}>
                        <h3>{mission.monster_name}</h3>
                        <div className={styles.crownTag}>
                          <Image
                            src={mission.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                            width={14} height={14} alt="" className="pixel-art"
                          />
                          <span className={mission.tempered ? styles.temperedCrown : ""}>
                            {mission.type} • {mission.strength_rating}★
                            {mission.tempered ? " • Tempered" : ""}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className={styles.partySection}>
                      <div className={styles.hunterPair}>
                        <div className={styles.hunter}>
                          <img src={mission.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.miniAvatar} style={{ borderRadius: 10 }} />
                          <label>Host</label>
                          <Link href={`/profile/${mission.host_id}`} style={{ textDecoration: 'none' }}>
                            <span>{mission.host_name}</span>
                          </Link>
                        </div>
                        <div className={styles.vs}>
                          <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={60} height={60} alt="" className="pixel-art" />
                        </div>
                        <div className={styles.hunter}>
                          <img src={mission.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.miniAvatar} style={{ borderRadius: 10 }} />
                          <label>Requested</label>
                          <Link href={`/profile/${mission.requester_id}`} style={{ textDecoration: 'none' }}>
                            <span>{mission.requester_name}</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art" />
                  <p>No active hunts currently underway.</p>
                  <span>Missions requested via Discord appear here live.</span>
                </div>
              )}
            </div>
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.statBox}>
              <div className={styles.statItem}>
                <label>Enlisted Hunters</label>
                <h2 className="gold-text">{stats.hunters}</h2>
              </div>
              <div className={styles.statItem}>
                <label>Total Crowns</label>
                <h2 className="gold-text">{stats.crowns}</h2>
              </div>
            </div>

            <div className={styles.quickLinks}>
              <Link href="/registry" className="mh-button" style={{ width: '100%', textAlign: 'center' }}>
                Open Ledger
              </Link>
              <Link href="https://discord.gg/mhwilds" className={styles.discordLink}>
                Join Discord Guild
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
