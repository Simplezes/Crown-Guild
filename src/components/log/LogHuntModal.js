"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast, useRankUp } from "@/app/UIProvider";
import { Icon } from "@/components/shell/Icon";
import { HuntTile, tilesOf } from "@/components/crowns/HuntTiles";
import { getSpeciesTier, crownMp } from "@/lib/mastery";

const QUESTS = [
  { label: "Event Quest", value: "Event Quests", icon: "event" },
  { label: "Optional Quest", value: "Optional Quests", icon: "optional" },
  { label: "Field Survey", value: "Field Survey Quests", icon: "survey" },
  { label: "Investigation", value: "Investigation Quests", icon: "investigation" },
];

let monstersCache = null;

const blank = (monster_id = "") => ({ monster_id, type: "small", tempered: false, strength_rating: 1, size: "" });
const cleanSize = (v) => {
  const t = v.replace(",", ".").replace(/[^\d.]/g, "");
  const [a, ...b] = t.split(".");
  return b.length ? `${a.slice(0, 4)}.${b.join("").slice(0, 2)}` : a.slice(0, 4);
};

export default function LogHuntModal({ monsterId, initialGroup, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const celebrateRankUp = useRankUp();
  const editing = !!initialGroup?.length;

  const [monsters, setMonsters] = useState(monstersCache || []);
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState(null);
  const [pickQ, setPickQ] = useState("");

  const [quest, setQuest] = useState(() => initialGroup?.[0]?.quest || "Optional Quests");
  const [uses, setUses] = useState(() => initialGroup?.[0]?.remaining_uses || initialGroup?.[0]?.inv_remaining_uses || 3);
  const [diff, setDiff] = useState(() => !!initialGroup?.[0]?.investigation_id && String(initialGroup[0].inv_monster_id) !== String(initialGroup[0].monster_id));
  const [primId, setPrimId] = useState(() => initialGroup?.[0]?.inv_monster_id || "");
  const [entries, setEntries] = useState(() =>
    initialGroup?.length
      ? initialGroup.map((c) => ({ id: c.id, monster_id: c.monster_id, type: c.type, tempered: !!c.tempered, strength_rating: c.strength_rating || 1, size: c.size_cm ? String(c.size_cm) : "" }))
      : [blank(monsterId || "")]
  );

  useEffect(() => {
    let alive = true;
    const apply = (data) => {
      if (!alive || !Array.isArray(data)) return;
      setMonsters(data);
      setEntries((prev) => prev.map((e, i) => (i === 0 && !e.monster_id ? { ...e, monster_id: data[0]?.id || "" } : e)));
    };
    if (monstersCache) apply(monstersCache);
    else
      fetch("/api/monsters")
        .then((r) => r.json())
        .then((d) => { monstersCache = d; apply(d); })
        .catch(console.error);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (pick !== null) setPick(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [pick, onClose]);

  const byId = useMemo(() => Object.fromEntries(monsters.map((m) => [String(m.id), m])), [monsters]);
  const mon = (id) => byId[String(id)] || { name: "…", image_name: null, type: "Monster" };
  const setEntry = (i, patch) => setEntries((es) => es.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const isInv = quest === "Investigation Quests";
  const primary = primId || monsters[0]?.id || "";

  const submit = async () => {
    if (loading) return;
    if (entries.some((e) => !e.monster_id)) { toast.error("Choose a monster for every crown."); return; }
    setLoading(true);
    try {
      const pairId = entries.length > 1 ? (initialGroup?.[0]?.pair_id || crypto.randomUUID()) : (initialGroup?.[0]?.pair_id || null);
      const base = {
        quest,
        investigation_monster_id: diff ? parseInt(primary) : null,
        remaining_uses: isInv ? parseInt(uses) : null,
        pair_id: pairId,
      };
      const requests = entries.map((e) => {
        const payload = { ...base, monster_id: parseInt(e.monster_id), type: e.type, tempered: e.tempered, strength_rating: parseInt(e.strength_rating), size_cm: e.size ? parseFloat(e.size) : null };
        return e.id
          ? fetch(`/api/crowns/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          : fetch("/api/crowns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      });
      if (initialGroup) {
        const keep = new Set(entries.map((e) => e.id).filter(Boolean));
        initialGroup.filter((c) => !keep.has(c.id)).forEach((c) => requests.push(fetch(`/api/crowns/${c.id}`, { method: "DELETE" })));
      }
      const results = await Promise.all(requests);
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const data = await failed.json().catch(() => ({}));
        toast.error(data.error || "Failed to save the hunt record.");
      } else {
        const payloads = await Promise.all(results.map((r) => r.json().catch(() => ({}))));
        const bestRankUp = payloads.reduce((best, p) => (p.rankUp && (!best || p.rankUp.rank > best.rank) ? p.rankUp : best), null);
        toast.success(editing ? "Hunt record updated." : "Hunt record logged.");
        onClose();
        router.refresh();
        if (bestRankUp) celebrateRankUp(bestRankUp);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const tiles = tilesOf(entries.map((e) => ({ name: mon(e.monster_id).name, image: mon(e.monster_id).image_name, type: e.type, tempered: e.tempered, strength: e.strength_rating, size: parseFloat(e.size) || 0 })));
  const mp = entries.reduce((sum, e) => sum + crownMp(getSpeciesTier(mon(e.monster_id).type), e.type, e.tempered), 0);
  const q2 = pickQ.trim().toLowerCase();
  const pickList = monsters.filter((m) => m.name.toLowerCase().includes(q2));
  const pickCurrent = pick === "p" ? String(primary) : pick !== null ? String(entries[pick]?.monster_id) : "";
  const questMeta = QUESTS.find((q) => q.value === quest) || QUESTS[1];
  const primMon = mon(primary);
  const free = Math.max(0, 4 - entries.length);

  return (
    <div className="lmodal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mform h3" role="dialog" aria-label={editing ? "Edit hunt record" : "Log a crown"}>
        <aside className="h3l">
          <div>
            <span className="eyebrow">Crown Ledger</span>
            <h2>{editing ? "Edit hunt record" : "Log a crown"}</h2>
          </div>

          <div className="h3q">
            <small>Quest</small>
            {QUESTS.map((q) => (
              <button key={q.value} aria-pressed={quest === q.value} onClick={() => setQuest(q.value)}>
                <Icon name={q.icon} /><span>{q.label}</span>
              </button>
            ))}
            <div className={`hqu ${isInv ? "" : "off"}`}>
              <span>Uses left</span>
              {[1, 2, 3].map((k) => (
                <button key={k} aria-pressed={uses === k} tabIndex={isInv ? 0 : -1} onClick={() => setUses(k)}>{k}</button>
              ))}
            </div>
            <div className="pq">
              <div className="pqh">
                <small>Quest monster</small>
                <div className="pqs" role="group" aria-label="Quest monster">
                  <button aria-pressed={!diff} onClick={() => setDiff(false)}>Same</button>
                  <button aria-pressed={diff} onClick={() => setDiff(true)}>Other</button>
                </div>
              </div>
              <div className={`pqm ${diff ? "" : "off"}`}>
                {diff ? (
                  <button className="pqb" onClick={() => { setPick("p"); setPickQ(""); }} aria-label="Choose the monster this quest is about">
                    <span className="pqa">{primMon.image_name && <Image src={`/monsters/${primMon.image_name}`} alt="" width={36} height={36} unoptimized className="px" />}</span>
                    <span className="pqn"><b>{primMon.name}</b><small>Quest is about this monster</small></span>
                    <span className="h3c" style={{ display: "block" }}>Change</span>
                  </button>
                ) : (
                  <p className="pqt">The quest is about the monster you crowned. Pick Other if you found the crown inside a different monster&apos;s quest.</p>
                )}
              </div>
            </div>
          </div>

          <div className="h3p">
            <div className="h3pl"><small>Preview</small><span className="hmp"><b>+{mp}</b> MP</span></div>
            <div className="aRec" style={{ "--n": 4 }}>
              <div className="aHead">
                <div className="aH1">
                  <span className="aQ"><Icon name={questMeta.icon} />{questMeta.label}{isInv ? ` · ${uses} left` : ""}</span>
                </div>
                <div className="aH2">
                  <span className="aN">{entries.length} crown{entries.length === 1 ? "" : "s"}</span>
                  {diff && primMon.image_name && (
                    <span className="aPm"><Image src={`/monsters/${primMon.image_name}`} alt="" width={18} height={18} unoptimized className="px" />{primMon.name}</span>
                  )}
                </div>
              </div>
              <div className="aParty">
                {tiles.map((t, i) => <HuntTile key={i} tile={t} />)}
                {Array.from({ length: Math.max(0, 4 - tiles.length) }, (_, i) => <div key={`g${i}`} className="aM ghost" />)}
              </div>
            </div>
          </div>
        </aside>

        <section className="h3r">
          <div className="h3rh">
            <span>Crowns</span><em>{entries.length} of 4</em>
            <button className="x2" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
          <div className="h3es">
            {entries.map((e, i) => {
              const m = mon(e.monster_id);
              return (
                <div key={i} className={`h3e ${e.tempered ? "tp" : ""}`}>
                  <div className="h3t">
                    <button className="h3m" onClick={() => { setPick(i); setPickQ(""); }} aria-label={`Change monster ${i + 1}: ${m.name}`}>
                      <span className="h3a">{m.image_name && <Image src={`/monsters/${m.image_name}`} alt="" width={36} height={36} unoptimized className="px" />}</span>
                      <span className="h3n"><b>{m.name}</b><small>{m.type}</small></span>
                      <span className="h3c">Change</span>
                    </button>
                    {entries.length > 1 && (
                      <button className="hrx" aria-label={`Remove monster ${i + 1}`} title="Remove" onClick={() => setEntries((es) => es.filter((_, k) => k !== i))}>
                        <Icon name="close" />
                      </button>
                    )}
                  </div>
                  <div className="h3g">
                    <div className="h3f">
                      <small>Size</small>
                      <div className="hrs" role="group" aria-label="Crown size">
                        <button aria-pressed={e.type === "small"} onClick={() => setEntry(i, { type: "small" })}>
                          <Image src="/icons/smallcrown.png" alt="" width={15} height={15} className="px" />Small
                        </button>
                        <button aria-pressed={e.type === "large"} onClick={() => setEntry(i, { type: "large" })}>
                          <Image src="/icons/largecrown.png" alt="" width={15} height={15} className="px" />Large
                        </button>
                      </div>
                    </div>
                    <div className="h3f">
                      <small>Strength</small>
                      <div className="stp">
                        <button aria-label="Decrease strength" disabled={e.strength_rating <= 1} onClick={() => setEntry(i, { strength_rating: e.strength_rating - 1 })}>&minus;</button>
                        <b>{e.strength_rating}<i>★</i></b>
                        <button aria-label="Increase strength" disabled={e.strength_rating >= 10} onClick={() => setEntry(i, { strength_rating: e.strength_rating + 1 })}>+</button>
                      </div>
                    </div>
                    <div className="h3f">
                      <small>Tempered</small>
                      <button className={`tmt ${e.tempered ? "on" : ""}`} role="switch" aria-checked={e.tempered} onClick={() => setEntry(i, { tempered: !e.tempered })}>
                        <Icon name="tempered" /><span>{e.tempered ? "Tempered" : "Normal"}</span>
                      </button>
                    </div>
                    <div className="h3f">
                      <small>Length</small>
                      <label className="h3len" title="Length in cm (optional)">
                        <input inputMode="decimal" value={e.size} onChange={(ev) => setEntry(i, { size: cleanSize(ev.target.value) })} placeholder="Optional" autoComplete="off" aria-label={`Length of crown ${i + 1} in cm, optional`} />
                        <span>cm</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            {Array.from({ length: free }, (_, k) => (
              <button key={`a${k}`} className="hadd h3add" onClick={() => setEntries((es) => [...es, blank(monsters[0]?.id || "")])}>
                <Icon name="plus" /><b>Add monster</b><span>slot free</span>
              </button>
            ))}
          </div>
          <div className="h3ft">
            <span className="hsm">{editing ? "Saving updates this record" : "MP is earned when you log"}</span>
            <button className="tbx" onClick={onClose}>Cancel</button>
            <button className="tbx pri wide" onClick={submit} disabled={loading}>{loading ? "Saving…" : editing ? "Save changes" : "Log crown"}</button>
          </div>
        </section>

        {pick !== null && (
          <div className="hpk" onMouseDown={(e) => { if (e.target === e.currentTarget) setPick(null); }}>
            <div className="hpkp" role="dialog" aria-label="Choose a monster">
              <div className="hpkh">
                <b>Choose a monster</b>
                <button className="x2" onClick={() => setPick(null)} aria-label="Close"><Icon name="close" /></button>
              </div>
              <label className="hpks">
                <Icon name="search" />
                <input autoFocus value={pickQ} onChange={(e) => setPickQ(e.target.value)} placeholder="Search monsters" aria-label="Search monsters" autoComplete="off" />
              </label>
              <div className="hpkg">
                {pickList.map((m) => (
                  <button
                    key={m.id}
                    className={`pkm ${pickCurrent === String(m.id) ? "on" : ""}`}
                    onClick={() => {
                      if (pick === "p") setPrimId(m.id);
                      else setEntry(pick, { monster_id: m.id });
                      setPick(null);
                    }}
                  >
                    <span className="pka">{m.image_name && <Image src={`/monsters/${m.image_name}`} alt="" width={56} height={56} unoptimized className="px" />}</span>
                    <b>{m.name}</b>
                    <small>{m.type}</small>
                  </button>
                ))}
                {pickList.length === 0 && <p className="pke">No monster matches &ldquo;{pickQ}&rdquo;.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
