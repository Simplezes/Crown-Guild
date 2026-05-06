"use client";

import { useState } from "react";
import styles from "./settings.module.css";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useToast, useConfirm } from "@/app/UIProvider";

export default function SettingsForm({ initialData }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [formData, setFormData] = useState(initialData);
  const [status, setStatus] = useState("idle");
  const [validationError, setValidationError] = useState("");

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
    const normalizedPassword = String(formData.quest_password || "").trim();
    if (normalizedPassword !== "" && !/^\d{4}$/.test(normalizedPassword)) {
      setValidationError("Quest Password must be exactly 4 digits (numbers only).");
      setStatus("error");
      return;
    }

    setValidationError("");
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
        const data = await res.json().catch(() => null);
        setValidationError(data?.error || "");
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };
 
  const handleDeleteAccount = async () => {
    const ok = await confirm(
      "This will permanently delete your account, all your crowns, and your mission history. This action cannot be undone.",
      { title: "Delete Account", danger: true, confirmLabel: "Delete My Account" }
    );
    if (!ok) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account. Please try again.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting your account.");
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
          placeholder="4-digit password (leave blank if public)"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
        />
        <span className={styles.hint}>If set, this must be exactly 4 digits.</span>
      </div>

      <div className={styles.sectionTitle} style={{ marginTop: '40px' }}>
        <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={24} height={24} alt="" className="pixel-art" />
        <h2 className="mh-title">Communications</h2>
      </div>

      <div className={styles.field}>
        <div className={styles.toggleRow} onClick={handleToggle}>
          <div className={styles.toggleInfo}>
            <label>Receive Discord Direct Messages</label>
            <span className={styles.hint}>Reserved for future contact features.</span>
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
        {status === "error" && <span className={styles.errorText}>{validationError || "Failed to save settings."}</span>}
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
