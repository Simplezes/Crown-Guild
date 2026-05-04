import { getAllMonsters } from "@/lib/monsters";
import styles from "./registry.module.css";
import Image from "next/image";
import db from "@/lib/db";
import RegistrySearch from "@/components/RegistrySearch";

async function getRegistryData() {
  try {
    const monsters = await getAllMonsters();
    const crownsRes = await db.execute(`
      SELECT c.monster_id, c.type, c.tempered, c.user_id, u.username, u.avatar_url, c.strength_rating, c.remaining_uses
      FROM crowns c
      JOIN users u ON c.user_id = u.id
    `);
    const allCrowns = JSON.parse(JSON.stringify(crownsRes.rows));

    const registry = monsters.map(monster => {
      const monsterCrowns = allCrowns.filter(c => c.monster_id === monster.id);
      return {
        ...monster,
        smallFinders: monsterCrowns.filter(c => c.type === 'small'),
        largeFinders: monsterCrowns.filter(c => c.type === 'large')
      };
    }).filter(m => m.smallFinders.length > 0 || m.largeFinders.length > 0);

    return { registry };
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
        </header>

        <div className={styles.scrollArea + " animate-mh"}>
          <RegistrySearch initialRegistry={registry} />
        </div>
      </div>
    </main>
  );
}
