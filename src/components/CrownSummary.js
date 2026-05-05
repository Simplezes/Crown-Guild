"use client";

import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "./MonsterIcon";
import styles from "./CrownSummary.module.css";

export default function CrownSummary({ crowns, allMonsters }) {
  if (!allMonsters) return null;

  const userMap = {};
  crowns.forEach(c => {
    if (!userMap[c.monster_id]) {
      userMap[c.monster_id] = { small: false, large: false };
    }
    if (c.type === 'small') userMap[c.monster_id].small = true;
    if (c.type === 'large') userMap[c.monster_id].large = true;
  });

  return (
    <div className={styles.completionWall}>
      <div className={styles.wallGrid}>
        {allMonsters.filter(m => m.is_large).map((monster) => {
          const status = userMap[monster.id];
          const hasBoth = status?.small && status?.large;

          return (
            <Link
              key={monster.id}
              href={`/monster/${encodeURIComponent(monster.name)}`}
              className={`${styles.slot} ${hasBoth ? styles.completed : status ? styles.partial : styles.empty}`}
              title={monster.name}
            >
              <div className={styles.monsterIconWrapper}>
                <Image
                  src={`/monsters/${monster.image_name}`}
                  alt={monster.name}
                  width={36}
                  height={36}
                  className={`pixel-art ${!status ? styles.silhouette : ""}`}
                />
              </div>

              <div className={styles.crownIndicators}>
                <div className={`${styles.dot} ${status?.small ? styles.active : ""}`}>
                  <Image src="/icons/smallcrown.png" width={8} height={8} alt="S" className="pixel-art" />
                </div>
                <div className={`${styles.dot} ${status?.large ? styles.active : ""}`}>
                  <Image src="/icons/largecrown.png" width={8} height={8} alt="L" className="pixel-art" />
                </div>
              </div>

              <div className={styles.monsterName}>{monster.name}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
