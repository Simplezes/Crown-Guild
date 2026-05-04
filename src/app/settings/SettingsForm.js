"use client";

import { useState } from "react";
import styles from "./settings.module.css";
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function SettingsForm({ initialData }) {
  const [formData, setFormData] = useState(initialData);
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggle = () => {
    setFormData(prev => ({
      ...prev,
      receive_dms: prev.receive_dms === 1 ? 0 : 1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };
 
  const handleDeleteAccount = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete your account, all your crowns, and your mission history. This action cannot be undone. Are you sure?")) {
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        alert("Failed to delete account. Please try again.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting your account.");
      setStatus("idle");
    }
  };

  return (
    <form className={`${styles.formCard} mh-card`} onSubmit={handleSubmit}>
      <div className={styles.sectionTitle}>
        <Image src="/icons/MHWilds-Lobby_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        <h2 className="mh-title">Lobby Configuration</h2>
      </div>

      <div className={styles.field}>
        <label>Lobby ID (Session ID)</label>
        <input
          type="text"
          name="lobby_id"
          value={formData.lobby_id || ''}
          onChange={handleChange}
          className={styles.input}
          placeholder="e.g. 7fKx-abc..."
        />
        <span className={styles.hint}>Hunters will use this to join your session.</span>
      </div>

      <div className={styles.field}>
        <label>Quest Password</label>
        <input
          type="text"
          name="quest_password"
          value={formData.quest_password || ''}
          onChange={handleChange}
          className={styles.input}
          placeholder="Leave blank if public"
        />
        <span className={styles.hint}>If your quest has a passcode, provide it here.</span>
      </div>

      <div className={styles.sectionTitle} style={{ marginTop: '40px' }}>
        <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        <h2 className="mh-title">Communications</h2>
      </div>

      <div className={styles.field}>
        <div className={styles.toggleRow} onClick={handleToggle}>
          <div className={styles.toggleInfo}>
            <label>Receive SOS Direct Messages</label>
            <span className={styles.hint}>Allow the bot to DM you.</span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              type="checkbox"
              name="receive_dms"
              checked={formData.receive_dms === 1}
              onChange={() => { }}
              className={styles.toggleInput}
            />
            <div className={styles.switch}>
              <div className={styles.switchHandle}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={status === "loading"} className="mh-button">
          {status === "loading" ? "Saving..." : status === "success" ? "Saved!" : "Save Settings"}
        </button>
        {status === "error" && <span className={styles.errorText}>Failed to save settings.</span>}
      </div>

      <div className={styles.dangerZone}>
        <div className={styles.sectionTitle}>
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="" className="pixel-art" />
          <h2 className="mh-title" style={{ color: 'var(--mh-red)' }}>Danger Zone</h2>
        </div>
        <p className={styles.hint}>Permanently remove your data from the Guild Registry.</p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className={styles.deleteBtn}
          disabled={status === "loading"}
        >
          Delete Account
        </button>
      </div>
    </form>
  );
}
