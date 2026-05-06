import { getAllMonsters, getWeeklyBounties } from "@/lib/monsters";
import styles from "./registry.module.css";
import Image from "next/image";
import db from "@/lib/db";
import RegistrySearch from "@/components/registry/RegistrySearch";
import { auth } from "@/auth";
import InfoTrigger from "@/components/ui/InfoTrigger";

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
    const bounties = getWeeklyBounties(monsters);

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
        resonance: Math.min(5, Math.floor((c.share_count || 0) / 3) + 1),
        isFever: c.fever_until && new Date(c.fever_until) > new Date()
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

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <header className={styles.pageHeader + " animate-mh"}>
          <div className={styles.titleGroup}>
            <div className={styles.indicator}>
              <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              <span>Guild Field Guide</span>
            </div>
            <h1 className="gold-text">The Great Ledger</h1>
          </div>

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
              {registry.filter(m => m.isBounty).map(m => (
                <div key={m.id} className={styles.bountyIcon} title={`${m.name} Bounty`}>
                  <Image src={`/monsters/${m.image_name}`} width={32} height={32} alt={m.name} className="pixel-art" />
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className={styles.scrollArea + " animate-mh"}>
          <RegistrySearch initialRegistry={registry} />
        </div>
      </div>
    </main>
  );
}
