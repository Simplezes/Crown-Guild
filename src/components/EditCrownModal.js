"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./EditCrownModal.module.css";
import MonsterIcon from "./MonsterIcon";
import Image from "next/image";
import CustomSelect from "./CustomSelect";
import { useToast } from "@/app/UIProvider";

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
  const [investigations, setInvestigations] = useState([]);

  const [formData, setFormData] = useState({
    monster_id: "",
    types: ["small"],          // array of selected types (single-crown only)
    tempered: false,           // single-crown tempered
    quest: "Optional Quests",
    strength_rating: 1,
    // Investigation fields
    inv_mode: "existing",
    inv_monster_id: "",
    remaining_uses: 3,
    investigation_id: "",
    // Per-crown overrides for group editing
    perCrown: [],              // [{id, type, tempered}]
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
        inv_mode: ref.investigation_id ? "existing" : "new",
        inv_monster_id: ref.inv_monster_id || ref.monster_id,
        remaining_uses: ref.remaining_uses || 3,
        investigation_id: ref.investigation_id || "",
        perCrown: isGroup
          ? crowns.map(c => ({ id: c.id, type: c.type, tempered: !!c.tempered }))
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

      fetch("/api/investigations")
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setInvestigations(data); })
        .catch(console.error);
    }
  }, [isOpen, crown, group]);

  // Investigations matching the currently chosen inv_monster
  const matchingInvestigations = investigations.filter(
    inv => String(inv.monster_id) === String(formData.inv_monster_id || formData.monster_id)
  );

  const isChanged = crowns.length > 0 && (() => {
    const ref = crowns[0];
    if (isGroup) {
      const origPerCrown = crowns.map(c => ({ id: c.id, tempered: !!c.tempered }));
      const perCrownChanged = formData.perCrown.some((pc, i) => pc.tempered !== origPerCrown[i]?.tempered);
      return perCrownChanged ||
        formData.quest !== (ref.quest || "Optional Quests") ||
        formData.strength_rating !== (ref.strength_rating || 1) ||
        String(formData.investigation_id) !== String(ref.investigation_id || "") ||
        (formData.quest === "Investigation Quests" && formData.inv_mode === "new" && formData.remaining_uses !== (ref.remaining_uses || 3)) ||
        (formData.quest === "Field Survey Quests" && String(formData.inv_monster_id) !== String(ref.inv_monster_id || ref.monster_id));
    }
    return (
      !formData.types.includes(ref.type) ||
      formData.types.length > 1 ||
      formData.tempered !== !!ref.tempered ||
      formData.quest !== (ref.quest || "Optional Quests") ||
      formData.strength_rating !== (ref.strength_rating || 1) ||
      String(formData.investigation_id) !== String(ref.investigation_id || "") ||
      (formData.quest === "Investigation Quests" && formData.inv_mode === "new" && formData.remaining_uses !== (ref.remaining_uses || 3)) ||
      (formData.quest === "Field Survey Quests" && String(formData.inv_monster_id) !== String(ref.inv_monster_id || ref.monster_id))
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
        strength_rating: parseInt(formData.strength_rating),
      };

      if (formData.quest === "Investigation Quests") {
        if (formData.inv_mode === "existing" && formData.investigation_id) {
          basePayload.investigation_id = parseInt(formData.investigation_id);
        } else if (formData.inv_mode === "new") {
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

      let requests;

      if (isGroup) {
        // PATCH each crown with shared settings + its own type/tempered
        requests = formData.perCrown.map(pc =>
          fetch(`/api/crowns/${pc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, type: pc.type, tempered: pc.tempered }),
          })
        );
      } else {
        const ref = crowns[0];
        const patchType = formData.types.includes(ref.type) ? ref.type : formData.types[0];
        requests = [
          fetch(`/api/crowns/${ref.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...basePayload, type: patchType, tempered: formData.tempered }),
          }),
        ];
        for (const type of formData.types) {
          if (type !== patchType) {
            requests.push(
              fetch("/api/crowns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...basePayload, type, tempered: formData.tempered }),
              })
            );
          }
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
                  // Group: fixed types, independent tempered per crown
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
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            className={styles.toggleInput}
                            checked={pc.tempered}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              perCrown: prev.perCrown.map((p, j) =>
                                j === i ? { ...p, tempered: !p.tempered } : p
                              ),
                            }))}
                          />
                          <div className={styles.switch}>
                            <div className={styles.switchHandle} />
                          </div>
                          <span className={`${styles.temperedLabel} ${pc.tempered ? styles.temperedActive : ""}`}>
                            {pc.tempered ? "Tempered" : "Normal"}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single: type toggle chips
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
                      onClick={() => setFormData({ ...formData, quest: q.value, inv_mode: "new" })}
                    >
                      {q.label}
                    </div>
                  ))}
                </div>

                {/* ── Investigation controls ─────────────────────────── */}
                {formData.quest === "Investigation Quests" && (
                  <div className={`${styles.investigationBlock} ${styles.animateIn}`}>
                    <div className={styles.editRow} style={{ marginTop: '12px' }}>
                      <label>Investigation Target</label>
                      <p className={styles.invHint}>
                        Which monster&rsquo;s investigation scroll gives access to this crown?
                      </p>
                      {monsters.length > 0 && (
                        <CustomSelect
                          options={monsterOptions}
                          value={formData.inv_monster_id || formData.monster_id}
                          onChange={(val) =>
                            setFormData(prev => ({
                              ...prev,
                              inv_monster_id: val,
                              inv_mode: "new",
                              investigation_id: "",
                            }))
                          }
                          placeholder="Select investigation monster"
                        />
                      )}
                    </div>

                    {matchingInvestigations.length > 0 && (
                      <div className={styles.editRow} style={{ marginTop: '10px' }}>
                        <label>Link to Investigation</label>
                        <div className={styles.invModeToggle}>
                          <div
                            className={`${styles.invModeBtn} ${formData.inv_mode === "existing" ? styles.invModeBtnActive : ""}`}
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              inv_mode: "existing",
                              investigation_id: prev.investigation_id || matchingInvestigations[0].id,
                            }))}
                          >
                            Use Existing
                          </div>
                          <div
                            className={`${styles.invModeBtn} ${formData.inv_mode === "new" ? styles.invModeBtnActive : ""}`}
                            onClick={() => setFormData(prev => ({ ...prev, inv_mode: "new", investigation_id: "" }))}
                          >
                            New Investigation
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.inv_mode === "existing" && matchingInvestigations.length > 0 ? (
                      <div className={`${styles.editRow} ${styles.animateIn}`} style={{ marginTop: '8px' }}>
                        <label>Select Investigation</label>
                        <div className={styles.invList}>
                          {matchingInvestigations.map(inv => (
                            <div
                              key={inv.id}
                              className={`${styles.invItem} ${String(formData.investigation_id) === String(inv.id) ? styles.invItemActive : ""}`}
                              onClick={() => setFormData(prev => ({ ...prev, investigation_id: inv.id }))}
                            >
                              <MonsterIcon imageName={inv.monster_image} name={inv.monster_name} size={24} />
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
                    ) : formData.inv_mode === "new" && (
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
                    )}
                  </div>
                )}

                {/* ── Field Survey controls ────────────────────── */}
                {formData.quest === "Field Survey Quests" && (
                  <div className={`${styles.investigationBlock} ${styles.animateIn}`}>
                    <div className={styles.editRow} style={{ marginTop: '12px' }}>
                      <label>Quest Host Monster</label>
                      <p className={styles.invHint}>
                        Which monster&rsquo;s field survey did this crown come from?
                      </p>
                      {monsters.length > 0 && (
                        <CustomSelect
                          options={monsterOptions}
                          value={formData.inv_monster_id || formData.monster_id}
                          onChange={(val) =>
                            setFormData(prev => ({ ...prev, inv_monster_id: val }))
                          }
                          placeholder="Select host monster"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Single-crown tempered toggle — hidden for groups (handled per-crown above) */}
                {!isGroup && (
                <div className={styles.editRow} style={{ marginTop: '12px' }}>
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
                )}
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
