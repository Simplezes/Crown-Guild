"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './LiveRadar.module.css';
import Image from 'next/image';
import { useToast } from '@/app/UIProvider';
import { useSession } from 'next-auth/react';

export default function LiveRadar() {
  const { data: session } = useSession();
  const [flares, setFlares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const toast = useToast();
  const pusherRef = useRef(null);

  const fetchFlares = async () => {
    try {
      const res = await fetch('/api/flares');
      const data = await res.json();
      setFlares(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlares();

    import('@/lib/pusher-client').then(({ pusherClient }) => {
      pusherRef.current = pusherClient;
      const channel = pusherClient.subscribe('public-channel');
      channel.bind('flare_updated', () => {
        fetchFlares();
      });
    });

    const timerInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      if (pusherRef.current) pusherRef.current.unsubscribe('public-channel');
      clearInterval(timerInterval);
    };
  }, []);

  const handleAction = async (flareId, action) => {
    if (!session) {
      toast.error("Please login to join hunts!");
      return;
    }

    try {
      const res = await fetch('/api/flares/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flareId, action })
      });

      if (res.ok) {
        toast.success(action === 'join' ? "Joined the queue!" : action === 'leave' ? "Left the queue." : action === 'start' ? "Quest started! Missions assigned." : "Flare closed.");
        fetchFlares();
      } else {
        const err = await res.text();
        toast.error(err || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  if (loading && flares.length === 0) return null;
  if (!loading && flares.length === 0) return null;

  return (
    <div className={styles.radarContainer + " animate-mh-slide-down"}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.pulse}></div>
          <Image src="/icons/MHWilds-Hunt_Icon.png" width={20} height={20} alt="" className="pixel-art" />
          <h3 className="mh-title">Active SOS Beacons</h3>
        </div>
        <span className={styles.liveCount}>{flares.length} Operational Beacons</span>
      </header>

      <div className={styles.flareList}>
        {flares.map(flare => {
          const createdAt = new Date(flare.created_at + 'Z').getTime();
          const expiresAt = createdAt + (5 * 60 * 1000);
          const timeLeft = Math.max(0, expiresAt - now);

          const mins = Math.floor(timeLeft / 60000);
          const secs = Math.floor((timeLeft % 60000) / 1000);
          const isExpired = timeLeft <= 0;

          if (isExpired) return null;

          const isHost = session?.user?.id === flare.host_id;

          return (
            <div key={flare.id} className={styles.flareCard}>
              <div className={styles.monsterIcon}>
                <Image
                  src={`/monsters/${flare.image_name}`}
                  width={40}
                  height={40}
                  alt=""
                  className={`pixel-art ${flare.tempered ? 'tempered-monster-icon' : ''}`}
                />
              </div>
              <div className={styles.flareInfo}>
                <div className={styles.topLine}>
                  <span className={styles.monsterName}>{flare.monster_name}</span>
                  <span className={`${styles.timer} ${timeLeft < 60000 ? styles.timerUrgent : ''}`}>
                    {mins}:{secs < 10 ? '0' : ''}{secs}
                  </span>
                </div>
                <div className={styles.hostLine}>
                  <img src={flare.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.hostAvatar} title={flare.host_name} />
                  <span className={styles.hostName}>{flare.host_name}</span>
                </div>
                {flare.members?.length > 0 && (
                  <div className={styles.memberRow}>
                    {flare.members.map(m => (
                      <img
                        key={m.id}
                        src={m.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                        alt={m.username}
                        className={styles.memberAvatar}
                        title={m.username}
                      />
                    ))}
                    <span className={styles.memberCount}>{flare.members.length}/4 hunters</span>
                  </div>
                )}
                {(!flare.members || flare.members.length === 0) && (
                  <span className={styles.seekingHunters}>Seeking party...</span>
                )}
              </div>

              <div className={styles.actions}>
                {isHost ? (
                  <>
                    <button
                      onClick={() => handleAction(flare.id, 'start')}
                      className={styles.startBtn}
                      title="Start Quest"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleAction(flare.id, 'close')}
                      className={styles.closeBtn}
                      title="Close SOS"
                    >
                      Close
                    </button>
                  </>
                ) : flare.is_joined ? (
                  <button
                    onClick={() => handleAction(flare.id, 'leave')}
                    className={styles.leaveBtn}
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(flare.id, 'join')}
                    className={styles.joinBtn}
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
