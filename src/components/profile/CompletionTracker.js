"use client";

import { useState } from 'react';
import styles from './CompletionTracker.module.css';
import CrownSummary from '../crowns/CrownSummary';
import { useToast } from '@/app/UIProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CompletionTracker({
  initialCrowns,
  initialCollection,
  initialWishlist,
  allMonsters,
  isOwner,
  userId
}) {
  const [activeTab, setActiveTab] = useState('host');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collection, setCollection] = useState(initialCollection || []);
  const [wishlist, setWishlist] = useState(initialWishlist || []);
  const toast = useToast();
  const router = useRouter();

  const handleToggleCollection = async (monsterId, type) => {
    if (!isOwner) return;

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId, type }),
      });

      if (res.ok) {
        if (!type) {
          setCollection(prev => prev.filter(c => c.monster_id !== monsterId));
        } else {
          setCollection(prev => {
            const filtered = prev.filter(c => c.monster_id !== monsterId);
            return [...filtered, { monster_id: monsterId, type }];
          });
        }
        toast.success(type ? "Updated collection!" : "Removed from collection");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update collection");
    }
  };

  const handleToggleWishlist = async (monsterId, type) => {
    if (!isOwner) return;

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId, type }),
      });

      if (res.ok) {
        if (!type) {
          setWishlist(prev => prev.filter(w => w.monster_id !== monsterId));
        } else {
          setWishlist(prev => {
            const filtered = prev.filter(w => w.monster_id !== monsterId);
            return [...filtered, { monster_id: monsterId, type }];
          });
        }
        toast.success(type ? "Updated wishlist!" : "Removed from wishlist");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update wishlist");
    }
  };

  const getTabData = () => {
    switch (activeTab) {
      case 'host': return initialCrowns;
      case 'hunter': return collection;
      case 'wishlist': return wishlist;
      default: return [];
    }
  };

  const getTabInfo = () => {
    switch (activeTab) {
      case 'host': return "Crowns currently available in this Hunter's records to be shared or hosted with the community.";
      case 'hunter': return "Specimens secured in your game. Mark these to earn Mastery Points (10 MP per crown, +10 MP for both).";
      case 'wishlist': return "Monsters you are currently tracking. Wishlisted monsters appear in searches to help others find you.";
      default: return "";
    }
  };

  const hostCount = new Set((initialCrowns || []).map(c => c.monster_id)).size;
  const hunterCount = collection.length;
  const wishCount = wishlist.length;

  return (
    <section className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`}>
      <header className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className={styles.titleArea}>
          <h3 className="mh-title">Progress Tracker</h3>
          <p>Specimen Collection & Wishlist Status</p>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <label>Hosts</label>
            <span>{hostCount}</span>
          </div>
          <div className={styles.statItem}>
            <label>Completed</label>
            <span>{hunterCount}</span>
          </div>
          <div className={styles.statItem}>
            <label>Wishlist</label>
            <span>{wishCount}</span>
          </div>
        </div>

        <div className={styles.toggleIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'host' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('host')}
          >
            Host Crowns
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'hunter' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('hunter')}
          >
            Crowns Completed
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'wishlist' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            Wishlist
          </button>
        </div>

        <div className={styles.tabInfo}>
          <p>{getTabInfo()}</p>
          {isOwner && activeTab !== 'host' && (
            <span className={styles.interactiveHint}>
              Click the S/L icons to toggle completion/tracking status.
            </span>
          )}
          {activeTab === 'hunter' && (
            <div className={styles.masterySummary}>
              Earned <span className={styles.goldText}>
                {collection.reduce((acc, curr) => acc + (curr.type === 'both' ? 30 : 10), 0)} MP
              </span> from collection
            </div>
          )}
        </div>

        <CrownSummary
          items={getTabData()}
          allMonsters={allMonsters}
          isOwner={isOwner}
          mode={activeTab}
          onToggle={activeTab === 'hunter' ? handleToggleCollection : (activeTab === 'wishlist' ? handleToggleWishlist : null)}
        />
      </div>
    </section>
  );
}
