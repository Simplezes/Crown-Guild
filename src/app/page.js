import db from "@/lib/db";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import LiveRadarWrapper from "@/components/beacon/LiveRadarWrapper";
import InfoTrigger from "@/components/ui/InfoTrigger";
import { getAllMonsters, getWeeklyBounties } from "@/lib/monsters";
import { QUEST_SYSTEM_ENABLED, SOS_FEATURE_ENABLED } from "@/lib/sos";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guild Hub | Crown Guild",
  description: "The central command for Monster Hunter Wilds crown hunting.",
};

async function getHomeData() {
  try {
    const huntersRes = await db.execute("SELECT COUNT(*) as count FROM users");
    const crownsCountRes = await db.execute("SELECT COUNT(*) as count FROM crowns");

    const wantedRes = await db.execute(`
      SELECT m.id, m.name, m.image_name, m.emoji, COUNT(w.id) as demand
      FROM monsters m
      JOIN wishlist w ON m.id = w.monster_id
      GROUP BY m.id
      ORDER BY demand DESC
      LIMIT 4
    `);

    const recentRes = await db.execute(`
      SELECT c.id, c.type, c.strength_rating, m.name as monster_name, m.image_name, u.username, u.id as user_id
      FROM crowns c
      JOIN monsters m ON c.monster_id = m.id
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id DESC
      LIMIT 4
    `);

    const activeMissionsRes = await db.execute(`
      SELECT 
        am.id, am.type, am.tempered, am.strength_rating, am.group_id,
        am.host_id, am.requester_id,
        m.name as monster_name, m.emoji, m.image_name,
        u_host.username as host_name, u_host.avatar_url as host_avatar,
        u_req.username as requester_name, u_req.avatar_url as requester_avatar
      FROM active_missions am
      JOIN monsters m ON am.monster_id = m.id
      JOIN users u_host ON am.host_id = u_host.id
      JOIN users u_req ON am.requester_id = u_req.id
      ORDER BY am.id DESC
      LIMIT 20
    `);

    const monsters = await getAllMonsters();
    const bountyIds = QUEST_SYSTEM_ENABLED ? getWeeklyBounties(monsters) : [];
    const bounties = QUEST_SYSTEM_ENABLED ? monsters.filter(m => bountyIds.includes(m.id)) : [];

    const renownRes = await db.execute(`
      SELECT u.id, u.username, u.avatar_url, COUNT(c.id) as crown_count
      FROM users u
      JOIN crowns c ON c.user_id = u.id
      GROUP BY u.id
      ORDER BY crown_count DESC
      LIMIT 4
    `);

    return {
      stats: {
        hunters: huntersRes.rows[0]?.count || 0,
        crowns: crownsCountRes.rows[0]?.count || 0,
      },
      wanted: wantedRes.rows || [],
      recent: recentRes.rows || [],
      activeMissions: activeMissionsRes.rows || [],
      bounties,
      topRenown: renownRes.rows || []
    };
  } catch (e) {
    console.error(e);
    return {
      stats: { hunters: 0, crowns: 0 },
      wanted: [],
      recent: [],
      activeMissions: [],
      bounties: [],
      topRenown: []
    };
  }
}

