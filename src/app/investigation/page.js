import styles from "./investigation.module.css";
import Link from "next/link";
import Image from "next/image";
import { getAllMonsters } from "@/lib/monsters";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export default async function Investigation() {
  const session = await getServerSession(authOptions);
  let userCrowns = [];

  if (session?.user?.id) {
    try {
      const crownsRes = await db.execute({
        sql: "SELECT monster_id, type FROM crowns WHERE user_id = ?",
        args: [session.user.id]
      });
      userCrowns = crownsRes.rows;
    } catch (e) {
      console.error("Failed to fetch user crowns for investigation board", e);
    }
  }

  const allMonsters = await getAllMonsters(true);
  const monsters = allMonsters.map(m => {
    const hasSmall = userCrowns.some(c => c.monster_id === m.id && c.type === 'small');
    const hasLarge = userCrowns.some(c => c.monster_id === m.id && c.type === 'large');
    const isCompleted = hasSmall && hasLarge;

    return {
      ...m,
      isCompleted
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
              <span>Field Targets</span>
            </div>
            <h1 className="gold-text">Investigation Board</h1>
          </div>
          <p className={styles.description}>
            Consult the Guild's complete compendium of known local fauna. Select a target to view detailed tactical intelligence and verification records.
          </p>
        </header>

        <div className={styles.content + " animate-mh"}>
          <section className={styles.monsterSection}>
            <div className={styles.monsterGrid}>
              {largeMonsters.map(monster => (
                <Link key={monster.id} href={`/monster/${monster.name}`} className={styles.monsterCard}>
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
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
