"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./UnifiedQuestModal.module.css";
import MonsterIcon from "../ui/MonsterIcon";
import Image from "next/image";
import CustomSelect from "../ui/CustomSelect";
import { useToast } from "@/app/UIProvider";
import Toggle from "../ui/Toggle";

const QUEST_TYPES = [
  { label: "Event Quest", value: "Event Quests" },
  { label: "Optional Quest", value: "Optional Quests" },
  { label: "Field Survey", value: "Field Survey Quests" },
  { label: "Investigation", value: "Investigation Quests" }
];

const DEFAULT_ENTRY = {
  monster_id: "",
  type: "small",
  tempered: false,
  strength_rating: 1
};

export default function UnifiedQuestModal({ isOpen, onClose, initialGroup, onUpdated }) {
  const toast = useToast();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isBeingHosted, setIsBeingHosted] = useState(false);

  const [questData, setQuestData] = useState({
    quest: "Optional Quests",
    show_host: false,
    inv_monster_id: "",
    remaining_uses: 3,
  });

  const [entries, setEntries] = useState([{ ...DEFAULT_ENTRY }]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMonsters(data);
            if (data.length > 0 && !initialGroup) {
              setEntries(prev => prev.map((e, i) => i === 0 && !e.monster_id ? { ...e, monster_id: data[0].id } : e));
            }
          }
        })
        .catch(console.error);

      if (initialGroup && initialGroup.length > 0) {
        const ref = initialGroup[0];
        setQuestData({
          quest: ref.quest || "Optional Quests",
          show_host: !!ref.investigation_id,
          inv_monster_id: ref.inv_monster_id || ref.monster_id,
          remaining_uses: ref.remaining_uses || 3,
        });
        setEntries(initialGroup.map(c => ({
          id: c.id,
          monster_id: c.monster_id,
          type: c.type,
          tempered: !!c.tempered,
          strength_rating: c.strength_rating || 1,
          image_name: c.image_name,
          name: c.name
        })));

        const monsterIds = [...new Set(initialGroup.map(c => c.monster_id))];
        Promise.all(monsterIds.map(id => fetch(`/api/missions/check?monster_id=${id}`).then(res => res.json())))
          .then(results => setIsBeingHosted(results.some(r => r.isHosting)))
          .catch(console.error);
      } else {
        setQuestData({
          quest: "Optional Quests",
          show_host: false,
          inv_monster_id: "",
          remaining_uses: 3,
        });
        setEntries([{ ...DEFAULT_ENTRY }]);
        setIsBeingHosted(false);
      }
      setSuccess(false);
    }
  }, [isOpen, initialGroup]);

  const addEntry = () => {
    if (entries.length >= 4) return;
    setEntries([...entries, { ...DEFAULT_ENTRY, monster_id: monsters[0]?.id || "" }]);
  };

  const removeEntry = (index) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index, field, value) => {
    setEntries(entries.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    if (loading || isBeingHosted) return;
    setLoading(true);

    try {
      const pairId = entries.length > 1 ? (initialGroup?.[0]?.pair_id || crypto.randomUUID()) : (initialGroup?.[0]?.pair_id || null);

      const basePayload = {
        quest: questData.quest,
        investigation_monster_id: questData.show_host ? parseInt(questData.inv_monster_id) : null,
        remaining_uses: questData.quest === "Investigation Quests" ? parseInt(questData.remaining_uses) : null,
        pair_id: pairId
      };

      const requests = entries.map(entry => {
        const payload = {
          ...basePayload,
          monster_id: parseInt(entry.monster_id),
          type: entry.type,
          tempered: entry.tempered,
          strength_rating: parseInt(entry.strength_rating)
        };

        if (entry.id) {
          return fetch(`/api/crowns/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          return fetch("/api/crowns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      });

      if (initialGroup) {
        const currentIds = new Set(entries.map(e => e.id).filter(Boolean));
        const removedIds = initialGroup.filter(c => !currentIds.has(c.id)).map(c => c.id);
        removedIds.forEach(id => requests.push(fetch(`/api/crowns/${id}`, { method: "DELETE" })));
      }

      const results = await Promise.all(requests);
      const failed = results.find(r => !r.ok);

      if (failed) {
        const data = await failed.json();
        toast.error(data.error || "Failed to save quest report.");
      } else {
        setSuccess(true);
        if (onUpdated) onUpdated();
        setTimeout(() => { onClose(); }, 1500);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const monsterOptions = monsters.map(m => ({ label: m.name, value: m.id }));
  const questOptions = QUEST_TYPES.map(q => ({ label: q.label, value: q.value }));

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h2 className="mh-title">{initialGroup ? "Edit Hunt Record" : "New Hunt Record"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
          </button>
        </header>

        <div className={styles.modalBody}>
          <section className={styles.dashboardBar}>
            <div className={styles.dashSection}>
              <div className={styles.dashLabel}>
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                <span>Quest Category</span>
              </div>
              <div className={styles.dashContent}>
                <CustomSelect
                  options={questOptions}
                  value={questData.quest}
                  onChange={val => setQuestData({ ...questData, quest: val })}
                />
              </div>
            </div>

            <div className={`${styles.dashSection} ${styles.hostSection}`}>
              <div className={styles.dashLabel}>
                <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                <span>Mission Host</span>
              </div>
              <div className={styles.dashContent}>
                <Toggle
                  checked={questData.show_host}
                  onChange={e => setQuestData({ ...questData, show_host: e.target.checked })}
                  labelOn="Different"
                  labelOff="Default"
                />
                {questData.show_host && (
                  <CustomSelect
                    options={monsterOptions}
                    value={questData.inv_monster_id}
                    onChange={val => setQuestData({ ...questData, inv_monster_id: val })}
                    placeholder="Host..."
                  />
                )}
              </div>
            </div>

            {questData.quest === "Investigation Quests" && (
              <div className={`${styles.dashSection} ${styles.usesSection}`}>
                <div className={styles.dashLabel}>
                  <Image src="/icons/MHWilds-Investigation_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                  <span>Investigation Uses</span>
                </div>
                <div className={styles.dashContent}>
                  <div className={styles.usesRow}>
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        className={`${styles.useBtn} ${questData.remaining_uses === num ? styles.useBtnActive : ""}`}
                        onClick={() => setQuestData({ ...questData, remaining_uses: num })}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className={styles.entriesGrid}>
            {entries.map((entry, index) => {
              const monster = monsters.find(m => m.id === parseInt(entry.monster_id));
              return (
                <div key={index} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryNumber}>Specimen Report #{index + 1}</span>
                    {entries.length > 1 && (
                      <button className={styles.removeBtn} onClick={() => removeEntry(index)}>
                        <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Remove" className="pixel-art" />
                      </button>
                    )}
                  </div>

                  <div className={styles.entryContent}>
                    <div className={styles.monsterRow}>
                      <MonsterIcon
                        imageName={monster?.image_name || entry.image_name}
                        name={monster?.name || entry.name}
                        tempered={entry.tempered}
                        size={56}
                      />
                      <div className={styles.monsterSelect}>
                        <CustomSelect
                          options={monsterOptions}
                          value={entry.monster_id}
                          onChange={val => updateEntry(index, 'monster_id', val)}
                          placeholder="Select Target..."
                        />
                      </div>
                    </div>

                    <div className={styles.entryDetails}>
                      <div className={styles.crownOptions}>
                        <button
                          className={`${styles.crownBtn} ${entry.type === 'small' ? styles.crownBtnActive_small : ""}`}
                          onClick={() => updateEntry(index, 'type', 'small')}
                        >
                          <Image src="/icons/smallcrown.png" width={18} height={18} alt="" className="pixel-art" />
                          Small Crown
                        </button>
                        <button
                          className={`${styles.crownBtn} ${entry.type === 'large' ? styles.crownBtnActive_large : ""}`}
                          onClick={() => updateEntry(index, 'type', 'large')}
                        >
                          <Image src="/icons/largecrown.png" width={18} height={18} alt="" className="pixel-art" />
                          Large Crown
                        </button>
                      </div>

                      <div className={styles.strengthSection}>
                        <div className={styles.strengthLabel}>
                          <label>Strength Rating ({entry.strength_rating}★)</label>
                          <Toggle
                            checked={entry.tempered}
                            onChange={e => updateEntry(index, 'tempered', e.target.checked)}
                            labelOn="Tempered"
                            labelOff="Normal"
                          />
                        </div>
                        <div className={styles.starGrid}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button
                              key={num}
                              className={`${styles.starBtn} ${entry.strength_rating === num ? styles.starBtnActive : ""}`}
                              onClick={() => updateEntry(index, 'strength_rating', num)}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {entries.length < 4 && (
              <div className={styles.addMonsterArea}>
                <button className={styles.addBtnCircle} onClick={addEntry}>
                  <Image src="/icons/MHWilds-Link_Party_Icon.png" width={24} height={24} alt="Add" className="pixel-art" />
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <div className={styles.footerStatus}>
            {isBeingHosted && (
              <div style={{ color: '#ffaa00', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                Currently Hosting
              </div>
            )}
          </div>
          <div className={styles.footerActions}>
            <button className={styles.discardBtn} onClick={onClose}>Discard Changes</button>
            <button
              className={styles.commitBtn}
              onClick={handleSubmit}
              disabled={loading || isBeingHosted}
            >
              {loading ? "Synchronizing..." : "Commit Report"}
            </button>
          </div>
        </footer>

        {success && (
          <div className={styles.successOverlay}>
            <div className={styles.successContent}>
              <Image src="/icons/MHWilds-Completed_Objective_Icon.png" width={80} height={80} alt="" className="pixel-art" />
              <h3 className="mh-title gold-text">Synchronized</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
