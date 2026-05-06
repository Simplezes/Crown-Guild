"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./EditCrownModal.module.css";
import MonsterIcon from "../ui/MonsterIcon";
import Image from "next/image";
import CustomSelect from "../ui/CustomSelect";
import { useToast } from "@/app/UIProvider";
import Toggle from "../ui/Toggle";

const QUEST_TYPES = [
  { label: "Event Quests", value: "Event Quests" },
  { label: "Optional Quests", value: "Optional Quests" },
  { label: "Field Survey", value: "Field Survey Quests" },
  { label: "Investigation", value: "Investigation Quests" }
];

export default function EditSingleCrownModal({ isOpen, onClose, crown, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isBeingHosted, setIsBeingHosted] = useState(false);
  const [monsters, setMonsters] = useState([]);

  const [formData, setFormData] = useState({
    monster_id: "",
    types: ["small"],
    tempered: false,
    quest: "Optional Quests",
    strength_rating: 1,
    inv_monster_id: "",
    remaining_uses: 3,
    show_host: false,
    linkedStrength_rating: 1,
  });

  useEffect(() => {
    if (isOpen && crown) {
      setFormData({
        monster_id: crown.monster_id,
        types: [crown.type],
        tempered: !!crown.tempered,
        quest: crown.quest || "Optional Quests",
        strength_rating: crown.strength_rating || 1,
        inv_monster_id: crown.inv_monster_id || crown.monster_id,
        remaining_uses: crown.remaining_uses || 3,
        show_host: !!crown.investigation_id,
        linkedStrength_rating: 1,
      });
      setSuccess(false);

      fetch(`/api/missions/check?monster_id=${crown.monster_id}`)
        .then(res => res.json())
        .then(data => setIsBeingHosted(data.isHosting))
        .catch(console.error);

      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMonsters(data); })
        .catch(console.error);
    }
  }, [isOpen, crown]);

  const isChanged = crown && (() => {
    return (
      !formData.types.includes(crown.type) ||
      formData.types.length > 1 ||
      formData.tempered !== !!crown.tempered ||
      formData.quest !== (crown.quest || "Optional Quests") ||
      formData.strength_rating !== (crown.strength_rating || 1) ||
      (formData.quest === "Investigation Quests" && formData.remaining_uses !== (crown.remaining_uses || 3)) ||
      String(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : "") !== String(crown.investigation_id ? (crown.inv_monster_id || crown.monster_id) : "")
    );
  })();

  const toggleType = (val) => {
    setFormData(prev => {
      const already = prev.types.includes(val);
      if (already && prev.types.length === 1) return prev;
      return {
        ...prev,
        types: already ? prev.types.filter(t => t !== val) : [...prev.types, val],
      };
    });
  };

  const handleSubmit = async () => {
    if (!isChanged || isBeingHosted) return;
    setLoading(true);

    try {
      const basePayload = {
        monster_id: parseInt(formData.monster_id),
        quest: formData.quest,
        mission_host_enabled: formData.show_host,
      };

      if (formData.show_host && formData.quest === "Investigation Quests") {
        basePayload.investigation_monster_id = parseInt(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id);
        basePayload.remaining_uses = parseInt(formData.remaining_uses);
      } else if (formData.show_host) {
        const hostId = parseInt(formData.inv_monster_id || formData.monster_id);
        basePayload.investigation_monster_id = hostId;
      }

      const patchType = formData.types.includes(crown.type) ? crown.type : formData.types[0];
      const extraTypes = formData.types.filter(t => t !== patchType);
      const pairId = extraTypes.length > 0 ? crypto.randomUUID() : undefined;

      const requests = [
        fetch(`/api/crowns/${crown.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, type: patchType, tempered: formData.tempered, strength_rating: parseInt(formData.strength_rating), ...(pairId ? { pair_id: pairId } : {}) }),
        }),
      ];

      for (const type of extraTypes) {
        requests.push(
          fetch("/api/crowns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, type, tempered: formData.tempered, strength_rating: parseInt(formData.linkedStrength_rating || formData.strength_rating), pair_id: pairId }),
          })
        );
      }

      const results = await Promise.all(requests);
      const failed = results.find(r => !r.ok);
      if (failed) {
        const data = await failed.json();
        toast.error(data.error || "Failed to update crown record.");
      } else {
        setSuccess(true);
        if (onUpdated) onUpdated();
        setTimeout(() => { onClose(); }, 1500);
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!crown) return null;

  const monsterOptions = monsters.map(m => ({
    label: m.name,
    value: m.id,
  }));

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.monsterSidebar}>
          <div className={styles.monsterImage}>
            <MonsterIcon imageName={crown.image_name} name={crown.name} tempered={formData.tempered} size={64} />
          </div>
          <div className={styles.monsterTitles}>
            <span className={styles.recordId}>Entry #{crown.id}</span>
            <h1 className="gold-text mh-title">{crown.name}</h1>
          </div>
        </aside>

        <main className={styles.editorMain}>
          <header className={styles.editorHeader}>
            <h2>Single Specimen Update</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
            </button>
          </header>

          <div className={styles.editorContent}>
            <div className={styles.formGrid}>
              <div className={styles.editRow}>
                <label>Classification</label>
                <div className={styles.typeToggle}>
                  {[
                    { value: 'small', label: 'Small Gold', icon: '/icons/smallcrown.png' },
                    { value: 'large', label: 'Large Gold', icon: '/icons/largecrown.png' },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      className={`${styles.toggleOption} ${formData.types.includes(opt.value) ? styles.toggleOptionActive : ""}`}
                      onClick={() => toggleType(opt.value)}
                    >
                      <Image src={opt.icon} width={20} height={20} alt="" className="pixel-art" />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.editRow}>
                <label>Rating ({formData.strength_rating}★)</label>
                <div className={styles.starGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <div
                      key={num}
                      className={`${styles.starItem} ${formData.strength_rating === num ? styles.starItemActive : ""}`}
                      onClick={() => setFormData({ ...formData, strength_rating: num })}
                    >
                      {num}★
                    </div>
                  ))}
                </div>
                {formData.types.length > 1 && (() => {
                  const linkedType = formData.types.find(t => t !== crown.type);
                  return (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Image src={linkedType === 'small' ? '/icons/smallcrown.png' : '/icons/largecrown.png'} width={14} height={14} alt="" className="pixel-art" />
                        {linkedType === 'small' ? 'Small' : 'Large'} Rating ({formData.linkedStrength_rating}★)
                      </label>
                      <div className={styles.starGrid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <div
                            key={num}
                            className={`${styles.starItem} ${formData.linkedStrength_rating === num ? styles.starItemActive : ""}`}
                            onClick={() => setFormData(prev => ({ ...prev, linkedStrength_rating: num }))}
                          >
                            {num}★
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={styles.editRow}>
                <Toggle
                  checked={formData.tempered}
                  onChange={e => setFormData({ ...formData, tempered: e.target.checked })}
                  labelOn="Tempered Specimen"
                  labelOff="Normal Specimen"
                />
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
                  <div className={styles.investigationBlock}>
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

                <div className={styles.editRow} style={{ marginTop: '12px' }}>
                  <label>Quest Host Monster</label>
                  <Toggle
                    checked={formData.show_host}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      show_host: e.target.checked,
                      inv_monster_id: e.target.checked ? (prev.inv_monster_id || prev.monster_id) : prev.monster_id,
                    }))}
                    labelOn="Different host monster"
                    labelOff="Same as crown monster"
                  />
                  {formData.show_host && (
                    <div className={styles.animateIn} style={{ marginTop: '10px' }}>
                      <CustomSelect
                        options={monsterOptions}
                        value={formData.inv_monster_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, inv_monster_id: val }))}
                        placeholder="Select host monster"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className={styles.editorFooter}>
              <button className={styles.discardBtn} onClick={onClose}>Discard</button>
              <button
                className={styles.commitBtn}
                onClick={handleSubmit}
                disabled={loading || !isChanged || isBeingHosted}
              >
                {isBeingHosted ? "Currently Hosting" : loading ? "Saving..." : "Commit Update"}
              </button>
            </footer>
          </div>
        </main>

        {success && (
          <div className={styles.successOverlay}>
            <div className={styles.successIcon}>
              <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={48} height={48} alt="" className="pixel-art" />
            </div>
            <h3 className="mh-title gold-text">Synchronized</h3>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
