"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProfileSettings.module.css';
import Image from 'next/image';
import { useToast } from '@/app/UIProvider';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { emojiservers } from '@/lib/emojiservers';

function getGuildIconUrl(guild) {
  if (!guild?.id || !guild?.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
}

export default function ProfileSettings({ user, isOwner }) {
  const { data: session, update } = useSession();
  const toast = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sessionServerId = String(session?.user?.mainCrownServerId || '');
    if (!sessionServerId) return;

    setFormData((prev) => {
      if (prev.main_crown_server_id) return prev;
      return { ...prev, main_crown_server_id: sessionServerId };
    });
  }, [session?.user?.mainCrownServerId]);

  const [formData, setFormData] = useState({
    lobby_id: user.lobby_id || '',
    quest_password: user.quest_password || '',
    status_message: user.status_message || '',
    receive_dms: user.receive_dms !== 0,
    main_crown_server_id: user.main_crown_server_id || ''
  });

  const guilds = Array.isArray(session?.user?.guilds) ? session.user.guilds : [];
  const emojiGuilds = guilds.filter((guild) => !!emojiservers[String(guild?.id || '')]);
  const selectedGuild = emojiGuilds.find((guild) => String(guild.id) === String(formData.main_crown_server_id || '')) || null;

  const selectedLabel = selectedGuild ? selectedGuild.name : 'Text only (no emoji server)';

  if (!isOwner) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update();
        toast.success('Settings updated successfully!');
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error('Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = isEditing && (
    <div className={styles.overlay} onClick={() => setIsEditing(false)}>
      <div className={`${styles.modal} animate-mh-slide-down`} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <Image src="/icons/MHWilds-Settings_Icon.png" width={24} height={24} alt="" className="pixel-art" />
            <h2 className="mh-title">Hunter Settings</h2>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsEditing(false)}>×</button>
        </header>

        <div className={styles.content}>
          <div className={styles.field}>
            <label>Default Session ID</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                value={formData.lobby_id} 
                onChange={e => setFormData({...formData, lobby_id: e.target.value})}
                placeholder="e.g. 4Y8x h3Wn ZvB2"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Quest Password</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                value={formData.quest_password} 
                onChange={e => setFormData({...formData, quest_password: e.target.value})}
                placeholder="e.g. 1234"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Status Message</label>
            <div className={styles.inputWrapper}>
              <textarea 
                value={formData.status_message} 
                onChange={e => setFormData({...formData, status_message: e.target.value})}
                placeholder="Share a status note with other hunters..."
                maxLength={100}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Main Crown Server</label>
            <div className={styles.serverPicker}>
              <button
                type="button"
                className={styles.serverTrigger}
                onClick={() => setServerMenuOpen((prev) => !prev)}
              >
                <span>{selectedLabel}</span>
                <span className={styles.serverChevron}>{serverMenuOpen ? '▴' : '▾'}</span>
              </button>

              {serverMenuOpen && (
                <div className={styles.serverMenu}>
                  <button
                    type="button"
                    className={`${styles.serverOption} ${!formData.main_crown_server_id ? styles.serverOptionActive : ''}`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, main_crown_server_id: '' }));
                      setServerMenuOpen(false);
                    }}
                  >
                    <div className={styles.serverMeta}>
                      <span className={styles.serverName}>Text only (no emoji server)</span>
                    </div>
                  </button>

                  {emojiGuilds.map((guild) => {
                    const iconUrl = getGuildIconUrl(guild);
                    const active = String(formData.main_crown_server_id || '') === String(guild.id);

                    return (
                      <button
                        key={guild.id}
                        type="button"
                        className={`${styles.serverOption} ${active ? styles.serverOptionActive : ''}`}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, main_crown_server_id: String(guild.id) }));
                          setServerMenuOpen(false);
                        }}
                      >
                        {iconUrl ? (
                          <img src={iconUrl} alt="" className={styles.serverIcon} />
                        ) : (
                          <div className={styles.serverIconFallback}>{String(guild.name || '?').charAt(0).toUpperCase()}</div>
                        )}
                        <div className={styles.serverMeta}>
                          <span className={styles.serverName}>{guild.name}</span>
                          <span className={styles.serverId}>{guild.id}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.field + " " + styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={formData.receive_dms} 
                onChange={e => setFormData({...formData, receive_dms: e.target.checked})}
              />
              <span>Receive Discord DMs for Beacon Requests</span>
            </label>
          </div>
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
          <button className={`mh-button ${styles.saveBtn}`} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </footer>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <button 
        className={`mh-button ${styles.toggleBtn}`}
        onClick={() => setIsEditing(true)}
      >
        <Image src="/icons/MHWilds-Settings_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        <span>Manage Settings</span>
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </div>
  );
}
