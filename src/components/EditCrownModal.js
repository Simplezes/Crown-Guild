"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./EditCrownModal.module.css";
import MonsterIcon from "./MonsterIcon";
import Image from "next/image";

const QUEST_TYPES = [
  { label: "Event Quests", value: "Event Quests" },
  { label: "Optional Quests", value: "Optional Quests" },
  { label: "Field Survey", value: "Field Survey Quests" },
  { label: "Investigation", value: "Investigation Quests" }
];

export default function EditCrownModal({ isOpen, onClose, crown, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isBeingHosted, setIsBeingHosted] = useState(false);

  const [formData, setFormData] = useState({
    monster_id: "",
    type: "small",
    tempered: false,
    quest: "Optional Quests",
    strength_rating: 1,
    remaining_uses: 3
  });

  useEffect(() => {
    if (isOpen && crown) {
      setFormData({
        monster_id: crown.monster_id,
        type: crown.type,
        tempered: !!crown.tempered,
        quest: crown.quest || "Optional Quests",
        strength_rating: crown.strength_rating || 1,
        remaining_uses: crown.remaining_uses || 3
      });
      setSuccess(false);

      fetch(`/api/missions/check?monster_id=${crown.monster_id}`)
        .then(res => res.json())
        .then(data => setIsBeingHosted(data.isHosting))
        .catch(console.error);
    }
  }, [isOpen, crown]);

  const isChanged = crown && (
    formData.type !== crown.type ||
    formData.tempered !== !!crown.tempered ||
    formData.quest !== (crown.quest || "Optional Quests") ||
    formData.strength_rating !== (crown.strength_rating || 1) ||
    formData.remaining_uses !== (crown.remaining_uses || 3)
  );

  const handleSubmit = async () => {
    if (!isChanged || isBeingHosted) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/crowns/${crown.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          monster_id: parseInt(formData.monster_id),
          strength_rating: parseInt(formData.strength_rating),
          remaining_uses: formData.quest === "Investigation Quests" ? parseInt(formData.remaining_uses) : null
        })
      });

      if (res.ok) {
        setSuccess(true);
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update crown record.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!crown) return null;

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.monsterSidebar}>
          <div className={styles.monsterImage}>
            <MonsterIcon
              imageName={crown.image_name}
              name={crown.name}
              tempered={formData.tempered}
              size={64}
            />
          </div>
          <div className={styles.monsterTitles}>
            <span className={styles.recordId}>Entry #{crown.id}</span>
            <h1 className="gold-text mh-title">{crown.name}</h1>
          </div>
        </aside>

        <main className={styles.editorMain}>
          <header className={styles.editorHeader}>
            <h2>Specimen Update</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
            </button>
          </header>

          <div className={styles.editorContent}>
            <div className={styles.formGrid}>
              <div className={styles.editRow}>
                <label>Classification</label>
                <div className={styles.typeToggle}>
                  <div
                    className={`${styles.toggleOption} ${formData.type === 'small' ? styles.toggleOptionActive : ""}`}
                    onClick={() => setFormData({ ...formData, type: 'small' })}
                  >
                    <Image src="/icons/smallcrown.png" width={20} height={20} alt="" className="pixel-art" />
                    <span>Small Gold</span>
                  </div>
                  <div
                    className={`${styles.toggleOption} ${formData.type === 'large' ? styles.toggleOptionActive : ""}`}
                    onClick={() => setFormData({ ...formData, type: 'large' })}
                  >
                    <Image src="/icons/largecrown.png" width={20} height={20} alt="" className="pixel-art" />
                    <span>Large Gold</span>
                  </div>
                </div>
              </div>

              <div className={styles.editRow}>
                <label>
                  Rating ({formData.strength_rating}
                  <Image src="/icons/MHWilds-Notes_1_Star_Icon.png" width={10} height={10} alt="★" className="pixel-art" style={{ display: 'inline', margin: '0 2px' }} />
                  )
                </label>
                <div className={styles.starGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <div
                      key={num}
                      className={`${styles.starItem} ${formData.strength_rating === num ? styles.starItemActive : ""}`}
                      onClick={() => setFormData({ ...formData, strength_rating: num })}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.editRow}>
                <label>Mission Source</label>
                <div className={styles.questSelect}>
                  {QUEST_TYPES.map(q => (
                    <div
                      key={q.value}
                      className={`${styles.questBtn} ${formData.quest === q.value ? styles.questBtnActive : ""}`}
                      onClick={() => setFormData({ ...formData, quest: q.value })}
                    >
                      {q.label}
                    </div>
                  ))}
                </div>
                {formData.quest === "Investigation Quests" && (
                  <div className={`${styles.editRow} ${styles.animateIn}`}>
                    <label>Remaining Uses</label>
                    <div className={styles.permitChips}>
                      {[1, 2, 3].map(num => (
                        <div
                          key={num}
                          className={`${styles.permitChip} ${formData.remaining_uses === num ? styles.permitChipActive : ""}`}
                          onClick={() => setFormData({ ...formData, remaining_uses: num })}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.editRow}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={formData.tempered}
                      onChange={e => setFormData({ ...formData, tempered: e.target.checked })}
                    />
                    <div className={styles.switch}>
                      <div className={styles.switchHandle} />
                    </div>
                    <span className={`${styles.temperedLabel} ${formData.tempered ? styles.temperedActive : ""}`}>
                      {formData.tempered ? "Tempered Specimen" : "Normal Specimen"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <footer className={styles.editorFooter} style={{ marginTop: "1rem" }}>
              <button className={styles.discardBtn} onClick={onClose}>Discard</button>
              <button
                className={styles.commitBtn}
                onClick={handleSubmit}
                disabled={loading || !isChanged || isBeingHosted}
                style={{
                  opacity: (loading || !isChanged || isBeingHosted) ? 0.5 : 1,
                  cursor: (loading || !isChanged || isBeingHosted) ? "not-allowed" : "pointer"
                }}
              >
                {isBeingHosted ? "Currently Hosting" : loading ? "Saving..." : "Commit Update"}
              </button>
            </footer>
          </div>
          {isBeingHosted && (
            <div className={styles.warningBanner}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={16} height={16} alt="Warning" className="pixel-art" />
              <span>This specimen is currently being hosted in an active mission and cannot be modified.</span>
            </div>
          )}
        </main>

        {success && (
          <div className={styles.successOverlay}>
            <div className={styles.successIcon}>
              <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={48} height={48} alt="" className="pixel-art" />
            </div>
            <h3 className="mh-title gold-text" style={{ margin: 0 }}>Synchronized</h3>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
