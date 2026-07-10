"use client";

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useToast, useConfirm } from '@/app/UIProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';

const inputClass = "w-full rounded-lg border border-white/10 bg-void px-3.5 py-2.5 font-body text-sm text-mist placeholder:text-mist-faint focus:border-ember/50 focus:outline-none";

function SettingsContent({ user, isOwner }) {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('settings') === 'true') {
      setIsEditing(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    lobby_id: user.lobby_id || '',
    quest_password: user.quest_password || '',
    status_message: user.status_message || '',
    receive_dms: user.receive_dms !== 0,
  });

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
      const payload = { ...formData };

      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsEditing(false)}>
      <div className="animate-mh-slide-down flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-void-raised shadow-lift" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/icons/MHWilds-Settings_Icon.png" width={22} height={22} alt="" className="pixel-art" />
            <h2 className="font-display text-sm uppercase tracking-widest text-mist">Hunter Settings</h2>
          </div>
          <button onClick={() => setIsEditing(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-mist-dim hover:bg-white/5 hover:text-mist">×</button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Default Session ID</label>
            <input
              type="text"
              className={inputClass}
              value={formData.lobby_id}
              onChange={e => setFormData({ ...formData, lobby_id: e.target.value })}
              placeholder="e.g. 4Y8x h3Wn ZvB2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Quest Password</label>
            <input
              type="text"
              className={inputClass}
              value={formData.quest_password}
              onChange={e => setFormData({ ...formData, quest_password: e.target.value })}
              placeholder="4-digit password (e.g. 1234)"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
            />
            {validationError && <p className="font-body text-xs text-blood-bright">{validationError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Status Message</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              value={formData.status_message}
              onChange={e => setFormData({ ...formData, status_message: e.target.value })}
              placeholder="Share a status note with other hunters..."
              maxLength={100}
            />
          </div>

          <label className="flex items-center gap-2.5 font-body text-sm text-mist">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-void accent-ember"
              checked={formData.receive_dms}
              onChange={e => setFormData({ ...formData, receive_dms: e.target.checked })}
            />
            Receive Discord DMs for future contact features
          </label>

          <div className="mt-2 rounded-xl border border-blood/20 bg-blood/5 p-4">
            <div className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-widest text-blood-bright">
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="" className="pixel-art" />
              Danger Zone
            </div>
            <p className="mb-3 font-body text-xs text-mist-dim">Permanently remove your data from the Guild Registry.</p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="rounded-lg border border-blood/40 px-4 py-2 font-body text-xs font-semibold text-blood-bright transition-colors hover:bg-blood/10 disabled:opacity-50"
            >
              Delete Account
            </button>
          </div>
        </div>

        <footer className="flex gap-3 border-t border-white/5 px-5 py-4">
          <button onClick={() => setIsEditing(false)} className="flex-1 rounded-lg border border-white/10 py-2.5 font-display text-xs uppercase tracking-widest text-mist hover:border-white/20">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 rounded-lg bg-ember py-2.5 font-display text-xs uppercase tracking-widest text-void hover:bg-ember-bright disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </footer>
      </div>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-mist transition-colors hover:border-ember/40 hover:text-ember-bright"
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
