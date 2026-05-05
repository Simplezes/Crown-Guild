"use client";

import { useState, useEffect } from "react";
import styles from "./AddCrownModal.module.css";
import CustomSelect from "../ui/CustomSelect";
import MonsterIcon from "../ui/MonsterIcon";
import Image from "next/image";
import { useToast } from "@/app/UIProvider";
import Toggle from "../ui/Toggle";

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
    types: [{ value: "small", tempered: false, strength_rating: 1 }],
    quest: "Optional Quests",
    inv_mode: "new",
    inv_monster_id: "",
    remaining_uses: 3,
    investigation_id: "",
    show_host: false,
    show_multi_monster: false,
    monster2_id: "",
    monster2_types: [{ value: "small", tempered: false, strength_rating: 1 }],
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
          : [...prev.types, { value: val, tempered: false, strength_rating: 1 }],
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

  const toggleType2 = (val) => {
    setFormData(prev => {
      const existing = prev.monster2_types.find(t => t.value === val);
      if (existing && prev.monster2_types.length === 1) return prev;
      return {
        ...prev,
        monster2_types: existing
          ? prev.monster2_types.filter(t => t.value !== val)
          : [...prev.monster2_types, { value: val, tempered: false, strength_rating: 1 }],
      };
    });
  };

  const toggleTempered2 = (typeVal) => {
    setFormData(prev => ({
      ...prev,
      monster2_types: prev.monster2_types.map(t =>
        t.value === typeVal ? { ...t, tempered: !t.tempered } : t
      ),
    }));
  };

  const effectiveHostId = formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id;
  const matchingInvestigations = investigations.filter(
    inv => String(inv.monster_id) === String(effectiveHostId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const basePayload = {
        monster_id: parseInt(formData.monster_id),
        quest: formData.quest,
      };

      if (formData.quest === "Investigation Quests") {
        if (formData.inv_mode === "existing" && formData.investigation_id) {
          basePayload.investigation_id = parseInt(formData.investigation_id);
        } else {
          basePayload.investigation_monster_id = parseInt(formData.show_host ? (formData.inv_monster_id || formData.monster_id) : formData.monster_id);
          basePayload.remaining_uses = parseInt(formData.remaining_uses);
        }
      } else if (formData.show_host) {
        const hostId = parseInt(formData.inv_monster_id || formData.monster_id);
        if (hostId !== parseInt(formData.monster_id)) {
          basePayload.investigation_monster_id = hostId;
        }
      }

      const hasPair = formData.types.length > 1 || formData.show_multi_monster;
      const pairId = hasPair ? crypto.randomUUID() : undefined;

      const monster1Requests = formData.types.map(t =>
        fetch("/api/crowns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...basePayload,
            type: t.value,
            tempered: t.tempered,
            strength_rating: t.strength_rating,
            ...(pairId ? { pair_id: pairId } : {}),
          }),
        })
      );

      const monster2Requests = formData.show_multi_monster && formData.monster2_id
        ? formData.monster2_types.map(t =>
            fetch("/api/crowns", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                monster_id: parseInt(formData.monster2_id),
                quest: formData.quest,
                type: t.value,
                tempered: t.tempered,
                strength_rating: t.strength_rating,
                pair_id: pairId,
              }),
            })
          )
        : [];

      const results = await Promise.all([...monster1Requests, ...monster2Requests]);

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
              size={56}
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
                <div className={styles.crownLabelRow}>
                  <label>Crown</label>
                  {!formData.show_multi_monster && (
                    <span className={styles.crownHint}>Select both sizes to add multi-crown.</span>
                  )}
                </div>
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

              {formData.types.map(t => (
                <div key={t.value} className={styles.field}>
                  <div className={styles.typeHeader}>
                    <label>
                      <Image src={t.value === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={13} height={13} alt="" className="pixel-art" style={{ marginRight: 5 }} />
                      {t.value === 'small' ? 'Small' : 'Large'} Crown
                    </label>
                    <Toggle
                        checked={t.tempered}
                        onChange={() => toggleTempered(t.value)}
                        labelOn="Tempered"
                        labelOff="Normal"
                      />
                  </div>
                  <div className={styles.pickerGrid}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <div
                        key={num}
                        className={`${styles.pickerItem} ${t.strength_rating === num ? styles.pickerItemActive : ""}`}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          types: prev.types.map(tp => tp.value === t.value ? { ...tp, strength_rating: num } : tp),
                        }))}
                      >
                        {num}★
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className={styles.field}>
                <label>Quest Type</label>
                <CustomSelect
                  options={questOptions}
                  value={formData.quest}
                  onChange={handleQuestChange}
                />
              </div>

              <div className={styles.field}>
                <label>Quest Host Monster</label>
                <Toggle
                  checked={formData.show_host}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    show_host: e.target.checked,
                    inv_monster_id: e.target.checked ? (prev.inv_monster_id || prev.monster_id) : prev.monster_id,
                    inv_mode: "new",
                    investigation_id: "",
                  }))}
                  labelOn="Different host monster"
                  labelOff="Same as crown monster"
                />
                {formData.show_host && (
                  <div className={styles.animateIn} style={{ marginTop: '10px' }}>
                    <CustomSelect
                      options={monsterOptions}
                      value={formData.inv_monster_id || formData.monster_id}
                      onChange={(val) =>
                        setFormData(prev => ({ ...prev, inv_monster_id: val, inv_mode: "new", investigation_id: "" }))
                      }
                      placeholder="Select host monster"
                    />
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Multi-Crown Quest</label>
                <Toggle
                  checked={formData.show_multi_monster}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    show_multi_monster: e.target.checked,
                    monster2_id: e.target.checked ? (prev.monster2_id || prev.monster_id) : "",
                    monster2_types: [{ value: "small", tempered: false, strength_rating: 1 }],
                  }))}
                  labelOn="Different monster in same quest"
                  labelOff="Single monster quest"
                />
                {formData.show_multi_monster && (
                  <div className={`${styles.animateIn}`} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <CustomSelect
                      options={monsterOptions.filter(m => String(m.value) !== String(formData.monster_id))}
                      value={formData.monster2_id}
                      onChange={val => setFormData(prev => ({ ...prev, monster2_id: val }))}
                      placeholder="Select second monster"
                    />
                    <div className={styles.crownTypeToggle}>
                      {[{ label: "Small", value: "small", icon: "/icons/smallcrown.png" }, { label: "Large", value: "large", icon: "/icons/largecrown.png" }].map(opt => (
                        <div
                          key={opt.value}
                          className={`${styles.crownTypeChip} ${formData.monster2_types.some(t => t.value === opt.value) ? styles.crownTypeChipActive : ""}`}
                          onClick={() => toggleType2(opt.value)}
                        >
                          <Image src={opt.icon} width={18} height={18} alt="" className="pixel-art" />
                          {opt.label}
                        </div>
                      ))}
                    </div>
                    {formData.monster2_types.map(t => (
                      <div key={t.value} className={styles.field}>
                        <div className={styles.typeHeader}>
                          <label>
                            <Image src={t.value === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={13} height={13} alt="" className="pixel-art" style={{ marginRight: 5 }} />
                            {t.value === 'small' ? 'Small' : 'Large'} Crown
                          </label>
                          <Toggle
                            checked={t.tempered}
                            onChange={() => toggleTempered2(t.value)}
                            labelOn="Tempered"
                            labelOff="Normal"
                          />
                        </div>
                        <div className={styles.pickerGrid}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <div
                              key={num}
                              className={`${styles.pickerItem} ${t.strength_rating === num ? styles.pickerItemActive : ""}`}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                monster2_types: prev.monster2_types.map(tp => tp.value === t.value ? { ...tp, strength_rating: num } : tp),
                              }))}
                            >
                              {num}★
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.quest === "Investigation Quests" && (
                <div className={`${styles.investigationSection} ${styles.animateIn}`}>
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
