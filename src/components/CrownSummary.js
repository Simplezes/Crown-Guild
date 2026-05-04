import Link from "next/link";
import Image from "next/image";
import MonsterIcon from "./MonsterIcon";
import styles from "./CrownSummary.module.css";

export default function CrownSummary({ crowns }) {
  if (!crowns || crowns.length === 0) return null;

  const linkedNames = new Set();
  const pairMap = {};
  
  for (const crown of crowns) {
    if (crown.pair_id) {
      if (!pairMap[crown.pair_id]) pairMap[crown.pair_id] = [];
      pairMap[crown.pair_id].push(crown);
    }
  }
  for (const pair of Object.values(pairMap)) {
    const perName = {};
    for (const c of pair) {
      if (!perName[c.name]) perName[c.name] = { small: false, large: false };
      if (c.type === "small") perName[c.name].small = true;
      if (c.type === "large") perName[c.name].large = true;
    }
    for (const [name, types] of Object.entries(perName)) {
      if (types.small && types.large) linkedNames.add(name);
    }
  }

  const byMonster = {};
  for (const crown of crowns) {
    const key = crown.name;
    if (!byMonster[key]) {
      byMonster[key] = { name: crown.name, image_name: crown.image_name, small: false, large: false, linked: false };
    }
    if (crown.type === "small") byMonster[key].small = true;
    if (crown.type === "large") byMonster[key].large = true;
    if (linkedNames.has(crown.name)) byMonster[key].linked = true;
  }

  const monsters = Object.values(byMonster);
  const multiCrowns = monsters.filter((m) => m.linked);
  const smallOnly = monsters.filter((m) => m.small && !m.linked);
  const largeOnly = monsters.filter((m) => m.large && !m.linked);

  const renderGroup = (label, iconSlot, items) => {
    if (items.length === 0) return null;
    return (
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          {iconSlot}
          <span>{label}</span>
          <span className={styles.count}>×{items.length}</span>
        </div>
        <div className={styles.iconGrid}>
          {items.map((m) => (
            <Link
              key={m.name}
              href={`/monster/${encodeURIComponent(m.name)}`}
              title={m.name}
              className={styles.iconLink}
            >
              <MonsterIcon imageName={m.image_name} name={m.name} size={36} />
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.summary}>
      {renderGroup(
        "Small",
        <Image src="/icons/smallcrown.png" width={12} height={12} alt="" className="pixel-art" />,
        smallOnly
      )}
      {renderGroup(
        "Large",
        <Image src="/icons/largecrown.png" width={12} height={12} alt="" className="pixel-art" />,
        largeOnly
      )}
      {multiCrowns.length > 0 && (
        <div className={styles.group}>
          <div className={styles.groupLabel}>
            <span className={styles.multiIcon}>
              <Image src="/icons/smallcrown.png" width={10} height={10} alt="" className="pixel-art" />
              <Image src="/icons/largecrown.png" width={12} height={12} alt="" className="pixel-art" />
            </span>
            <span>S &amp; L</span>
            <span className={styles.count}>×{multiCrowns.length}</span>
          </div>
          <div className={styles.iconGrid}>
            {multiCrowns.map((m) => (
              <Link
                key={m.name}
                href={`/monster/${encodeURIComponent(m.name)}`}
                title={m.name}
                className={styles.iconLink}
              >
                <MonsterIcon imageName={m.image_name} name={m.name} size={36} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
