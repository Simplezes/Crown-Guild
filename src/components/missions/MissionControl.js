'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import styles from './MissionControl.module.css';
import Image from 'next/image';
import { useNotifications } from '@/app/NotificationProvider';
import { useToast } from '@/app/UIProvider';

function getTimeLabel(createdAt) {
  const raw = createdAt || '';
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
  const totalSeconds = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  const remaining = 50 * 60 - totalSeconds;
  if (remaining <= 0) return 'Expired';
  return `${Math.floor(remaining / 60)}m ${remaining % 60}s left`;
}

export default function MissionControl() {
  const { data: session } = useSession();
  const { pusherChannel } = useNotifications();
  const toast = useToast();
  const pathname = usePathname();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [tick, setTick] = useState(0);

  const fetchMissions = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/missions/current');
      const data = await res.json();
      setCards(prev => {
        const fresh = (data.missions || []).map(({ mission, group }) => {
          const existing = prev.find(c => String(c.mission.id) === String(mission.id));
          return { mission, group, status: existing?.status || 'active' };
        });
        const retained = prev.filter(c =>
          c.status === 'completed' && !fresh.find(fc => String(fc.mission.id) === String(c.mission.id))
        );
        const seen = new Set();
        return [...fresh, ...retained].filter(c => {
          const key = String(c.mission.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    } catch (err) {
      console.error('Failed to fetch missions:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setCards(prev => {
      let changed = false;
      const next = prev.map(card => {
        if (card.status !== 'active') return card;
        const raw = card.mission.created_at || '';
        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z';
        const totalSeconds = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
        if (50 * 60 - totalSeconds <= 0) { changed = true; return { ...card, status: 'expired' }; }
        return card;
      });
      return changed ? next : prev;
    });
  }, [tick]);

  useEffect(() => {
    if (!pusherChannel) return;

    const handleNotification = (notif) => {
      if (notif.type === 'hunt_accepted') fetchMissions();
    };

    const handleMissionUpdate = (data) => {
      if (data?.type === 'group_confirmed') {
        fetchMissions();
      } else if (data?.status === 'completed') {
        const { hostId, requesterId, groupId } = data;
        setCards(prev => prev.map(card => {
          const m = card.mission;
          const involved = groupId
            ? (String(m.group_id) === String(groupId))
            : (String(m.host_id) === String(hostId) && String(m.requester_id) === String(requesterId));
          if (involved && card.status !== 'completed') return { ...card, status: 'completed' };
          return card;
        }));
      } else if (data?.status === 'expired') {
        const { requesterId } = data;
        if (requesterId) {
          setCards(prev => prev.filter(card => card.mission.requester_id !== requesterId));
        }
      }
    };

    pusherChannel.bind('notification', handleNotification);
    pusherChannel.bind('notification_created', fetchMissions);
    pusherChannel.bind('mission_update', handleMissionUpdate);

    return () => {
      pusherChannel.unbind('notification', handleNotification);
      pusherChannel.unbind('notification_created', fetchMissions);
      pusherChannel.unbind('mission_update', handleMissionUpdate);
    };
  }, [pusherChannel, fetchMissions]);

  const handleComplete = async (missionId) => {
    if (completing) return;
    const card = cards.find(c => c.mission.id === missionId);
    if (!card) return;
    setCompleting(missionId);
    try {
      const res = await fetch('/api/missions/complete', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (!card.mission.group_id || data.allDone) {
          setCards(prev => prev.map(c => c.mission.id === missionId ? { ...c, status: 'completed' } : c));
        } else {
          fetchMissions();
        }
      } else {
        toast.error(data.error || 'Failed to complete mission');
      }
    } catch (err) {
      console.error('Failed to complete mission:', err);
    } finally {
      setCompleting(null);
    }
  };

  const handleExpire = async (missionId) => {
    try {
      await fetch('/api/missions/expire', { method: 'POST' });
    } catch (err) {
      console.error('Failed to expire mission:', err);
    }
    setCards(prev => prev.filter(c => c.mission.id !== missionId));
  };

  const dismissCard = (missionId) => {
    setCards(prev => prev.filter(c => c.mission.id !== missionId));
  };

  if (loading || pathname === '/missions') return null;
  if (cards.length === 0) return null;

  return (
    <div className={styles.container}>
      {cards.map(({ mission, group, status }) => {
        const typeLabel = mission.type === 'small' ? 'Small' : 'Large';
        const isRequester = session?.user?.id === mission.requester_id;
        const timeLabel = getTimeLabel(mission.created_at);

        if (status === 'completed') {
          return (
            <div key={mission.id} className={styles.successCard + " animate-mh-slide-right"}>
              <div className={styles.header}>
                <span className={styles.title} style={{ color: '#2ecc71' }}>Mission Completed!</span>
                <button className={styles.closeBtnSmall} onClick={() => dismissCard(mission.id)}>
                  <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Close" className="pixel-art" />
                </button>
              </div>
              <div className={styles.successBody}>
                <p className={styles.successText}>
                  The mission for <strong>{mission.monster_name}</strong> ({mission.type} Crown) was a success!
                </p>
                <div className={styles.rewardSection}>
                  <div className={styles.rewardItem}>
                    <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                    <div className={styles.rewardInfo}>
                      <span className={styles.rewardName}>{mission.host_name}</span>
                      <span className={styles.rewardGain}>+1 Shared Crown</span>
                    </div>
                  </div>
                  <div className={styles.rewardItem}>
                    <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                    <div className={styles.rewardInfo}>
                      <span className={styles.rewardName}>{mission.requester_name}</span>
                      <span className={styles.rewardGain}>+1 Mission Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (status === 'expired' && isRequester) {
          return (
            <div key={mission.id} className={styles.expiredCard + " animate-mh-slide-right"}>
              <div className={styles.expiredTop}>
                <span className={styles.expiredIcon}>⏱️</span>
                <div className={styles.expiredInfo}>
                  <span className={styles.expiredTitle}>Quest Timer Expired</span>
                  <span className={styles.expiredSub}>{mission.monster_name} · {typeLabel} Crown</span>
                </div>
              </div>
              <p className={styles.expiredQuestion}>Did you get the crown?</p>
              <div className={styles.expiredActions}>
                <button className={styles.expiredYes} onClick={() => handleComplete(mission.id)}>
                  ✓ Yes
                </button>
                <button className={styles.expiredNo} onClick={() => handleExpire(mission.id)}>
                  ✗ No
                </button>
              </div>
            </div>
          );
        }

        if (mission.group_id) {
          const isHost = session?.user?.id === mission.host_id;
          const myMember = group?.find(m => m.requester_id === session?.user?.id);
          const myConfirmed = myMember?.hunter_confirmed === 1;

          return (
            <div key={mission.id} className={styles.groupCard + " animate-mh-slide-right"}>
              <div className={styles.header}>
                <span className={styles.title}>SOS Group Quest</span>
                <span className={styles.timer}>{timeLabel}</span>
              </div>
              <div className={styles.content}>
                <div className={styles.monsterIcon}>
                  {mission.monster_image && (
                    <Image src={`/monsters/${mission.monster_image}`} width={48} height={48} alt={mission.monster_name} className="pixel-art" />
                  )}
                </div>
                <div className={styles.details}>
                  <span className={styles.monsterName}>{mission.monster_name}</span>
                  <div className={styles.questType}>
                    <Image src={mission.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={16} height={16} alt="" className={"pixel-art " + styles.crownIcon} />
                    <span>{typeLabel} Crown</span>
                    {mission.tempered === 1 && <span className={styles.temperedTag}>[TEMPERED]</span>}
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
                  <div className={styles.groupParty}>
                    <div className={styles.groupMember}>
                      <img src={mission.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} className={styles.avatar} alt="" />
                      <span className={styles.groupMemberName}>{mission.host_name}</span>
                      <span className={styles.hostBadge}>Host</span>
                    </div>
                    {(group || []).map(m => (
                      <div key={m.requester_id} className={styles.groupMember}>
                        <img src={m.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} className={styles.avatar} alt="" />
                        <span className={styles.groupMemberName}>{m.requester_name}</span>
                        {m.hunter_confirmed === 1
                          ? <span className={styles.confirmedCheck}>✓</span>
                          : <span className={styles.pendingCheck}>○</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.actions}>
                {isHost ? (
                  <button className={styles.completeBtn} disabled>Hosting...</button>
                ) : myConfirmed ? (
                  <button className={styles.completeBtn} disabled>Crown Confirmed ✓</button>
                ) : (
                  <button className={styles.completeBtn} onClick={() => handleComplete(mission.id)} disabled={completing === mission.id}>
                    {completing === mission.id ? 'Processing...' : 'I got the Crown!'}
                  </button>
                )}
                <button className={styles.dismissBtn} onClick={() => dismissCard(mission.id)} title="Hide Window">
                  <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="" className="pixel-art" style={{ opacity: 0.5 }} />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={mission.id} className={styles.missionCard + " animate-mh-slide-right"}>
            <div className={styles.header}>
              <span className={styles.title}>Current Objective</span>
              <span className={styles.timer}>{timeLabel}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.monsterIcon}>
                {mission.monster_image && (
                  <Image src={`/monsters/${mission.monster_image}`} width={48} height={48} alt={mission.monster_name} className="pixel-art" />
                )}
              </div>
              <div className={styles.details}>
                <span className={styles.monsterName}>{mission.monster_name}</span>
                <div className={styles.questType}>
                  <Image src={mission.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={16} height={16} alt="" className={"pixel-art " + styles.crownIcon} />
                  <span>{typeLabel} Crown</span>
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
                onClick={() => handleComplete(mission.id)}
                disabled={!isRequester || completing === mission.id}
                title={!isRequester ? "Only the requester can complete the mission" : ""}
              >
                {completing === mission.id ? 'Processing...' : (isRequester ? 'Complete Mission' : 'Waiting for Hunter...')}
              </button>
              <button className={styles.dismissBtn} onClick={() => dismissCard(mission.id)} title="Hide Window">
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="" className="pixel-art" style={{ opacity: 0.5 }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
