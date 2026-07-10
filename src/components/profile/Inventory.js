"use client";

import { useState } from 'react';
import CrownSummary from '../crowns/CrownSummary';
import ProfileCrowns from '../crowns/ProfileCrowns';
import { useToast } from '@/app/UIProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Inventory({
  initialCrowns,
  initialCollection,
  initialWishlist,
  allMonsters,
  isOwner,
  userId
}) {
  const [activeTab, setActiveTab] = useState('host');
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

  const getTabInfo = () => {
    switch (activeTab) {
      case 'host': return "Crowns currently in your inventory, ready to be shared or hosted with the community.";
      case 'hunter': return "Specimens secured in your game. Mark these to earn Mastery Points (10 MP per crown, +10 MP for both).";
      case 'wishlist': return "Monsters you are currently tracking. Wishlisted monsters appear in searches to help others find you.";
      default: return "";
    }
  };

  const hostCount = new Set((initialCrowns || []).map(c => c.monster_id)).size;
  const hunterCount = collection.length;
  const wishCount = wishlist.length;

  const tabs = [
    { key: 'host', label: 'Crowns', count: hostCount },
    { key: 'hunter', label: 'Collected', count: hunterCount },
    { key: 'wishlist', label: 'Wishlist', count: wishCount },
  ];

  return (
    <section className="rounded-2xl border border-white/5 bg-void-panel p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wide text-mist">Inventory</h3>
          <p className="font-body text-sm text-mist-dim">Specimen Collection & Wishlist Status</p>
        </div>

        <div className="grid grid-cols-3 w-full gap-1 rounded-lg border border-white/10 bg-void p-1 sm:flex sm:w-auto sm:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md px-1 py-1.5 sm:px-4 sm:py-2 font-display text-[9px] sm:text-xs uppercase tracking-widest transition-colors ${
                activeTab === tab.key ? 'bg-ember text-void' : 'text-mist hover:text-ember-bright'
              }`}
            >
              <span className="truncate max-w-full">{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] leading-none ${activeTab === tab.key ? 'bg-void/20' : 'bg-white/5 text-mist-dim'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4 font-body text-sm text-mist-dim">
        <p>{getTabInfo()}</p>
        <div className="flex items-center gap-3">
          {isOwner && activeTab !== 'host' && (
            <span className="font-body text-xs italic text-mist-faint">Click the S/L icons to toggle status.</span>
          )}
          {activeTab === 'hunter' && (
            <span className="font-body text-xs text-mist-dim">
              Earned <span className="font-semibold text-ember-bright">{collection.reduce((acc, curr) => acc + (curr.type === 'both' ? 30 : 10), 0)} MP</span>
            </span>
          )}
        </div>
      </div>

      {activeTab === 'host' ? (
        <ProfileCrowns initialCrowns={initialCrowns} isOwner={isOwner} userId={userId} />
      ) : (
        <CrownSummary
          items={activeTab === 'hunter' ? collection : wishlist}
          allMonsters={allMonsters}
          isOwner={isOwner}
          mode={activeTab}
          onToggle={activeTab === 'hunter' ? handleToggleCollection : handleToggleWishlist}
        />
      )}
    </section>
  );
}
