"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RegistrySearch.module.css';

export default function RegistrySearch({ initialRegistry }) {
  const [search, setSearch] = useState('');

  const filteredRegistry = useMemo(() => {
    if (!search.trim()) return initialRegistry;
    const term = search.toLowerCase();
    return initialRegistry.filter(m =>
      m.name.toLowerCase().includes(term) ||
      (m.extraInfo?.type && m.extraInfo.type.toLowerCase().includes(term))
    );
  }, [search, initialRegistry]);

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchInner}>
          <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={24} height={24} alt="" className="pixel-art" />
          <input
            type="text"
            placeholder="Search Registry by Monster Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <div className={styles.searchStats}>
          Showing {filteredRegistry.length} Specimens
        </div>
      </div>

      <div className={styles.ledgerGrid}>
        {filteredRegistry.length > 0 ? (
          filteredRegistry.map((monster) => (
            <Link
              key={monster.id}
              href={`/monster/${monster.name}`}
              className={styles.monsterCard}
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div className={styles.monsterHeader}>
                <div className={styles.monsterIcon}>
                  {monster.image_name ? (
                    <Image
                      src={`/monsters/${monster.image_name}`}
                      alt={monster.name}
                      width={64}
                      height={64}
                      className="pixel-art"
                    />
                  ) : (
                    <div className={styles.fallbackIcon}>
                      <Image src="/icons/MHWilds-Hunt_Icon.png" width={40} height={40} alt="" className="pixel-art" />
                    </div>
                  )}
                </div>
                <div className={styles.monsterTitle}>
                  <h3>{monster.name}</h3>
                  <div className={styles.statusTags}>
                    <span className={monster.smallFinders.length > 0 ? styles.found : styles.missing}>Small</span>
                    <span className={monster.largeFinders.length > 0 ? styles.found : styles.missing}>Large</span>
                  </div>
                </div>
              </div>

              <div className={styles.crownChecklist}>
                <div className={styles.checkItem + (monster.smallFinders.length > 0 ? ` ${styles.isFound}` : '')}>
                  <Image
                    src="/icons/smallcrown.png"
                    width={16} height={16} alt=""
                    className={"pixel-art " + (monster.smallFinders.length > 0 ? '' : styles.grayscale)}
                  />
                  <div className={styles.checkInfo}>
                    <label>Small Crown</label>
                    {monster.smallFinders.length > 0 ? (
                      <div className={styles.hunterStack}>
                        <div className={styles.avatars}>
                          {monster.smallFinders.slice(0, 3).map((f, i) => (
                            <img key={i} src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={styles.stackAvatar} />
                          ))}
                          {monster.smallFinders.length > 3 && (
                            <div className={styles.moreCount}>+{monster.smallFinders.length - 3}</div>
                          )}
                        </div>
                        <span className={styles.stackCount}>{monster.smallFinders.length} Hunters</span>
                      </div>
                    ) : (
                      <span className={styles.pending}>Not Recorded</span>
                    )}
                  </div>
                </div>

                <div className={styles.checkItem + (monster.largeFinders.length > 0 ? ` ${styles.isFound}` : '')}>
                  <Image
                    src="/icons/largecrown.png"
                    width={16} height={16} alt=""
                    className={"pixel-art " + (monster.largeFinders.length > 0 ? '' : styles.grayscale)}
                  />
                  <div className={styles.checkInfo}>
                    <label>Large Crown</label>
                    {monster.largeFinders.length > 0 ? (
                      <div className={styles.hunterStack}>
                        <div className={styles.avatars}>
                          {monster.largeFinders.slice(0, 3).map((f, i) => (
                            <img key={i} src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={styles.stackAvatar} />
                          ))}
                          {monster.largeFinders.length > 3 && (
                            <div className={styles.moreCount}>+{monster.largeFinders.length - 3}</div>
                          )}
                        </div>
                        <span className={styles.stackCount}>{monster.largeFinders.length} Hunters</span>
                      </div>
                    ) : (
                      <span className={styles.pending}>Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className={styles.noResults}>
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art grayscale" />
            <p>No specimens match your search criteria.</p>
            <span>Try searching for a different monster or category.</span>
          </div>
        )}
      </div>
    </div>
  );
}
