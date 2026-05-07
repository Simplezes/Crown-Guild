import { getAllMonsters, getWeeklyBounties } from "@/lib/monsters";
import { QUEST_SYSTEM_ENABLED } from "@/lib/sos";
import styles from "./registry.module.css";
import Image from "next/image";
import db from "@/lib/db";
import RegistrySearch from "@/components/registry/RegistrySearch";
import { auth } from "@/auth";
import InfoTrigger from "@/components/ui/InfoTrigger";

export const dynamic = "force-dynamic";

async function getRegistryData() {
  try {
    const monsters = await getAllMonsters(true);
    const crownsRes = await db.execute(`
      SELECT c.monster_id, c.type, c.tempered, c.user_id, u.username, u.avatar_url, c.strength_rating, c.remaining_uses, u.fever_until,
             (SELECT COUNT(*) FROM completed_missions cm WHERE cm.monster_id = c.monster_id AND cm.host_id = c.user_id) as share_count
      FROM crowns c
      JOIN users u ON c.user_id = u.id
    `);
    const allCrowns = JSON.parse(JSON.stringify(crownsRes.rows));
    const bounties = QUEST_SYSTEM_ENABLED ? getWeeklyBounties(monsters) : [];

    const wishlistRes = await db.execute(`
      SELECT monster_id, COUNT(*) as count FROM wishlist GROUP BY monster_id
    `);
    const demandMap = {};
    wishlistRes.rows.forEach(r => demandMap[r.monster_id] = r.count);

    const session = await auth();
    const userWishlist = [];
    if (session) {
      const userWishRes = await db.execute({
        sql: "SELECT monster_id FROM wishlist WHERE user_id = ?",
        args: [session.user.id]
      });
      userWishRes.rows.forEach(r => userWishlist.push(r.monster_id));
    }

    const registry = monsters.map(monster => {
      const monsterCrowns = allCrowns.filter(c => c.monster_id === monster.id);

      const processedCrowns = monsterCrowns.map(c => ({
        ...c,
        resonance: QUEST_SYSTEM_ENABLED ? Math.min(5, Math.floor((c.share_count || 0) / 3) + 1) : 0,
        isFever: QUEST_SYSTEM_ENABLED && c.fever_until && new Date(c.fever_until) > new Date()
      }));

      return {
        ...monster,
        demand: demandMap[monster.id] || 0,
        isWishlisted: userWishlist.includes(monster.id),
        isBounty: bounties.includes(monster.id),
        smallFinders: processedCrowns.filter(c => c.type === 'small'),
        largeFinders: processedCrowns.filter(c => c.type === 'large')
      };
    }).filter(m => m.smallFinders.length > 0 || m.largeFinders.length > 0 || demandMap[m.id] > 0);

    return { registry, userWishlist, bounties };
  } catch (e) {
    console.error("Registry fetch error", e);
    return { registry: [] };
  }
}

export default async function Registry() {
  const { registry } = await getRegistryData();
  const trackedSpecimens = registry.length;
  const activeHosts = registry.reduce((sum, monster) => sum + monster.smallFinders.length + monster.largeFinders.length, 0);
  const openDemand = registry.reduce((sum, monster) => sum + Number(monster.demand || 0), 0);
  const bountyCount = registry.filter((monster) => monster.isBounty).length;

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <header className={styles.pageHeader + " animate-mh"}>
          <div className={styles.heroShell}>
            <div className={styles.heroPanel}>
              <div className={styles.titleGroup}>
                <div className={styles.indicator}>
                  <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                  <span>Guild Field Guide</span>
                </div>
                <h1 className="gold-text">The Great Ledger</h1>
                <p className={styles.subtitle}>
                  Track crown coverage, open demand, and active hosts from one modernized registry while preserving the guild archive aesthetic.
                </p>
              </div>

              <div className={styles.heroChips}>
                <span className={styles.heroChip}>{trackedSpecimens} Tracked Specimens</span>
                <span className={styles.heroChip}>{activeHosts} Active Hosts</span>
                {openDemand > 0 && <span className={styles.heroChipAlert}>{openDemand} Open Wishlist</span>}
                {QUEST_SYSTEM_ENABLED && bountyCount > 0 && <span className={styles.heroChip}>{bountyCount} Weekly Bounties</span>}
              </div>
            </div>

            <aside className={`${styles.snapshotCard} mh-card`}>
              <div className={styles.snapshotHeader}>
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                <span>Registry Snapshot</span>
              </div>

              <div className={styles.snapshotGrid}>
                <div className={styles.snapshotStat}>
                  <span>Specimens</span>
                  <strong>{trackedSpecimens}</strong>
                </div>
                <div className={styles.snapshotStat}>
                  <span>Hosts</span>
                  <strong>{activeHosts}</strong>
                </div>
                <div className={styles.snapshotStat}>
                  <span>Demand</span>
                  <strong>{openDemand}</strong>
                </div>
                <div className={styles.snapshotStat}>
                  <span>Bounties</span>
                  <strong>{QUEST_SYSTEM_ENABLED ? bountyCount : 0}</strong>
                </div>
              </div>

              {QUEST_SYSTEM_ENABLED && (
                <div className={styles.bountyHeader}>
                  <div className={styles.bountyLabel}>
                    Weekly Bounties (2x MP)
                    <InfoTrigger
                      title="Bounties"
                      content="Targeting these monsters provides double Mastery Points. The guild selects these monsters weekly based on community needs."
                      position="bottom"
                      align="left"
                    />
                  </div>
                  <div className={styles.bountyIcons}>
                    {registry.filter((monster) => monster.isBounty).slice(0, 6).map((monster) => (
                      <div key={monster.id} className={styles.bountyIcon} title={`${monster.name} Bounty`}>
                        <Image src={`/monsters/${monster.image_name}`} width={30} height={30} alt={monster.name} className="pixel-art" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </header>

        <div className={styles.scrollArea + " animate-mh"}>
          <RegistrySearch initialRegistry={registry} />
        </div>
      </div>
    </main>
  );
}
