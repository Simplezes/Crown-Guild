"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./UnifiedQuestModal.module.css";
import MonsterIcon from "../ui/MonsterIcon";
import Image from "next/image";
import CustomSelect from "../ui/CustomSelect";
import { useToast } from "@/app/UIProvider";
import Toggle from "../ui/Toggle";
import InfoTrigger from "../ui/InfoTrigger";

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

const SLOT_ICON_SIZE = 56;
const SLOT_REEL_MIDDLE_STEPS = 8;
const SLOT_REEL_DURATION_MS = 1050;
const SLOT_PRELOAD_TIMEOUT_MS = 260;

export default function UnifiedQuestModal({ isOpen, onClose, initialGroup, onUpdated }) {
  const toast = useToast();
  const [monsters, setMonsters] = useState([]);
  const [monsterReels, setMonsterReels] = useState({});
  const reelTimeoutsRef = useRef({});
  const loadedMonsterImagesRef = useRef(new Set());
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

  useEffect(() => {
    return () => {
      Object.values(reelTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      Object.values(reelTimeoutsRef.current).forEach(clearTimeout);
      reelTimeoutsRef.current = {};
      setMonsterReels({});
    }
  }, [isOpen]);

  const addEntry = () => {
    if (entries.length >= 4) return;
    setEntries([...entries, { ...DEFAULT_ENTRY, monster_id: monsters[0]?.id || "" }]);
  };

  const removeEntry = (index) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const buildSpinSequence = (fromMonsterId, toMonsterId) => {
    const fromMonster = monsters.find((m) => String(m.id) === String(fromMonsterId));
    const toMonster = monsters.find((m) => String(m.id) === String(toMonsterId));

    const pool = monsters.filter((m) => String(m.id) !== String(toMonsterId));
    const randomSteps = [];

    for (let i = 0; i < SLOT_REEL_MIDDLE_STEPS; i += 1) {
      if (pool.length === 0) break;
      randomSteps.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    const start = fromMonster || randomSteps[0] || toMonster;
    const end = toMonster || start;
    return [start, ...randomSteps, end].filter(Boolean);
  };

  const preloadReelImages = async (reelItems) => {
    if (typeof window === "undefined") return;

    const preloadTasks = reelItems
      .map((item) => item?.image_name)
      .filter(Boolean)
      .filter((name, idx, arr) => arr.indexOf(name) === idx)
      .filter((name) => !loadedMonsterImagesRef.current.has(name))
      .map((name) => new Promise((resolve) => {
        const img = new window.Image();
        img.src = `/monsters/${name}`;
        img.onload = () => {
          loadedMonsterImagesRef.current.add(name);
          resolve();
        };
        img.onerror = resolve;
      }));

    if (preloadTasks.length === 0) return;

    await Promise.race([
      Promise.allSettled(preloadTasks),
      new Promise((resolve) => setTimeout(resolve, SLOT_PRELOAD_TIMEOUT_MS))
    ]);
  };

  const clearReel = (entryIndex) => {
    setMonsterReels((prev) => {
      if (!prev[entryIndex]) return prev;
      const next = { ...prev };
      delete next[entryIndex];
      return next;
    });
  };

  const triggerMonsterSpin = async (entryIndex, fromMonsterId, toMonsterId) => {
    if (monsters.length === 0) return;

    if (reelTimeoutsRef.current[entryIndex]) {
      clearTimeout(reelTimeoutsRef.current[entryIndex]);
    }

    const reelItems = buildSpinSequence(fromMonsterId, toMonsterId);

    setMonsterReels((prev) => ({
      ...prev,
      [entryIndex]: {
        spinToken: (prev[entryIndex]?.spinToken || 0) + 1,
        reelItems,
        isSpinning: false
      }
    }));

    await preloadReelImages(reelItems);

    setMonsterReels((prev) => {
      const state = prev[entryIndex];
      if (!state) return prev;
      return {
        ...prev,
        [entryIndex]: {
          ...state,
          isSpinning: true
        }
      };
    });

    reelTimeoutsRef.current[entryIndex] = setTimeout(() => {
      clearReel(entryIndex);
      delete reelTimeoutsRef.current[entryIndex];
    }, SLOT_REEL_DURATION_MS);
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
  const modalTitle = initialGroup ? "Edit Hunt Record" : "Create Hunt Record";
  const modalSubtitle = initialGroup
    ? "Adjust linked crowns, quest context, and strength details for an existing record set."
    : "Log a new crown sighting with its quest context, target monster, and strength details.";

  const modalContent = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <div className={styles.headerCopy}>
            <span className={styles.headerEyebrow}>Crown Ledger</span>
            <h2 className="mh-title">{modalTitle}</h2>
            <p className={styles.headerSubtitle}>{modalSubtitle}</p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.headerBadge}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            {questData.quest === "Investigation Quests" && (
              <span className={styles.headerBadge}>{questData.remaining_uses} uses left</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Image src="/icons/MHWilds-Notes_X_Icon.png" width={24} height={24} alt="Close" className="pixel-art" />
          </button>
        </header>

        <div className={styles.modalBody}>
          <section className={styles.dashboardBar}>
            <div className={`${styles.dashSection} ${styles.questSection}`}>
              <div className={styles.dashLabel}>
                <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                <span>Quest Category</span>
                <InfoTrigger
                  title="Quest Category"
                  content="Choose the quest type shared by the records you are editing here."
                />
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
                <span>Primary Quest Monster</span>
                <InfoTrigger
                  title="Primary Quest Monster"
                  content="Use this only if the quest's main listed monster was different from the monster tied to the records you are editing."
                />
              </div>
              <div className={styles.dashContent}>
                <Toggle
                  checked={questData.show_host}
                  onChange={e => setQuestData({ ...questData, show_host: e.target.checked })}
                  labelOn="Different from recorded monster"
                  labelOff="Same as recorded monster"
                />
                <div className={`${styles.hostSelectSlot} ${!questData.show_host ? styles.hostSelectSlotHidden : ''}`}>
                  <CustomSelect
                    options={monsterOptions}
                    value={questData.inv_monster_id}
                    onChange={val => setQuestData({ ...questData, inv_monster_id: val })}
                    placeholder="Select primary quest monster"
                  />
                </div>
              </div>
            </div>

            {questData.quest === "Investigation Quests" && (
              <div className={`${styles.dashSection} ${styles.usesSection}`}>
                <div className={styles.dashLabel}>
                  <Image src="/icons/MHWilds-Investigation_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                  <span>Investigation Uses</span>
                  <InfoTrigger
                    title="Investigation Uses"
                    content="Record how many investigation runs were left when these records were found."
                  />
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

          <section className={styles.entriesSection}>
            <div className={styles.entriesHeader}>
              <div>
                <span className={styles.entriesEyebrow}>Crown Targets</span>
                <h3 className={styles.entriesTitle}>Specimen Records</h3>
              </div>
              {entries.length < 4 && (
                <button className={styles.addEntryButton} onClick={addEntry}>
                  <Image src="/icons/MHWilds-Link_Party_Icon.png" width={16} height={16} alt="" className="pixel-art" />
                  Add Another Monster
                </button>
              )}
            </div>

            <div className={styles.entriesGrid}>
            {entries.map((entry, index) => {
              const monster = monsters.find(m => m.id === parseInt(entry.monster_id));
              const reelState = monsterReels[index];
              const reelToken = reelState?.spinToken ?? 0;
              const isSpinning = !!reelState?.isSpinning;
              const reelItems = reelState?.reelItems?.length
                ? reelState.reelItems
                : [
                    {
                      id: monster?.id || entry.monster_id || `fallback-${index}`,
                      image_name: monster?.image_name || entry.image_name,
                      name: monster?.name || entry.name
                    }
                  ];
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
                      <div className={`${styles.monsterSlot} ${reelToken > 0 ? styles.monsterSlotSpin : ""}`}>
                        <div
                          key={`monster-reel-${index}-${reelToken}`}
                          className={`${styles.monsterReel} ${isSpinning ? styles.monsterReelSpin : ""}`}
                          style={{
                            '--slot-end': `${-SLOT_ICON_SIZE * Math.max(reelItems.length - 1, 0)}px`,
                            '--slot-duration': `${SLOT_REEL_DURATION_MS}ms`
                          }}
                        >
                          {reelItems.map((monsterItem, itemIndex) => (
                            <div key={`${monsterItem.id}-${itemIndex}-${reelToken}`} className={styles.monsterReelItem}>
                              <MonsterIcon
                                imageName={monsterItem.image_name}
                                name={monsterItem.name}
                                tempered={entry.tempered}
                                size={56}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={styles.monsterSelect}>
                        <CustomSelect
                          options={monsterOptions}
                          value={entry.monster_id}
                          onChange={async (val) => {
                            const changed = String(entry.monster_id || "") !== String(val || "");
                            if (changed) {
                              await triggerMonsterSpin(index, entry.monster_id, val);
                            }
                            updateEntry(index, 'monster_id', val);
                          }}
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
          </section>
        </div>

        <footer className={styles.modalFooter}>
          <div className={styles.footerStatus}>
            {isBeingHosted && (
              <div className={styles.hostingWarning}>
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="" className="pixel-art" />
                This crown cannot be edited while you are currently hosting it.
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
