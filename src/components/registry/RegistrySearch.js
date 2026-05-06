"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RegistrySearch.module.css';
import WishlistToggle from '../wishlist/WishlistToggle';
import InfoTrigger from '../ui/InfoTrigger';
import { QUEST_SYSTEM_ENABLED } from '@/lib/sos';

export default function RegistrySearch({ initialRegistry }) {
  const [search, setSearch] = useState('');

  const filteredRegistry = useMemo(() => {
    if (!search.trim()) return initialRegistry;
    const term = search.toLowerCase();
    return initialRegistry.filter(m => {
      const isBountyMatch = QUEST_SYSTEM_ENABLED && m.isBounty && term === 'bounty';
      return m.name.toLowerCase().includes(term) ||
        (m.extraInfo?.type && m.extraInfo.type.toLowerCase().includes(term)) ||
        isBountyMatch;
    });
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
          {QUEST_SYSTEM_ENABLED && (
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={styles.feverDot}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <span>Guild Fever</span>
                <InfoTrigger
                  title="Guild Fever"
                  content="A rare temporary status. Contributing to investigations while in Fever grants 3x Mastery Points."
                  align="right"
                />
              </div>
              <div className={styles.legendItem}>
                <div className={styles.resonanceDot}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.256 1.1-3.1z"></path>
                  </svg>
                </div>
                <span>Resonance</span>
                <InfoTrigger
                  title="Resonance"
                  content="Indicates how often this crown has been shared with others. Higher resonance means more community contribution."
                  align="right"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.ledgerGrid}>
        {filteredRegistry.length > 0 ? (
          filteredRegistry.map((monster) => (
            <Link
              key={monster.id}
              href={`/monster/${monster.name}`}
              className={`${styles.monsterCard} ${QUEST_SYSTEM_ENABLED && monster.isBounty ? styles.bountyCard : ''}`}
            >
              {QUEST_SYSTEM_ENABLED && monster.isBounty && (
                <div className={styles.bountyRibbon}>
                  <span>BOUNTY</span>
                </div>
              )}
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
                          <div key={i} className={styles.avatarWrapper}>
                            <img src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={`${styles.stackAvatar} ${f.isFever ? styles.feverAvatar : ''}`} />
                            {QUEST_SYSTEM_ENABLED && f.isFever && (
                              <div className={styles.feverGlow} title="GUILD FEVER! (3x Points)">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                              </div>
                            )}
                            {QUEST_SYSTEM_ENABLED && f.resonance >= 3 && (
                              <div className={styles.resonanceFlame} title={`Resonance Lvl ${f.resonance}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.256 1.1-3.1z"></path>
                                </svg>
                              </div>
                            )}
                          </div>
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
                          <div key={i} className={styles.avatarWrapper}>
                            <img src={f.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"} alt={f.username} className={`${styles.stackAvatar} ${f.isFever ? styles.feverAvatar : ''}`} />
                            {QUEST_SYSTEM_ENABLED && f.isFever && (
                              <div className={styles.feverGlow} title="GUILD FEVER! (3x Points)">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                              </div>
                            )}
                            {QUEST_SYSTEM_ENABLED && f.resonance >= 3 && (
                              <div className={styles.resonanceFlame} title={`Resonance Lvl ${f.resonance}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.256 1.1-3.1z"></path>
                                </svg>
                              </div>
                            )}
                          </div>
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
