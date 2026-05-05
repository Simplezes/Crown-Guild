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

export default function EditCrownModal({ isOpen, onClose, crown, group, onUpdated }) {
  const crowns = group || (crown ? [crown] : []);
  const isGroup = crowns.length > 1;
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
    unlink: false,
    linkedStrength_rating: 1,
    perCrown: [],
  });

  useEffect(() => {
    if (isOpen && crowns.length > 0) {
      const ref = crowns[0];
      setFormData({
        monster_id: ref.monster_id,
        types: isGroup ? [] : [ref.type],
        tempered: isGroup ? false : !!ref.tempered,
        quest: ref.quest || "Optional Quests",
        strength_rating: ref.strength_rating || 1,
        inv_monster_id: ref.inv_monster_id || ref.monster_id,
        remaining_uses: ref.remaining_uses || 3,
        show_host: !!(ref.inv_monster_id && String(ref.inv_monster_id) !== String(ref.monster_id)),
        unlink: false,
        linkedStrength_rating: 1,
        perCrown: isGroup
          ? crowns.map(c => ({ id: c.id, type: c.type, tempered: !!c.tempered, strength_rating: c.strength_rating || 1 }))
          : [],
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
  }, [isOpen, crown, group]);

  const effectiveHostId = formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id;

  const isChanged = crowns.length > 0 && (() => {
    const ref = crowns[0];
    if (isGroup) {
      const origPerCrown = crowns.map(c => ({ id: c.id, tempered: !!c.tempered, strength_rating: c.strength_rating || 1 }));
      const perCrownChanged = formData.perCrown.some((pc, i) => pc.tempered !== origPerCrown[i]?.tempered || pc.strength_rating !== origPerCrown[i]?.strength_rating);
      return perCrownChanged ||
        formData.quest !== (ref.quest || "Optional Quests") ||
        (formData.quest === "Investigation Quests" && formData.remaining_uses !== (ref.remaining_uses || 3)) ||
        String(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id) !== String(ref.inv_monster_id || ref.monster_id) ||
        formData.unlink;
    }
    return (
      !formData.types.includes(ref.type) ||
      formData.types.length > 1 ||
      formData.tempered !== !!ref.tempered ||
      formData.quest !== (ref.quest || "Optional Quests") ||
      formData.strength_rating !== (ref.strength_rating || 1) ||
      (formData.quest === "Investigation Quests" && formData.remaining_uses !== (ref.remaining_uses || 3)) ||
      String(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id) !== String(ref.inv_monster_id || ref.monster_id) ||
      formData.unlink
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
      };

      if (formData.quest === "Investigation Quests") {
        basePayload.investigation_monster_id = parseInt(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id);
        basePayload.remaining_uses = parseInt(formData.remaining_uses);
      } else if (formData.show_host) {
        const hostId = parseInt(formData.inv_monster_id || formData.monster_id);
        if (hostId !== parseInt(formData.monster_id)) {
          basePayload.investigation_monster_id = hostId;
        }
      }

      let requests;

      if (isGroup) {
        requests = formData.perCrown.map(pc =>
          fetch(`/api/crowns/${pc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, type: pc.type, tempered: pc.tempered, strength_rating: pc.strength_rating, ...(formData.unlink ? { pair_id: null } : {}) }),
          })
        );
      } else {
        const ref = crowns[0];
        const patchType = formData.types.includes(ref.type) ? ref.type : formData.types[0];
        const extraTypes = formData.types.filter(t => t !== patchType);
        const pairId = extraTypes.length > 0 ? crypto.randomUUID() : undefined;
        const pairIdOverride = formData.unlink ? { pair_id: null } : (pairId ? { pair_id: pairId } : {});
        requests = [
          fetch(`/api/crowns/${ref.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, type: patchType, tempered: formData.tempered, strength_rating: parseInt(formData.strength_rating), ...pairIdOverride }),
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

  if (crowns.length === 0) return null;
  const ref = crowns[0];

  const monsterOptions = monsters.map(m => ({
    label: m.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: m.id,
  }));

  const capitalize = str =>
    str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : str;

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.monsterSidebar}>
          <div className={styles.monsterImage}>
            <MonsterIcon
              imageName={ref.image_name}
              name={ref.name}
              tempered={isGroup ? formData.perCrown.some(pc => pc.tempered) : formData.tempered}
              size={64}
            />
          </div>
          <div className={styles.monsterTitles}>
            <span className={styles.recordId}>{isGroup ? `Pair · ${crowns.length} crowns` : `Entry #${ref.id}`}</span>
            <h1 className="gold-text mh-title">{ref.name}</h1>
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
                {isGroup ? (
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
                                  perCrown: prev.perCrown.map((p, j) =>
                                    j === i ? { ...p, strength_rating: num } : p
                                  ),
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
                                perCrown: prev.perCrown.map((p, j) =>
                                  j === i ? { ...p, tempered: !p.tempered } : p
                                ),
                              }))}
                              labelOn="Tempered"
                              labelOff="Normal"
                            />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
              </div>

              <div className={styles.editRow}>
                <label>S&amp;L Pair</label>
                <Toggle
                  checked={isGroup ? !formData.unlink : formData.types.length > 1}
                  onChange={() => {
                    if (isGroup || !!ref.pair_id) {
                      setFormData(prev => ({ ...prev, unlink: !prev.unlink }));
                    } else {
                      const oppositeType = ref.type === 'small' ? 'large' : 'small';
                      toggleType(oppositeType);
                    }
                  }}
                  labelOn="Linked"
                  labelOff="Unlinked"
                />
              </div>

              {!isGroup && (
                <div className={styles.editRow}>
                  <label>
                    Rating ({formData.strength_rating}★)
                  </label>
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
                    const linkedType = formData.types.find(t => t !== ref.type);
                    return linkedType ? (
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
                    ) : null;
                  })()}
                </div>
              )}

              {!isGroup && (
                <div className={styles.editRow}>
                  <Toggle
                    checked={formData.tempered}
                    onChange={e => setFormData({ ...formData, tempered: e.target.checked })}
                    labelOn="Tempered Specimen"
                    labelOff="Normal Specimen"
                  />
                </div>
              )}

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
                  <div className={`${styles.investigationBlock} ${styles.animateIn}`}>
                    <div className={`${styles.editRow} ${styles.animateIn}`} style={{ marginTop: '8px' }}>
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
                  {formData.show_host && monsters.length > 0 && (
                    <div className={styles.animateIn} style={{ marginTop: '10px' }}>
                      <CustomSelect
                        options={monsterOptions}
                        value={formData.inv_monster_id || formData.monster_id}
                        onChange={(val) =>
                          setFormData(prev => ({ ...prev, inv_monster_id: val }))
                        }
                        placeholder="Select host monster"
                      />
                    </div>
                  )}
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
