"use client";

import { useState, useEffect } from "react";
import styles from "./AddCrownModal.module.css";
import CustomSelect from "./CustomSelect";
import MonsterIcon from "./MonsterIcon";
import Image from "next/image";
import { useToast } from "@/app/UIProvider";

const QUEST_TYPES = [
  "Event Quests",
  "Optional Quests",
  "Field Survey Quests",
  "Investigation Quests"
];

export default function AddCrownModal({ isOpen, onClose }) {
  const toast = useToast();
  const [monsters, setMonsters] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    monster_id: "",
    types: [{ value: "small", tempered: false }],
    quest: "Optional Quests",
    strength_rating: 1,
    // Investigation fields
    inv_mode: "new",
    inv_monster_id: "",
    remaining_uses: 3,
    investigation_id: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMonsters(data);
            if (data.length > 0 && !formData.monster_id) {
              setFormData(prev => ({ ...prev, monster_id: data[0].id, inv_monster_id: data[0].id }));
            }
          }
        })
        .catch(err => console.error("Error fetching monsters:", err));

      fetch("/api/investigations")
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setInvestigations(data); })
        .catch(err => console.error("Error fetching investigations:", err));

      setSuccess(false);
    }
  }, [isOpen]);

  // Sync inv_monster_id when the crown monster changes (sane default)
  const handleMonsterChange = (val) => {
    setFormData(prev => ({
      ...prev,
      monster_id: val,
      inv_monster_id: prev.inv_monster_id || val,
    }));
  };

  const handleQuestChange = (val) => {
    setFormData(prev => ({ ...prev, quest: val, inv_mode: "new" }));
  };

  const toggleType = (val) => {
    setFormData(prev => {
      const existing = prev.types.find(t => t.value === val);
      if (existing && prev.types.length === 1) return prev;
      return {
        ...prev,
        types: existing
          ? prev.types.filter(t => t.value !== val)
          : [...prev.types, { value: val, tempered: false }],
      };
    });
  };

  const toggleTempered = (typeVal) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.map(t =>
        t.value === typeVal ? { ...t, tempered: !t.tempered } : t
      ),
    }));
  };

  // Investigations matching the selected inv_monster
  const matchingInvestigations = investigations.filter(
    inv => String(inv.monster_id) === String(formData.inv_monster_id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const basePayload = {
        monster_id: parseInt(formData.monster_id),
        quest: formData.quest,
        strength_rating: parseInt(formData.strength_rating),
      };

      if (formData.quest === "Investigation Quests") {
        if (formData.inv_mode === "existing" && formData.investigation_id) {
          basePayload.investigation_id = parseInt(formData.investigation_id);
        } else {
          basePayload.investigation_monster_id = parseInt(formData.inv_monster_id || formData.monster_id);
          basePayload.remaining_uses = parseInt(formData.remaining_uses);
        }
      }

      if (formData.quest === "Field Survey Quests") {
        const hostId = parseInt(formData.inv_monster_id || formData.monster_id);
        if (hostId !== parseInt(formData.monster_id)) {
          basePayload.investigation_monster_id = hostId;
        }
      }

      // Generate a pair_id to link crowns created together
      const pairId = formData.types.length > 1 ? crypto.randomUUID() : undefined;

      // POST one request per selected crown type
      const results = await Promise.all(
        formData.types.map(t =>
          fetch("/api/crowns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...basePayload,
              type: t.value,
              tempered: t.tempered,
              ...(pairId ? { pair_id: pairId } : {}),
            }),
          })
        )
      );

      const failed = results.find(r => !r.ok);
      if (failed) {
        const data = await failed.json();
        toast.error(data.error || "Failed to add crown record.");
      } else {
        setSuccess(true);
        setInvestigations([]);
        setTimeout(() => { onClose(); }, 2000);
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const monsterOptions = monsters.map(m => ({
    label: m.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: m.id
  }));

  const questOptions = QUEST_TYPES.map(q => ({ label: q, value: q }));

  const capitalize = str =>
    str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : str;

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
              tempered={formData.types.some(t => t.tempered)}
              size={100}
            />
            <div className={styles.previewMeta}>
              <h3>{monsters.find(m => m.id === parseInt(formData.monster_id))?.name || "Select Specimen"}</h3>
              <p>{formData.types.some(t => t.tempered) ? "Tempered Specimen" : "Normal Specimen"}</p>
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
                  onChange={handleMonsterChange}
                  placeholder="Select Monster"
                />
              </div>

              <div className={styles.field}>
                <label>Crown</label>
                <div className={styles.crownTypeToggle}>
                  {[{ label: "Small", value: "small", icon: "/icons/smallcrown.png" }, { label: "Large", value: "large", icon: "/icons/largecrown.png" }].map(opt => (
                    <div
                      key={opt.value}
                      className={`${styles.crownTypeChip} ${formData.types.some(t => t.value === opt.value) ? styles.crownTypeChipActive : ""}`}
                      onClick={() => toggleType(opt.value)}
                    >
                      <Image src={opt.icon} width={18} height={18} alt="" className="pixel-art" />
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Quest Type</label>
                <CustomSelect
                  options={questOptions}
                  value={formData.quest}
                  onChange={handleQuestChange}
                />
              </div>

              {/* ── Investigation Section ───────────────────────────── */}
              {formData.quest === "Investigation Quests" && (
                <div className={`${styles.investigationSection} ${styles.animateIn}`}>
                  <div className={styles.field}>
                    <label>Investigation Target</label>
                    <p className={styles.fieldHint}>
                      Which monster&rsquo;s investigation scroll is this?
                      Set to a different monster if the crown comes from another monster&rsquo;s quest.
                    </p>
                    <CustomSelect
                      options={monsterOptions}
                      value={formData.inv_monster_id || formData.monster_id}
                      onChange={(val) =>
                        setFormData(prev => ({ ...prev, inv_monster_id: val, inv_mode: "new", investigation_id: "" }))
                      }
                      placeholder="Select Investigation Monster"
                    />
                  </div>

                  {/* If there are existing investigations for the chosen target, let the user pick */}
                  {matchingInvestigations.length > 0 && (
                    <div className={styles.field}>
                      <label>Link to Investigation</label>
                      <div className={styles.invModeToggle}>
                        <div
                          className={`${styles.invModeBtn} ${formData.inv_mode === "new" ? styles.invModeBtnActive : ""}`}
                          onClick={() => setFormData(prev => ({ ...prev, inv_mode: "new", investigation_id: "" }))}
                        >
                          New Investigation
                        </div>
                        <div
                          className={`${styles.invModeBtn} ${formData.inv_mode === "existing" ? styles.invModeBtnActive : ""}`}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            inv_mode: "existing",
                            investigation_id: matchingInvestigations[0].id,
                          }))}
                        >
                          Use Existing
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.inv_mode === "existing" && matchingInvestigations.length > 0 ? (
                    <div className={`${styles.field} ${styles.animateIn}`}>
                      <label>Select Investigation</label>
                      <div className={styles.invList}>
                        {matchingInvestigations.map(inv => (
                          <div
                            key={inv.id}
                            className={`${styles.invItem} ${String(formData.investigation_id) === String(inv.id) ? styles.invItemActive : ""}`}
                            onClick={() => setFormData(prev => ({ ...prev, investigation_id: inv.id }))}
                          >
                            <MonsterIcon imageName={inv.monster_image} name={inv.monster_name} size={28} />
                            <div className={styles.invItemInfo}>
                              <span className={styles.invItemName}>{capitalize(inv.monster_name)} Investigation</span>
                              <span className={styles.invItemMeta}>
                                {inv.remaining_uses} use{inv.remaining_uses !== 1 ? "s" : ""} left
                                {inv.crown_count > 0 ? ` · ${inv.crown_count} crown${inv.crown_count !== 1 ? "s" : ""} linked` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
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
                </div>
              )}

              {/* ── Field Survey Host Monster ─────────────────────── */}
              {formData.quest === "Field Survey Quests" && (
                <div className={`${styles.investigationSection} ${styles.animateIn}`}>
                  <div className={styles.field}>
                    <label>Quest Host Monster</label>
                    <p className={styles.fieldHint}>
                      Only set this if the crown came from a different monster&rsquo;s field survey.
                    </p>
                    <CustomSelect
                      options={monsterOptions}
                      value={formData.inv_monster_id || formData.monster_id}
                      onChange={(val) =>
                        setFormData(prev => ({ ...prev, inv_monster_id: val }))
                      }
                      placeholder="Select host monster"
                    />
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
                <label>Tempered</label>
                {formData.types.map(t => (
                  <div key={t.value} className={styles.temperedRow}>
                    <div className={styles.temperedRowType}>
                      <Image src={t.value === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={12} height={12} alt="" className="pixel-art" />
                      {t.value === 'small' ? 'Small' : 'Large'}
                    </div>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        className={styles.toggleInput}
                        checked={t.tempered}
                        onChange={() => toggleTempered(t.value)}
                      />
                      <div className={styles.switch}>
                        <div className={styles.switchHandle} />
                      </div>
                      <span className={`${styles.temperedLabel} ${t.tempered ? styles.temperedActive : ""}`}>
                        {t.tempered ? "Tempered" : "Normal"}
                      </span>
                    </label>
                  </div>
                ))}
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
