'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import styles from './MissionControl.module.css';
import Image from 'next/image';
import { useNotifications } from '@/app/NotificationProvider';

export default function MissionControl() {
  const { data: session } = useSession();
  const { pusherChannel } = useNotifications();
  const pathname = usePathname();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [completedMission, setCompletedMission] = useState(null);
  const missionRef = useRef(null);

  const fetchMission = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/missions/current');
      const data = await res.json();
      setMission(data.mission);
      missionRef.current = data.mission;
      if (data.mission) setCompletedMission(null);
    } catch (err) {
      console.error('Failed to fetch mission:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  useEffect(() => {
    if (!pusherChannel) return;

    const handleNotification = (notif) => {
      if (notif.type === 'hunt_accepted') {
        fetchMission();
      }
    };

    const handleMissionUpdate = (data) => {
      if (data && data.status === 'completed') {
        if (missionRef.current) setCompletedMission(missionRef.current);
        setMission(null);
        missionRef.current = null;
      }
    };

    pusherChannel.bind('notification', handleNotification);
    pusherChannel.bind('mission_update', handleMissionUpdate);

    return () => {
      pusherChannel.unbind('notification', handleNotification);
      pusherChannel.unbind('mission_update', handleMissionUpdate);
    };
  }, [pusherChannel, fetchMission]);

  useEffect(() => {
    if (!mission) return;

    const interval = setInterval(() => {
      const created = new Date(mission.created_at).getTime();
      const now = new Date().getTime();
      const diff = now - created;
      const elapsedMins = Math.floor(diff / 60000);
      const remaining = 50 - elapsedMins;

      if (remaining <= 0) {
        setMission(null);
        missionRef.current = null;
        clearInterval(interval);
      } else {
        const seconds = 59 - Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${remaining - 1}m ${seconds}s left`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mission]);

  const handleComplete = async () => {
    if (!mission || completing) return;
    const currentMission = mission;
    setCompleting(true);
    try {
      const res = await fetch('/api/missions/complete', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // API triggers pusher 'mission_update' which handles the rest
        setCompletedMission(currentMission);
        setMission(null);
        missionRef.current = null;
      } else {
        alert(data.error || 'Failed to complete mission');
      }
    } catch (err) {
      console.error('Failed to complete mission:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading || pathname === '/missions') return null;

  if (completedMission && !mission) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard + " animate-mh-slide-right"}>
          <div className={styles.header}>
            <span className={styles.title} style={{ color: '#2ecc71' }}>Mission Completed!</span>
            <button className={styles.closeBtnSmall} onClick={() => setCompletedMission(null)}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Close" className="pixel-art" />
            </button>
          </div>
          <div className={styles.successBody}>
            <p className={styles.successText}>
              The mission for <strong>{completedMission.monster_name}</strong> ({completedMission.type} Crown) was a success!
            </p>
            <div className={styles.rewardSection}>
              <div className={styles.rewardItem}>
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <div className={styles.rewardInfo}>
                  <span className={styles.rewardName}>{completedMission.host_name}</span>
                  <span className={styles.rewardGain}>+1 Shared Crown</span>
                </div>
              </div>
              <div className={styles.rewardItem}>
                <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <div className={styles.rewardInfo}>
                  <span className={styles.rewardName}>{completedMission.requester_name}</span>
                  <span className={styles.rewardGain}>+1 Mission Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || !mission) return null;

  const isRequester = session.user.id === mission.requester_id;

  return (
    <div className={styles.container}>
      <div className={styles.missionCard + " animate-mh-slide-right"}>
        <div className={styles.header}>
          <span className={styles.title}>Current Objective</span>
          <span className={styles.timer}>{timeLeft}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.monsterIcon}>
            {mission.monster_image && (
              <Image
                src={`/monsters/${mission.monster_image}`}
                width={48}
                height={48}
                alt={mission.monster_name}
                className="pixel-art"
              />
            )}
          </div>
          <div className={styles.details}>
            <span className={styles.monsterName}>{mission.monster_name}</span>
            <div className={styles.questType}>
              <Image
                src={mission.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                width={16}
                height={16}
                alt=""
                className={"pixel-art " + styles.crownIcon}
              />
              <span>{mission.type === 'small' ? 'Small' : 'Large'} Crown</span>
              {mission.tempered === 1 && <span className={styles.temperedTag}>[TEMPERED]</span>}
            </div>
            <div className={styles.party}>
              <div className={styles.partyItem}>
                <span className={styles.role}>Host</span>
                <img src={mission.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} className={styles.avatar} alt="" />
                <span>{mission.host_name}</span>
              </div>
              <div className={styles.partyItem}>
                <span className={styles.role}>Hunter</span>
                <img src={mission.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} className={styles.avatar} alt="" />
                <span>{mission.requester_name}</span>
              </div>
            </div>
            {(mission.lobby_id || mission.quest_password) && (
              <div className={styles.lobbyInfo}>
                {mission.lobby_id && (
                  <div className={styles.lobbyItem}>
                    <Image src="/icons/MHWilds-Lobby_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                    <span className={styles.lobbyValue}>{mission.lobby_id}</span>
                  </div>
                )}
                {mission.quest_password && (
                  <div className={styles.lobbyItem}>
                    <span className={styles.lobbyLabel}>PASS:</span>
                    <span className={styles.lobbyValue}>{mission.quest_password}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.completeBtn}
            onClick={handleComplete}
            disabled={!isRequester || completing}
            title={!isRequester ? "Only the requester can complete the mission" : ""}
          >
            {completing ? 'Processing...' : (isRequester ? 'Complete Mission' : 'Waiting for Hunter...')}
          </button>
          <button className={styles.dismissBtn} onClick={() => setMission(null)} title="Hide Window">
            <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="" className="pixel-art" style={{ opacity: 0.5 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
