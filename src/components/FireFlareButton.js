"use client";

import { useState } from 'react';
import styles from './FireFlareButton.module.css';
import Image from 'next/image';
import { useToast } from '@/app/UIProvider';
import Link from 'next/link';

export default function FireFlareButton({ monsterId, monsterName, userCrowns, hasLobbyId }) {
  const [loading, setLoading] = useState(false);
  const [fired, setFired] = useState(false);
  const toast = useToast();

  if (!userCrowns || userCrowns.length === 0) return null;

  const handleFire = async (crownId) => {
    if (!hasLobbyId) {
      toast.error("Set your Lobby ID in profile settings first!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/flares/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterId, crownId })
      });

      if (res.ok) {
        setFired(true);
        toast.success(`SOS Flare fired for ${monsterName}! Check the Live Radar.`);
        setTimeout(() => setFired(false), 5000);
      } else {
        const err = await res.text();
        toast.error(err || "Failed to fire flare.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Global SOS Broadcast</h4>
      <div className={styles.options}>
        {userCrowns.map(crown => (
          <button
            key={crown.id}
            onClick={() => handleFire(crown.id)}
            disabled={loading || fired}
            className={`${styles.flareBtn} ${fired ? styles.fired : ''}`}
          >
            <Image 
              src={crown.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} 
              width={20} height={20} alt="" className="pixel-art" 
            />
            <span>Broadcast {crown.type === 'small' ? 'S' : 'L'} Flare</span>
          </button>
        ))}
      </div>
      {!hasLobbyId && (
        <Link href="/profile/me" className={styles.settingsLink}>
          ⚠️ Set Lobby ID to enable Flares
        </Link>
      )}
    </div>
  );
}
