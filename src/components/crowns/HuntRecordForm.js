"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MonsterIcon from "../ui/MonsterIcon";
import CustomSelect from "../ui/CustomSelect";
import Toggle from "../ui/Toggle";
import InfoTrigger from "../ui/InfoTrigger";
import { useToast } from "@/app/UIProvider";

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



let monstersCache = null;

const fieldLabel = "flex items-center gap-1.5 font-body text-xs uppercase tracking-wider text-mist-dim";
const segmentBtnBase = "flex h-9 items-center justify-center rounded-lg border font-display text-sm transition-colors";
const segmentBtnOn = "border-ember bg-ember text-void";
const segmentBtnOff = "border-white/10 text-mist hover:border-white/20";

export default function HuntRecordForm({ initialGroup, onClose }) {
  const router = useRouter();
  const toast = useToast();

  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [questData, setQuestData] = useState(() => {
    if (initialGroup?.length) {
      const ref = initialGroup[0];
      return {
        quest: ref.quest || "Optional Quests",
        show_host: !!ref.investigation_id,
        inv_monster_id: ref.inv_monster_id || ref.monster_id,
        remaining_uses: ref.remaining_uses || ref.inv_remaining_uses || 3,
      };
    }
    return { quest: "Optional Quests", show_host: false, inv_monster_id: "", remaining_uses: 3 };
  });

  const [entries, setEntries] = useState(() => {
    if (initialGroup?.length) {
      return initialGroup.map(c => ({
        id: c.id,
        monster_id: c.monster_id,
        type: c.type,
        tempered: !!c.tempered,
        strength_rating: c.strength_rating || 1,
        image_name: c.image_name,
        name: c.name
      }));
    }
    return [{ ...DEFAULT_ENTRY }];
  });

  useEffect(() => {
    const applyMonsters = (data) => {
      if (!Array.isArray(data)) return;
      setMonsters(data);
      if (data.length > 0 && !initialGroup) {
        setEntries(prev => prev.map((e, i) => i === 0 && !e.monster_id ? { ...e, monster_id: data[0].id } : e));
      }
    };

    if (monstersCache) {
      applyMonsters(monstersCache);
    } else {
      fetch("/api/monsters")
        .then(res => res.json())
        .then(data => {
          monstersCache = data;
          applyMonsters(data);
        })
        .catch(console.error);
    }

    
  }, []);

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
    if (loading) return;
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
        toast.success(initialGroup ? "Hunt record updated!" : "Hunt record logged!");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 900);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const monsterOptions = monsters.map(m => ({ label: m.name, value: m.id }));
  const questOptions = QUEST_TYPES.map(q => ({ label: q.label, value: q.value }));
  const isEditing = !!initialGroup;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onClose} className="inline-flex w-fit items-center gap-2 font-display text-xs uppercase tracking-[0.25em] text-mist-dim transition-colors hover:text-ember-bright">
        ← Back
      </button>

      <header>
        <span className="font-body text-xs uppercase tracking-[0.25em] text-ember-dim">Crown Ledger</span>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">
          {isEditing ? "Edit Hunt Record" : "Create Hunt Record"}
        </h1>
        <p className="mt-2 max-w-xl font-body text-sm text-mist-dim">
          {isEditing
            ? "Adjust linked crowns, quest context, and strength details for an existing record set."
            : "Log a new crown sighting with its quest context, target monster, and strength details."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-xs text-mist-dim">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          {questData.quest === "Investigation Quests" && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-xs text-mist-dim">{questData.remaining_uses} uses left</span>
          )}
        </div>
      </header>

      
      <section className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-void-panel p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <div className={fieldLabel}>
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={14} height={14} alt="" className="pixel-art" />
            <span>Quest Category</span>
            <InfoTrigger title="Quest Category" content="Choose the quest type shared by the records you are editing here." />
          </div>
          <div className="sm:max-w-sm">
            <CustomSelect
              options={questOptions}
              value={questData.quest}
              onChange={val => setQuestData({ ...questData, quest: val })}
            />
          </div>
        </div>

        {questData.quest === "Investigation Quests" && (
          <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
            <div className={fieldLabel}>
              <Image src="/icons/MHWilds-Investigation_Icon.png" width={14} height={14} alt="" className="pixel-art" />
              <span>Investigation Uses</span>
              <InfoTrigger title="Investigation Uses" content="Record how many investigation runs were left when these records were found." />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setQuestData({ ...questData, remaining_uses: num })}
                  className={`${segmentBtnBase} w-9 ${questData.remaining_uses === num ? segmentBtnOn : segmentBtnOff}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <div className={fieldLabel}>
            <Image src="/icons/MHWilds-Quest_Members_Icon.png" width={16} height={16} alt="" className="pixel-art" />
            <span>Primary Quest Monster</span>
            <InfoTrigger title="Primary Quest Monster" content="Use this only if the quest's main listed monster was different from the monster tied to the records you are editing." />
          </div>
          <Toggle
            checked={questData.show_host}
            onChange={e => setQuestData({ ...questData, show_host: e.target.checked })}
            labelOn="Different from recorded monster"
            labelOff="Same as recorded monster"
          />
          {questData.show_host && (
            <div className="pt-1 sm:max-w-sm">
              <CustomSelect
                options={monsterOptions}
                value={questData.inv_monster_id}
                onChange={val => setQuestData({ ...questData, inv_monster_id: val })}
                placeholder="Select primary quest monster"
              />
            </div>
          )}
        </div>
      </section>

      
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-body text-xs uppercase tracking-[0.2em] text-ember-dim">Crown Targets</span>
            <h2 className="font-display text-sm uppercase tracking-wide text-mist">Specimen Records</h2>
          </div>
          {entries.length < 4 && (
            <button onClick={addEntry} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 font-body text-xs text-mist hover:border-ember/40 hover:text-ember-bright">
              <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="" className="pixel-art" />
              Add Another Monster
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
          {entries.map((entry, index) => {
            const monster = monsters.find(m => m.id === parseInt(entry.monster_id));
            const imageName = monster?.image_name || entry.image_name;
            const name = monster?.name || entry.name;

            return (
              <div key={index} className="rounded-2xl border border-white/5 bg-void-panel p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-body text-xs uppercase tracking-wider text-mist-dim">Specimen Report #{index + 1}</span>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(index)} className="flex h-6 w-6 items-center justify-center rounded-md text-mist-dim hover:bg-blood/10 hover:text-blood-bright">
                      <Image src="/icons/MHWilds-Notes_X_Icon.png" width={12} height={12} alt="Remove" className="pixel-art" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-void">
                    <MonsterIcon imageName={imageName} name={name} tempered={entry.tempered} size={56} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CustomSelect
                      options={monsterOptions}
                      value={entry.monster_id}
                      onChange={val => updateEntry(index, 'monster_id', val)}
                      placeholder="Select Target..."
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateEntry(index, 'type', 'small')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-body text-xs font-semibold uppercase transition-colors ${
                      entry.type === 'small' ? "border-ember/50 bg-ember/15 text-ember-bright" : "border-white/10 text-mist-dim hover:border-white/20"
                    }`}
                  >
                    <Image src="/icons/smallcrown.png" width={16} height={16} alt="" className="pixel-art" />
                    Small Crown
                  </button>
                  <button
                    onClick={() => updateEntry(index, 'type', 'large')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-body text-xs font-semibold uppercase transition-colors ${
                      entry.type === 'large' ? "border-ember/50 bg-ember/15 text-ember-bright" : "border-white/10 text-mist-dim hover:border-white/20"
                    }`}
                  >
                    <Image src="/icons/largecrown.png" width={16} height={16} alt="" className="pixel-art" />
                    Large Crown
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Strength Rating ({entry.strength_rating}★)</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <button
                        key={num}
                        onClick={() => updateEntry(index, 'strength_rating', num)}
                        className={`${segmentBtnBase} ${entry.strength_rating === num ? segmentBtnOn : segmentBtnOff}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-void px-3 py-2.5">
                  <span className="font-body text-xs uppercase tracking-wider text-mist-dim">Tempered</span>
                  <Toggle
                    checked={entry.tempered}
                    onChange={e => updateEntry(index, 'tempered', e.target.checked)}
                    labelOn="Yes"
                    labelOff="No"
                    labelClassName="w-6 text-right"
                  />
                </label>
              </div>
            );
          })}

          {entries.length < 4 && (
            <button onClick={addEntry} className="flex min-h-[8rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 text-mist-dim transition-colors hover:border-ember/30 hover:text-ember-bright">
              <Image src="/icons/MHWilds-Link_Party_Icon.png" width={24} height={24} alt="Add" className="pixel-art" />
              <span className="font-body text-xs uppercase tracking-wider">Add Monster</span>
            </button>
          )}
        </div>
      </section>

      
      <section className="flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onClose} className="whitespace-nowrap rounded-lg border border-white/10 px-5 py-2.5 text-center font-display text-xs uppercase tracking-widest text-mist hover:border-white/20">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="whitespace-nowrap rounded-lg bg-ember px-5 py-2.5 font-display text-xs uppercase tracking-widest text-void hover:bg-ember-bright disabled:opacity-50"
          >
            {success ? "Synchronized ✓" : loading ? "Synchronizing..." : "Commit Report"}
          </button>
        </div>
      </section>
    </div>
  );
}
