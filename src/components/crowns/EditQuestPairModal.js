"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./EditCrownModal.module.css";
import MonsterIcon from "../ui/MonsterIcon";
import Image from "next/image";
import CustomSelect from "../ui/CustomSelect";
import { useToast } from "@/app/UIProvider";
import Toggle from "../ui/Toggle";
import InfoTrigger from "../ui/InfoTrigger";

const QUEST_TYPES = [
  { label: "Event Quests", value: "Event Quests" },
  { label: "Optional Quests", value: "Optional Quests" },
  { label: "Field Survey", value: "Field Survey Quests" },
  { label: "Investigation", value: "Investigation Quests" }
];

export default function EditQuestPairModal({ isOpen, onClose, group, onUpdated }) {
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
        show_host: !!ref.investigation_id,
        unlink: false,
        perCrown: group.map(c => ({
          id: c.id,
          type: c.type,
          name: c.name,
          image_name: c.image_name,
          monster_id: c.monster_id,
          tempered: !!c.tempered,
          strength_rating: c.strength_rating || 1
        })),
      });
      setSuccess(false);

      const monsterIds = [...new Set(group.map(c => c.monster_id))];
      Promise.all(monsterIds.map(id => fetch(`/api/missions/check?monster_id=${id}`).then(res => res.json())))
        .then(results => setIsBeingHosted(results.some(r => r.isHosting)))
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
        String(formData.show_host ? (formData.inv_monster_id || ref.monster_id) : "") !== String(ref.investigation_id ? (ref.inv_monster_id || ref.monster_id) : "") ||
      formData.unlink;
  })();

  const handleSubmit = async () => {
    if (!isChanged || isBeingHosted) return;
    setLoading(true);

    try {
      const basePayload = {
        quest: formData.quest,
        mission_host_enabled: formData.show_host,
      };

      if (formData.show_host && formData.quest === "Investigation Quests") {
        basePayload.investigation_monster_id = parseInt(formData.show_host ? (formData.inv_monster_id || group[0].monster_id) : group[0].monster_id);
        basePayload.remaining_uses = parseInt(formData.remaining_uses);
      } else if (formData.show_host) {
        basePayload.investigation_monster_id = parseInt(formData.inv_monster_id || group[0].monster_id);
      }

      const requests = formData.perCrown.map(pc =>
        fetch(`/api/crowns/${pc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            monster_id: pc.monster_id,
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
        toast.error(data.error || "Failed to update quest pair.");
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

  const monsterOptions = monsters.map(m => ({ label: m.name, value: m.id }));

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.monsterSidebar}>
          <div className={styles.pairIcons}>
            {formData.perCrown.map((pc, i) => (
              <div key={pc.id} className={`${styles.pairIconWrapper} ${styles['pairIcon' + i]}`}>
                <MonsterIcon imageName={pc.image_name} name={pc.name} tempered={pc.tempered} size={80} />
              </div>
            ))}
          </div>
          <div className={styles.monsterTitles}>
            <span className={styles.recordId}>Quest Pair · {group.length} Specimen</span>
            <h1 className="gold-text mh-title">Multi-Monster Hunt</h1>
            <p className={styles.pairNames}>{formData.perCrown.map(p => p.name).join(" + ")}</p>
          </div>
        </aside>

        <main className={styles.editorMain}>
          <header className={styles.editorHeader}>
            <h2>Quest Pair Update</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
            </button>
          </header>

          <div className={styles.editorContent}>
            <div className={styles.formGrid}>
              <div className={styles.editRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label>Pair Classification & Ratings</label>
                  <InfoTrigger
                    title="Pair Classification & Ratings"
                    content="Each monster in this multi-monster record keeps its own crown size, tempered state, and strength rating."
                  />
                </div>
                <div className={styles.groupTemperedList}>
                  {formData.perCrown.map((pc, i) => (
                    <div key={pc.id} className={styles.groupTemperedRow}>
                      <div className={styles.groupTemperedType}>
                        <MonsterIcon imageName={pc.image_name} name={pc.name} tempered={pc.tempered} size={32} />
                        <div className={styles.typeInfo}>
                          <span className={styles.typeName}>{pc.name}</span>
                          <span className={styles.typeLabel}>{pc.type === 'small' ? 'Small' : 'Large'} Gold</span>
                        </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label>Quest Linkage</label>
                  <InfoTrigger
                    title="Quest Linkage"
                    content="Keep this on only when both monsters came from the same multi-monster quest. Turn it off if they should become separate records."
                  />
                </div>
                <Toggle
                  checked={!formData.unlink}
                  onChange={() => setFormData(prev => ({ ...prev, unlink: !prev.unlink }))}
                  labelOn="Monsters Linked in Quest"
                  labelOff="Unlink (Separate Quests)"
                />
              </div>

              <div className={styles.editRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label>Common Mission Source</label>
                  <InfoTrigger
                    title="Common Mission Source"
                    content="Choose the quest type shared by both monsters in this record. Investigation records can also store remaining uses."
                  />
                </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <label>Remaining Uses</label>
                      <InfoTrigger
                        title="Remaining Uses"
                        content="Record how many investigation runs were left when this multi-monster record was found."
                      />
                    </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label>Primary Quest Monster</label>
                    <InfoTrigger
                      title="Primary Quest Monster"
                      content="Use this only if the quest's main listed monster was different from both recorded monsters in this multi-monster entry."
                    />
                  </div>
                  <Toggle
                    checked={formData.show_host}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      show_host: e.target.checked,
                      inv_monster_id: e.target.checked ? (prev.inv_monster_id || group[0].monster_id) : group[0].monster_id,
                    }))}
                    labelOn="Different from recorded monsters"
                    labelOff="Same as recorded monsters"
                  />
                  {formData.show_host && (
                    <div className={styles.animateIn} style={{ marginTop: '10px' }}>
                      <CustomSelect
                        options={monsterOptions}
                        value={formData.inv_monster_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, inv_monster_id: val }))}
                        placeholder="Select primary quest monster"
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
