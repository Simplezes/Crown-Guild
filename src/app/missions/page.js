'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import styles from './Missions.module.css';
import { useNotifications } from '@/app/NotificationProvider';
import { useToast } from '@/app/UIProvider';

export default function MissionsPage() {
  const { data: session } = useSession();
  const { pusherChannel } = useNotifications();
  const toast = useToast();
  const [currentMission, setCurrentMission] = useState(null);
  const currentMissionRef = useRef(null);
  const [completedMission, setCompletedMission] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [commending, setCommending] = useState(false);
  const [commendedId, setRecommendedId] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  const fetchHistory = async (p) => {
    try {
      const res = await fetch(`/api/user/missions?page=${p}&limit=${limit}`);
      const data = await res.json();
      setHistory(data.missions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleComplete = async () => {
    if (!currentMission || completing) return;
    const missionData = currentMission;
    setCompleting(true);
    try {
      const res = await fetch('/api/missions/complete', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const historyRes = await fetch(`/api/user/missions?page=1&limit=1`);
        const historyData = await historyRes.json();
        const latest = historyData.missions[0];

        setCompletedMission({ ...missionData, id: latest?.id });
        setCurrentMission(null);
        fetchHistory(1);
      } else {
        toast.error(data.error || 'Failed to complete mission');
      }
    } catch (err) {
      console.error('Failed to complete mission:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleCommend = async (missionId) => {
    if (commending || commendedId === missionId) return;
    setCommending(true);
    try {
      const res = await fetch('/api/missions/commend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      });
      if (res.ok) {
        setRecommendedId(missionId);
        toast.success('Commendation sent! Guild Renown increased.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommending(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        const currRes = await fetch('/api/missions/current');
        const currData = await currRes.json();
        setCurrentMission(currData.mission);
        currentMissionRef.current = currData.mission;
        if (currData.mission) setCompletedMission(null);
        await fetchHistory(page);
      } catch (err) {
        console.error('Failed to fetch missions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (pusherChannel) {
      const onMissionUpdate = (data) => {
        if (data && data.status === 'completed') {
          if (currentMissionRef.current) {
            setCompletedMission(currentMissionRef.current);
          }
          setCurrentMission(null);
          currentMissionRef.current = null;
          fetchHistory(1);
        }
      };
      pusherChannel.bind('mission_update', onMissionUpdate);
      return () => pusherChannel.unbind('mission_update', onMissionUpdate);
    }
  }, [session?.user?.id, pusherChannel]);

  useEffect(() => {
    currentMissionRef.current = currentMission;
  }, [currentMission]);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      fetchHistory(page);
    }
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  if (!session) {
    return (
      <main className={styles.pageWrapper}>
        <div className="premium-container">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Image src="/icons/MHWilds-Village_Intermediary_Icon.png" width={64} height={64} alt="" className="pixel-art" />
            </div>
            <h1 className="mh-title">Identity Required</h1>
            <p>Please enlist in the Guild to view your classified mission logs.</p>
          </div>
        </div>
      </main>
    );
  }

  if (loading) return null;

  return (
    <main className={styles.pageWrapper}>
      <div className="premium-container animate-mh-fade">
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.subtitle}>Guild Intelligence System</span>
            <h1 className="gold-text mh-title">Mission Dashboard</h1>
          </div>
          <div className={styles.statusIndicator}>
            {currentMission ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71' }}>
                <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                <span>Deployment Active</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <Image src="/icons/MHWilds-Notes_Asterisk_Icon.png" width={14} height={14} alt="" className="pixel-art" style={{ opacity: 0.5 }} />
                <span>Standby Mode</span>
              </div>
            )}
          </div>
        </header>

        <div className={styles.dashboardGrid}>
          <section>
            <div className={styles.sectionLabel}>
              <span>Active Objective</span>
              <div className={styles.sectionLine}></div>
            </div>

            {currentMission ? (
              <div className={styles.activeCard}>
                <div className={styles.targetInfo}>
                  <div className={styles.monsterIcon}>
                    <Image
                      src={`/monsters/${currentMission.monster_image}`}
                      width={64}
                      height={64}
                      alt=""
                      className="pixel-art"
                    />
                  </div>
                  <div className={styles.targetMeta}>
                    <h2 className="mh-title gold-text">{currentMission.monster_name}</h2>
                    <div className={styles.badgeGroup}>
                      <span className={styles.badge}>{currentMission.type} Crown</span>
                      {currentMission.tempered === 1 && <span className={`${styles.badge} ${styles.temperedBadge}`}>Tempered</span>}
                      <span className={styles.badge}>
                        {currentMission.strength_rating}★
                        Rating
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.sessionDetails}>
                  <div className={styles.sessionItem}>
                    <p className={styles.sessionLabel}>Session ID</p>
                    <span className={styles.sessionValue}>{currentMission.lobby_id || "NOT SET"}</span>
                  </div>
                  <div className={styles.sessionItem}>
                    <p className={styles.sessionLabel}>Quest Password</p>
                    <span className={styles.sessionValue}>{currentMission.quest_password || "NONE"}</span>
                  </div>
                </div>

                <div className={styles.partyList}>
                  <div className={styles.partyMember}>
                    <img src={currentMission.host_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.memberAvatar} />
                    <div className={styles.memberInfo}>
                      <span className={styles.roleLabel}>Quest owner</span>
                      <span className={styles.memberName}>{currentMission.host_name}</span>
                    </div>
                  </div>
                  <div className={styles.partyMember}>
                    <img src={currentMission.requester_avatar || "/icons/MHWilds-Quest_Members_Icon.png"} alt="" className={styles.memberAvatar} />
                    <div className={styles.memberInfo}>
                      <span className={styles.roleLabel}>Requester</span>
                      <span className={styles.memberName}>{currentMission.requester_name}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className="mh-button"
                    style={{ width: '100%', fontSize: '0.7rem' }}
                    onClick={handleComplete}
                    disabled={session.user.id !== currentMission.requester_id || completing}
                  >
                    {completing ? 'Processing...' : (session.user.id === currentMission.requester_id ? 'Complete Mission' : 'Waiting for Hunter...')}
                  </button>
                </div>
              </div>
            ) : completedMission ? (
              <div className={styles.successCard + " animate-mh-slide-right"}>
                <header className={styles.successHeader}>
                  <h2 className={styles.successTitle}>Mission Success!</h2>
                  <button className={styles.closeBtn} onClick={() => setCompletedMission(null)}>
                    <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Close" className="pixel-art" />
                  </button>
                </header>

                <p className={styles.successSummary}>
                  The investigation for <strong>{completedMission.monster_name}</strong> was successful. Guild records have been updated.
                </p>

                <div className={styles.rewardSection}>
                  <div className={styles.rewardItem}>
                    <div className={styles.rewardIcon}>
                      <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                    </div>
                    <div className={styles.rewardInfo}>
                      <span className={styles.rewardUser}>{completedMission.host_name} (Host)</span>
                      <span className={styles.rewardValue}>+1 Shared Crown</span>
                    </div>
                  </div>
                  <div className={styles.rewardItem}>
                    <div className={styles.rewardIcon}>
                      <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={18} height={18} alt="" className="pixel-art" />
                    </div>
                    <div className={styles.rewardInfo}>
                      <span className={styles.rewardUser}>{completedMission.requester_name} (Hunter)</span>
                      <span className={styles.rewardValue}>+1 Mission Completed</span>
                    </div>
                  </div>
                </div>

                {session.user.id === completedMission.requester_id && (
                  <div className={styles.commendationZone}>
                    <p className={styles.commendText}>Support your fellow Hunter?</p>
                    <button
                      className={`${styles.commendBtn} ${commendedId === completedMission.id ? styles.commended : ''}`}
                      onClick={() => handleCommend(completedMission.id)}
                      disabled={commendedId === completedMission.id || commending}
                    >
                      {commendedId === completedMission.id ? 'Commended ✓' : 'Give Commendation (👍)'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={64} height={64} alt="" className="pixel-art" />
                <p>No active deployment detected.</p>
              </div>
            )}
          </section>

          <section>
            <div className={styles.sectionLabel}>
              <span>Deployment Logs</span>
              <div className={styles.sectionLine}></div>
            </div>

            <div className={styles.historyContainer}>
              {history.length > 0 ? history.map((m) => (
                <div key={m.id} className={styles.historyItem}>
                  <div className={styles.histIcon}>
                    <Image src={`/monsters/${m.monster_image}`} width={32} height={32} alt="" className="pixel-art" />
                  </div>
                  <div className={styles.histContent}>
                    <div className={styles.histTitleRow}>
                      <span className={styles.histName}>{m.monster_name}</span>
                      <span className={styles.histDate}>{new Date(m.completed_at).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.histMetaRow}>
                      <span className={m.type === 'small' ? styles.smallGold : styles.largeGold}>
                        {m.type === 'small' ? 'Small Gold' : 'Large Gold'}
                      </span>
                      <span>•</span>
                      <span>{session.user.id === m.host_id ? `Hunter: ${m.requester_name}` : `Host: ${m.host_name}`}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState} style={{ padding: '30px' }}>
                  <p>Historical logs are empty.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
