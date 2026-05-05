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

export default function EditLinkedCrownModal({ isOpen, onClose, group, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isBeingHosted, setIsBeingHosted] = useState(false);
  const [monsters, setMonsters] = useState([]);

  const [formData, setFormData] = useState({
    quest: "Optional Quests",
    inv_monster_id: "",
    remaining_uses: 3,
    show_host: false,
    unlink: false,
    perCrown: [],
  });

  useEffect(() => {
    if (isOpen && group?.length > 0) {
      const ref = group[0];
      setFormData({
        quest: ref.quest || "Optional Quests",
        inv_monster_id: ref.inv_monster_id || ref.monster_id,
        remaining_uses: ref.remaining_uses || 3,
        show_host: !!(ref.inv_monster_id && String(ref.inv_monster_id) !== String(ref.monster_id)),
        unlink: false,
        perCrown: group.map(c => ({
          id: c.id,
          type: c.type,
          tempered: !!c.tempered,
          strength_rating: c.strength_rating || 1
        })),
      });
      setSuccess(false);

      fetch(`/api/missions/check?monster_id=${ref.monster_id}`)
        .then(res => res.json())
        .then(data => setIsBeingHosted(data.isHosting))
        .catch(console.error);

      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMonsters(data); })
        .catch(console.error);
    }
  }, [isOpen, group]);

  const isChanged = group && (() => {
    const ref = group[0];
    const origPerCrown = group.map(c => ({ id: c.id, tempered: !!c.tempered, strength_rating: c.strength_rating || 1 }));
    const perCrownChanged = formData.perCrown.some((pc, i) =>
      pc.tempered !== origPerCrown[i]?.tempered ||
      pc.strength_rating !== origPerCrown[i]?.strength_rating
    );

    return perCrownChanged ||
      formData.quest !== (ref.quest || "Optional Quests") ||
      (formData.quest === "Investigation Quests" && formData.remaining_uses !== (ref.remaining_uses || 3)) ||
      String(formData.show_host ? (formData.inv_monster_id || ref.monster_id) : ref.monster_id) !== String(ref.inv_monster_id || ref.monster_id) ||
      formData.unlink;
  })();

  const handleSubmit = async () => {
    if (!isChanged || isBeingHosted) return;
    setLoading(true);

    try {
      const basePayload = {
        monster_id: group[0].monster_id,
        quest: formData.quest,
      };

      if (formData.quest === "Investigation Quests") {
        basePayload.investigation_monster_id = parseInt(formData.show_host ? (formData.inv_monster_id || basePayload.monster_id) : basePayload.monster_id);
        basePayload.remaining_uses = parseInt(formData.remaining_uses);
      } else if (formData.show_host) {
        basePayload.investigation_monster_id = parseInt(formData.inv_monster_id || basePayload.monster_id);
      }

      const requests = formData.perCrown.map(pc =>
        fetch(`/api/crowns/${pc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            type: pc.type,
            tempered: pc.tempered,
            strength_rating: pc.strength_rating,
            ...(formData.unlink ? { pair_id: null } : {})
          }),
        })
      );

      const results = await Promise.all(requests);
      const failed = results.find(r => !r.ok);
      if (failed) {
        const data = await failed.json();
        toast.error(data.error || "Failed to update crown records.");
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

  if (!group || group.length === 0) return null;
  const ref = group[0];

  const monsterOptions = monsters.map(m => ({ label: m.name, value: m.id }));

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.monsterSidebar}>
          <div className={styles.monsterImage}>
            <MonsterIcon imageName={ref.image_name} name={ref.name} tempered={formData.perCrown.some(pc => pc.tempered)} size={64} />
          </div>
          <div className={styles.monsterTitles}>
            <span className={styles.recordId}>Linked Pair · {group.length} Specimen</span>
            <h1 className="gold-text mh-title">{ref.name}</h1>
          </div>
        </aside>

        <main className={styles.editorMain}>
          <header className={styles.editorHeader}>
            <h2>S&L Linked Specimen Update</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
            </button>
          </header>

          <div className={styles.editorContent}>
            <div className={styles.formGrid}>
              <div className={styles.editRow}>
                <label>Crown Classification & Ratings</label>
                <div className={styles.groupTemperedList}>
                  {formData.perCrown.map((pc, i) => (
                    <div key={pc.id} className={styles.groupTemperedRow}>
                      <div className={styles.groupTemperedType}>
                        <Image
                          src={pc.type === 'small' ? '/icons/smallcrown.png' : '/icons/largecrown.png'}
                          width={16} height={16} alt="" className="pixel-art"
                        />
                        <span>{pc.type === 'small' ? 'Small Gold' : 'Large Gold'}</span>
                      </div>
                      <div className={styles.groupCrownControls}>
                        <div className={styles.starGrid}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <div
                              key={num}
                              className={`${styles.starItem} ${pc.strength_rating === num ? styles.starItemActive : ""}`}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                perCrown: prev.perCrown.map((p, j) => j === i ? { ...p, strength_rating: num } : p),
                              }))}
                            >
                              {num}★
                            </div>
                          ))}
                        </div>
                        <Toggle
                          checked={pc.tempered}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            perCrown: prev.perCrown.map((p, j) => j === i ? { ...p, tempered: !p.tempered } : p),
                          }))}
                          labelOn="Tempered"
                          labelOff="Normal"
                        />
                      </div>
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
                      inv_monster_id: e.target.checked ? (prev.inv_monster_id || ref.monster_id) : ref.monster_id,
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
