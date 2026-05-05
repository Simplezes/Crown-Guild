"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RegistrySearch.module.css';
import WishlistToggle from '../wishlist/WishlistToggle';

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
            >
              <div className={styles.cardTop}>
                <div className={styles.monsterIcon}>
                  {monster.image_name ? (
                    <Image
                      src={`/monsters/${monster.image_name}`}
                      alt={monster.name}
                      width={52}
                      height={52}
                      className="pixel-art"
                    />
                  ) : (
                    <Image src="/icons/MHWilds-Hunt_Icon.png" width={32} height={32} alt="" className="pixel-art" />
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <div className={styles.nameRow}>
                    <h3>{monster.name}</h3>
                    <div className={styles.badgeGroup}>
                      {monster.demand > 0 && (
                        <div className={styles.demandBadge} title={`${monster.demand} hunters have this on their wishlist`}>
                          <Image src="/icons/MHWilds-Wishlist_Pin_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                          <span>{monster.demand}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {monster.extraInfo?.type && (
                    <span className={styles.monsterType}>{monster.extraInfo.type}</span>
                  )}
                </div>
              </div>

              <div className={styles.crownRows}>
                <div className={`${styles.crownRow} ${monster.smallFinders.length > 0 ? styles.crownRowFound : ''}`}>
                  <Image
                    src="/icons/smallcrown.png"
                    width={13} height={13} alt="S"
                    className={`pixel-art ${monster.smallFinders.length === 0 ? styles.grayscale : ''}`}
                  />
                  {monster.smallFinders.length > 0 ? (
                    <>
                      <div className={styles.avatarStack}>
                        {monster.smallFinders.slice(0, 4).map((f, i) => (
                          <img key={i} src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={styles.stackAvatar} />
                        ))}
                        {monster.smallFinders.length > 4 && (
                          <div className={styles.moreCount}>+{monster.smallFinders.length - 4}</div>
                        )}
                      </div>
                      <span className={styles.hunterCount}>{monster.smallFinders.length}</span>
                    </>
                  ) : (
                    <span className={styles.pending}>Not Recorded</span>
                  )}
                </div>

                <div className={`${styles.crownRow} ${monster.largeFinders.length > 0 ? styles.crownRowFound : ''}`}>
                  <Image
                    src="/icons/largecrown.png"
                    width={15} height={15} alt="L"
                    className={`pixel-art ${monster.largeFinders.length === 0 ? styles.grayscale : ''}`}
                  />
                  {monster.largeFinders.length > 0 ? (
                    <>
                      <div className={styles.avatarStack}>
                        {monster.largeFinders.slice(0, 4).map((f, i) => (
                          <img key={i} src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={styles.stackAvatar} />
                        ))}
                        {monster.largeFinders.length > 4 && (
                          <div className={styles.moreCount}>+{monster.largeFinders.length - 4}</div>
                        )}
                      </div>
                      <span className={styles.hunterCount}>{monster.largeFinders.length}</span>
                    </>
                  ) : (
                    <span className={styles.pending}>Not Recorded</span>
                  )}
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