export default async function Home() {
  const { stats, wanted, recent, activeMissions, bounties, topRenown } = await getHomeData();

  const displayMissions = [];
  const seenGroups = new Set();
  for (const m of activeMissions) {
    if (m.group_id) {
      if (seenGroups.has(m.group_id)) continue;
      seenGroups.add(m.group_id);
      const hunters = activeMissions.filter(x => x.group_id === m.group_id);
      displayMissions.push({ ...m, isGroup: true, hunters });
    } else {
      displayMissions.push({ ...m, isGroup: false });
    }
    if (displayMissions.length >= 6) break;
  }

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <div className={styles.pageHeader}>
          <div className={styles.heroShell}>
            <div className={styles.heroPanel}>
              <div className={styles.titleGroup}>
                <h1>Crown Guild</h1>
                <span className={styles.indicator}>📋 Monster Hunter Wilds Community</span>
              </div>
              <p className={styles.description}>
                The central hub for coordinating crown hunts, tracking legendary catches, and connecting with fellow hunters in the Crown Guild.
              </p>
              <div className={styles.heroActions}>
                <Link href="/registry" className="mh-button">Open Ledger</Link>
                <Link href="/investigation" className="mh-button-outline">Browse Monsters</Link>
                <a href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer" className="mh-button-outline">Join Discord</a>
              </div>
            </div>
            <div className={styles.snapshotCard}>
              <div className={styles.snapshotHeader}>
                <span>🎯 Guild Stats</span>
              </div>
              <div className={styles.snapshotGrid}>
                <div className={styles.snapshotStat}>
                  <span>Hunters Enlisted</span>
                  <strong>{stats.hunters}</strong>
                </div>
                <div className={styles.snapshotStat}>
                  <span>Crowns Registered</span>
                  <strong>{stats.crowns}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {QUEST_SYSTEM_ENABLED && (
          <section className={styles.bountySection + " animate-mh"}>
            <div className={styles.bountyHeader}>
              <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={24} height={24} alt="" className="pixel-art" />
              <h2 className="mh-title">Weekly Bounties</h2>
              <InfoTrigger 
                title="Weekly Bounties" 
                content="Specific monsters designated by the Guild. Securing crowns for these monsters grants double Mastery Points." 
                position="bottom"
                align="left"
              />
              <span className={styles.bountyMeta}>2x Mastery Points Rewards</span>
            </div>
            <div className={styles.bountyGrid}>
              {bounties.map(m => (
                <Link href={`/monster/${m.name}`} key={m.id} className={styles.bountyCard}>
                  <Image src={`/monsters/${m.image_name}`} width={48} height={48} alt={m.name} className="pixel-art" />
                  <span className={styles.bountyName}>{m.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.radarWrapper + " animate-mh"}>
          <LiveRadarWrapper />
        </section>

        <div className={styles.intelGrid + " animate-mh"}>
          <section className={styles.intelCard}>
            <header className={styles.cardHeader}>
              <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={20} height={20} alt="" className="pixel-art" />
              <h2 className="mh-title">Community Demand</h2>
              <InfoTrigger 
                title="Community Demand" 
                content="Monsters that are most requested by the community on their wishlists. Hunters are actively seeking these crowns." 
                align="left"
              />
            </header>
            <div className={styles.list}>
              {wanted.map((m, i) => (
                <Link href={`/monster/${m.name}?tab=seeking`} key={m.id} className={styles.listItem}>
                  <div className={styles.itemIcon}>
                    <Image src={`/monsters/${m.image_name}`} width={40} height={40} alt="" className="pixel-art" />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{m.name}</span>
                    <span className={styles.itemMeta}>{m.demand} Hunters Seeking</span>
                  </div>
                  <div className={styles.itemRank}>#{i + 1}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.intelCard}>
            <header className={styles.cardHeader}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={20} height={20} alt="" className="pixel-art" />
              <h2 className="mh-title">Latest Crowns</h2>
            </header>
            <div className={styles.list}>
              {recent.map((c) => (
                <Link href={`/monster/${c.monster_name}?crownId=${c.id}&user=${c.user_id}`} key={c.id} className={styles.listItem}>
                  <div className={styles.itemIcon}>
                    <Image src={`/monsters/${c.image_name}`} width={40} height={40} alt="" className="pixel-art" />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{c.monster_name}</span>
                    <span className={styles.itemMeta}>Secured by {c.username}</span>
                  </div>
                  <div className={styles.itemCrown}>
                    <Image
                      src={c.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                      width={16} height={16} alt="" className="pixel-art"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.intelCard}>
            <header className={styles.cardHeader}>
              <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={20} height={20} alt="" className="pixel-art" />
              <h2 className="mh-title">Guild Legends</h2>
              <InfoTrigger 
                title="Guild Legends" 
                content="The top crown hunters in the community, ranked by total crowns contributed to the Guild registry." 
                align="left"
              />
            </header>
            <div className={styles.list}>
              {topRenown.map((u, i) => (
                <Link href={`/profile/${u.id}`} key={u.id} className={styles.listItem}>
                  <div className={styles.itemIcon}>
                    <img src={u.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} width={40} height={40} alt="" className={styles.roundAvatar} />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{u.username}</span>
                    <span className={styles.itemMeta}>{u.crown_count} Crowns</span>
                  </div>
                  <div className={styles.itemRank}>#{i + 1}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {SOS_FEATURE_ENABLED && (
        <section className={styles.opsSection + " animate-mh"}>
          <header className={styles.sectionHeader}>
            <div className={styles.liveIndicator}>
              <span className={styles.dot}></span>
              LIVE OPERATIONS
            </div>
            <h2 className="mh-title">Ongoing Hunts</h2>
          </header>
          <div className={styles.opsGrid}>
            {displayMissions && displayMissions.length > 0 ? (
              displayMissions.map((mission) => (
                <div key={mission.isGroup ? mission.group_id : mission.id} className={styles.opCard}>
                  <div className={styles.opMonster}>
                    <Image src={`/monsters/${mission.image_name}`} width={40} height={40} alt="" className="pixel-art" />
                    <div className={styles.opInfo}>
                      <span className={styles.opName}>{mission.monster_name}</span>
                      <span className={styles.opGoal}>{mission.strength_rating}★ {mission.type} Crown{mission.isGroup ? ' · SOS' : ''}</span>
                    </div>
                  </div>
                  <div className={styles.opParty}>
                    <div className={styles.opHunter}>
                      <img src={mission.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.opAvatar} />
                      <Link href={`/profile/${mission.host_id}`}>{mission.host_name}</Link>
                    </div>
                    {mission.isGroup ? (
                      <div className={styles.opGroupHunters}>
                        {mission.hunters.map(h => (
                          <div key={h.requester_id} className={styles.opHunter}>
                            <img src={h.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.opAvatar} />
                            <Link href={`/profile/${h.requester_id}`}>{h.requester_name}</Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className={styles.opVs}>
                          <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={30} height={30} alt="" className="pixel-art" />
                        </div>
                        <div className={styles.opHunter}>
                          <img src={mission.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.opAvatar} />
                          <Link href={`/profile/${mission.requester_id}`}>{mission.requester_name}</Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyOps}>
                <p>No active operations in progress.</p>
              </div>
            )}
          </div>
        </section>
        )}
      </div>
    </main>
  );
}
