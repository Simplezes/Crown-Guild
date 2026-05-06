"use client";

import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "../ui/MonsterIcon";
import styles from "./CrownSummary.module.css";

export default function CrownSummary({ items, allMonsters, isOwner, mode, onToggle }) {
  if (!allMonsters) return null;

  const itemMap = {};
  (items || []).forEach(c => {
    if (!itemMap[c.monster_id]) {
      itemMap[c.monster_id] = { small: false, large: false };
    }
    if (c.type === 'small' || c.type === 'both') itemMap[c.monster_id].small = true;
    if (c.type === 'large' || c.type === 'both') itemMap[c.monster_id].large = true;
  });

  const handleDotClick = (e, monsterId, type) => {
    if (!isOwner || !onToggle) return;
    e.preventDefault();
    e.stopPropagation();
    
    const current = itemMap[monsterId] || { small: false, large: false };
    const isSmall = type === 'small';
    const active = isSmall ? current.small : current.large;
    
    let newType = null;
    if (isSmall) {
      if (active) {
        newType = current.large ? 'large' : null;
      } else {
        newType = current.large ? 'both' : 'small';
      }
    } else {
      if (active) {
        newType = current.small ? 'small' : null;
      } else {
        newType = current.small ? 'both' : 'large';
      }
    }
    
    onToggle(monsterId, newType);
  };

  return (
    <div className={styles.completionWall}>
      <div className={styles.wallGrid}>
        {allMonsters.filter(m => m.is_large).map((monster) => {
          const status = itemMap[monster.id];
          const hasBoth = status?.small && status?.large;

          return (
            <Link
              key={monster.id}
              href={`/monster/${encodeURIComponent(monster.name)}`}
              className={`${styles.slot} ${hasBoth ? styles.completed : status ? styles.partial : styles.empty} ${isOwner && mode !== 'host' ? styles.editable : ''}`}
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
                <div 
                  className={`${styles.dot} ${status?.small ? styles.active : ""} ${isOwner && mode !== 'host' ? styles.interactiveDot : ""}`}
                  onClick={(e) => handleDotClick(e, monster.id, 'small')}
                >
                  <Image src="/icons/smallcrown.png" width={14} height={14} alt="S" className="pixel-art" />
                </div>
                <div 
                  className={`${styles.dot} ${status?.large ? styles.active : ""} ${isOwner && mode !== 'host' ? styles.interactiveDot : ""}`}
                  onClick={(e) => handleDotClick(e, monster.id, 'large')}
                >
                  <Image src="/icons/largecrown.png" width={14} height={14} alt="L" className="pixel-art" />
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
