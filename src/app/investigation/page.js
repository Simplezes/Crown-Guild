import styles from "./investigation.module.css";
import Link from "next/link";
import Image from "next/image";
import { getAllMonsters } from "@/lib/monsters";
import { auth } from "@/auth";
import db from "@/lib/db";
import WishlistToggle from "@/components/wishlist/WishlistToggle";
import InfoTrigger from "@/components/ui/InfoTrigger";

export default async function FieldGuide() {
  const session = await auth();
  let userCrowns = [];
  let userWishlist = [];

  if (session?.user?.id) {
    try {
      const crownsRes = await db.execute({
        sql: "SELECT monster_id, type FROM crowns WHERE user_id = ?",
        args: [session.user.id]
      });
      userCrowns = crownsRes.rows.map(r => ({ ...r }));

      const wishRes = await db.execute({
        sql: "SELECT monster_id, type FROM wishlist WHERE user_id = ?",
        args: [session.user.id]
      });
      userWishlist = wishRes.rows.map(r => ({ ...r }));
    } catch (e) {
      console.error("Failed to fetch user data for field guide", e);
    }
  }

  const demandRes = await db.execute(`
    SELECT monster_id, COUNT(*) as count FROM wishlist GROUP BY monster_id
  `);
  const demandMap = {};
  demandRes.rows.forEach(r => demandMap[r.monster_id] = r.count);

  const allMonsters = await getAllMonsters(true);
  const monsters = allMonsters.map(m => {
    const hasSmall = userCrowns.some(c => c.monster_id === m.id && c.type === 'small');
    const hasLarge = userCrowns.some(c => c.monster_id === m.id && c.type === 'large');
    const isCompleted = hasSmall && hasLarge;

    const wishEntry = userWishlist.find(w => w.monster_id === m.id);

    return {
      ...m,
      isCompleted,
      isWishlisted: !!wishEntry,
      wishlistType: wishEntry?.type || null,
      demand: demandMap[m.id] || 0
    };
  });

  const largeMonsters = monsters.filter(m => m.is_large);

  return (
    <main className={styles.main}>
      <div className="premium-container">
        <header className={styles.pageHeader + " animate-mh"}>
          <div className={styles.titleGroup}>
            <div className={styles.indicator}>
              <Image src="/icons/MHWilds-Investigation_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              <span>Field Guide</span>
            </div>
            <h1 className="gold-text">Monstrous Compendium</h1>
          </div>
          <p className={styles.description}>
            Track your target monsters to receive alerts and find hosts in the Ledger. Every specimen listed here can be pinned to your personal hunting wishlist.
          </p>
        </header>

        <div className={styles.content + " animate-mh"}>
          <section className={styles.monsterSection}>
            <div className={styles.monsterGrid}>
              {largeMonsters.map(monster => (
                <div key={monster.id} className={styles.monsterCardWrapper}>
                  <Link href={`/monster/${monster.name}`} className={styles.monsterCard}>
                    {monster.isCompleted && (
                      <div className={styles.completedBadge}>
                        <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={14} height={14} alt="Completed" className="pixel-art" />
                      </div>
                    )}
                    <div className={styles.iconWrapper}>
                      {monster.image_name ? (
                        <Image src={`/monsters/${monster.image_name}`} alt={monster.name} width={64} height={64} className="pixel-art" />
                      ) : (
                        <div className={styles.fallback}>
                          <Image src="/icons/MHWilds-Hunt_Icon.png" width={40} height={40} alt="" className="pixel-art" />
                        </div>
                      )}
                    </div>
                    <span className={styles.monsterName}>{monster.name}</span>

                    <div className={styles.demandStat}>
                      <span className={styles.demandLabel}>Active Requests</span>
                      <div className={styles.demandValue}>
                        <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={10} height={10} alt="" className="pixel-art" />
                        <span>{monster.demand}</span>
                      </div>
                    </div>
                  </Link>

                  <div className={styles.wishlistControl}>
                    <div className={styles.controlLabel}>
                      Track Target
                      <InfoTrigger 
                        title="Wishlist Tracking" 
                        content="Adding a monster to your wishlist will notify you when someone finds a crown for it. You can track small, large, or both crowns." 
                      />
                    </div>
                    <WishlistToggle
                      monsterId={monster.id}
                      initialType={monster.wishlistType}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
