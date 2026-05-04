'use client';

import { useState } from 'react';
import styles from './StatusEditor.module.css';
import Image from 'next/image';

export default function StatusEditor({ initialStatus, isOwner }) {
  const [status, setStatus] = useState(initialStatus || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_message: status }),
      });

      if (res.ok) {
        setIsEditing(false);
      } else {
        alert('Failed to save status');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    if (!status) return null;
    return (
      <div className={styles.statusDisplay}>
        <div className={styles.quoteIcon}>
          <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        </div>
        <p className={styles.text}>{status.length > 60 ? `${status.substring(0, 60)}...` : status}</p>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      {isEditing ? (
        <div className={styles.editMode}>
          <textarea
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Share a status or lobby note..."
            maxLength={30}
            className={styles.textarea}
          />
          <div className={styles.actions}>
            <button onClick={handleSave} disabled={loading} className={styles.saveBtn}>
              {loading ? 'Saving...' : 'Update Note'}
            </button>
            <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
            <span className={styles.charCount}>
              {status.length}/30
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.displayMode} onClick={() => setIsEditing(true)}>
          <div className={styles.quoteIcon}>
            <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={16} height={16} alt="" className="pixel-art" />
          </div>
          <p className={status ? styles.text : styles.placeholder}>
            {status ? (status.length > 60 ? `${status.substring(0, 60)}...` : status) : 'Click to add a hunter note (e.g. "Online at 5pm", "AFK 5m")'}
          </p>
          <span className={styles.editHint}>Edit</span>
        </div>
      )}
    </div>
  );
}
