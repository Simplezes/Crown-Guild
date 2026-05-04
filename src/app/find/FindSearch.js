'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './find.module.css';
import MonsterIcon from '@/components/MonsterIcon';

export default function FindSearch({ initialHosts }) {
  const [search, setSearch] = useState('');

  const filteredHosts = useMemo(() => {
    if (!search.trim()) return initialHosts;
    const term = search.toLowerCase();
    return initialHosts.filter(h =>
      h.monster_name.toLowerCase().includes(term) ||
      h.username.toLowerCase().includes(term) ||
      (h.quest && h.quest.toLowerCase().includes(term))
    );
  }, [search, initialHosts]);

  const groupedHosts = useMemo(() => {
    const groups = {};
    filteredHosts.forEach(host => {
      if (!groups[host.monster_name]) {
        groups[host.monster_name] = {
          name: host.monster_name,
          image: host.monster_image,
          emoji: host.monster_emoji,
          hosts: []
        };
      }
      groups[host.monster_name].hosts.push(host);
    });
    return Object.values(groups);
  }, [filteredHosts]);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchInner}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by Monster, Hunter, or Quest type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <div className={styles.searchStats}>
          {filteredHosts.length} Active Hosts Available
        </div>
      </div>

      <div className={styles.resultsGrid}>
        {groupedHosts.length > 0 ? (
          groupedHosts.map((group) => (
            <div key={group.name} className={styles.monsterGroup}>
              <div className={styles.groupHeader}>
                <MonsterIcon imageName={group.image} name={group.name} size={48} />
                <h2>{group.name}</h2>
              </div>

              <div className={styles.hostsList}>
                {group.hosts.map((host) => (
                  <div key={host.id} className={styles.hostCard}>
                    <div className={styles.hostMain}>
                      <div className={styles.hunterInfo}>
                        <img
                          src={host.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                          alt=""
                          className={styles.avatar}
                        />
                        <div className={styles.hunterText}>
                          <Link href={`/profile/${host.user_id}`} className={styles.hunterName}>
                            {host.username}
                          </Link>
                          <span className={styles.status}>
                            {host.lobby_id ? (
                              <span className={styles.online}><span className={styles.dot}></span> In Lobby</span>
                            ) : (
                              <span className={styles.offline}>Available</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={styles.questDetails}>
                        <div className={styles.crownType}>
                          <Image
                            src={host.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                            width={16} height={16} alt="" className="pixel-art"
                          />
                          <span className={host.tempered ? styles.temperedText : styles.normalText}>
                            {host.type} Crown
                          </span>
                        </div>
                        <div className={styles.questMeta}>
                          {host.quest || "Hunt"} • {host.strength_rating}★
                          {host.remaining_uses !== null && ` • ${host.remaining_uses} Left`}
                        </div>
                      </div>
                    </div>

                    <div className={styles.hostActions}>
                      <Link
                        href={`https://discord.com/users/${host.user_id}`}
                        className={styles.actionBtn}
                        target="_blank"
                      >
                        <Image src="/icons/MHWilds-Squad_Information_Counter_Icon.png" width={20} height={20} alt="" className="pixel-art" />
                        Contact Host
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={64} height={64} alt="" className="pixel-art grayscale" />
            <h3>No hosts found for "{search}"</h3>
            <p>Try searching for a different monster or broaden your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
