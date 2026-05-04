"use client";

import { useState, useEffect } from "react";
import styles from "./AddCrownModal.module.css";
import CustomSelect from "./CustomSelect";
import MonsterIcon from "./MonsterIcon";
import Image from "next/image";
import { useNotifications } from "@/app/NotificationProvider";

const QUEST_TYPES = [
  "Event Quests",
  "Optional Quests",
  "Field Survey Quests",
  "Investigation Quests"
];

const CROWN_OPTIONS = [
  { label: "Small", value: "small" },
  { label: "Large", value: "large" }
];

export default function AddCrownModal({ isOpen, onClose }) {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    monster_id: "",
    type: "small",
    tempered: false,
    quest: "Optional Quests",
    strength_rating: 1,
    remaining_uses: 3
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMonsters(data);
            if (data.length > 0 && !formData.monster_id) {
              setFormData(prev => ({ ...prev, monster_id: data[0].id }));
            }
          }
        })
        .catch(err => console.error("Error fetching monsters:", err));

      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/crowns", {
        method: "POST",
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
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add crown record.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const monsterOptions = monsters.map(m => ({
    label: m.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: m.id
  }));

  const questOptions = QUEST_TYPES.map(q => ({ label: q, value: q }));

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={onClose} />
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerContent}>
          <div className={styles.header}>
            <h2 className="mh-title">Add Crown</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
            </button>
          </div>

          <div className={styles.monsterPreview}>
            <MonsterIcon
              imageName={monsters.find(m => m.id === parseInt(formData.monster_id))?.image_name}
              name={monsters.find(m => m.id === parseInt(formData.monster_id))?.name}
              tempered={formData.tempered}
              size={100}
            />
            <div className={styles.previewMeta}>
              <h3>{monsters.find(m => m.id === parseInt(formData.monster_id))?.name || "Select Specimen"}</h3>
              <p>{formData.tempered ? "Tempered Specimen" : "Normal Specimen"}</p>
            </div>
          </div>

          {success ? (
            <div className={styles.successMessage}>
              <h2 className="mh-title">Crown Added</h2>
              <p>The registry has been updated.</p>
              <div className={styles.successIcon + " pixel-art"}>
                <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={48} height={48} alt="" />
              </div>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Monster</label>
                <CustomSelect
                  options={monsterOptions}
                  value={formData.monster_id}
                  onChange={(val) => setFormData({ ...formData, monster_id: val })}
                  placeholder="Select Monster"
                />
              </div>

              <div className={styles.field}>
                <label>Crown</label>
                <CustomSelect
                  options={CROWN_OPTIONS}
                  value={formData.type}
                  onChange={(val) => setFormData({ ...formData, type: val })}
                />
              </div>

              <div className={styles.field}>
                <label>Quest Type</label>
                <CustomSelect
                  options={questOptions}
                  value={formData.quest}
                  onChange={(val) => setFormData({ ...formData, quest: val })}
                />
              </div>

              {formData.quest === "Investigation Quests" && (
                <div className={`${styles.field} ${styles.animateIn}`}>
                  <label>Uses</label>
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

              <div className={styles.field}>
                <label>Strength</label>
                <div className={styles.pickerGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <div
                      key={num}
                      className={`${styles.pickerItem} ${formData.strength_rating === num ? styles.pickerItemActive : ""}`}
                      onClick={() => setFormData({ ...formData, strength_rating: num })}
                    >
                      {num}
                      <Image src="/icons/MHWilds-Notes_1_Star_Icon.png" width={20} height={20} alt="★" className="pixel-art" style={{ display: 'inline', margin: '0 2px' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
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
                    {formData.tempered ? "Tempered" : "Normal"}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add to Ledger"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
