"use client";

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProfileSettings.module.css';
import Image from 'next/image';
import { useToast, useConfirm } from '@/app/UIProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { emojiservers } from '@/lib/emojiservers';

function getGuildIconUrl(guild) {
  if (!guild?.id || !guild?.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
}

function SettingsContent({ user, isOwner, sessionData }) {
  const session = sessionData;
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('settings') === 'true') {
      setIsEditing(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams]);

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
    const normalizedPassword = String(formData.quest_password || '').trim();
    if (normalizedPassword !== '' && !/^\d{4}$/.test(normalizedPassword)) {
      setValidationError('Quest Password must be exactly 4 digits (numbers only).');
      toast.error('Quest Password must be exactly 4 digits (numbers only).');
      return;
    }

    setValidationError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Settings updated successfully!');
        setIsEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setValidationError(data?.error || '');
        toast.error(data?.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm(
      "This will permanently delete your account, all your crowns, and your mission history. This action cannot be undone.",
      { title: "Delete Account", danger: true, confirmLabel: "Delete My Account" }
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting your account.");
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
                onChange={e => setFormData({ ...formData, lobby_id: e.target.value })}
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
                onChange={e => setFormData({ ...formData, quest_password: e.target.value })}
                placeholder="4-digit password (e.g. 1234)"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
              />
            </div>
            {validationError && <p className={styles.dangerHint}>{validationError}</p>}
          </div>

          <div className={styles.field}>
            <label>Status Message</label>
            <div className={styles.inputWrapper}>
              <textarea
                value={formData.status_message}
                onChange={e => setFormData({ ...formData, status_message: e.target.value })}
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
                onChange={e => setFormData({ ...formData, receive_dms: e.target.checked })}
              />
              <span>Receive Discord DMs for future contact features</span>
            </label>
          </div>

          <div className={styles.dangerZone}>
            <div className={styles.dangerHeader}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              <span>Danger Zone</span>
            </div>
            <p className={styles.dangerHint}>Permanently remove your data from the Guild Registry.</p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className={styles.deleteBtn}
              disabled={loading}
            >
              Delete Account
            </button>
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

export default function ProfileSettings(props) {
  return (
    <Suspense fallback={null}>
      <SettingsContent {...props} />
    </Suspense>
  );
}
