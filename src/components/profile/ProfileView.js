"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "@/app/UIProvider";
import { Icon, Emblem } from "@/components/shell/Icon";
import { HuntTile, tilesOf } from "@/components/crowns/HuntTiles";
import { useLog } from "@/components/log/LogProvider";
import { useDrawer } from "@/components/monster/DrawerProvider";
import Pager from "@/components/ui/Pager";
import UserAvatar from "@/components/ui/UserAvatar";
import { useSettings } from "./SettingsProvider";
import { formatWishlistShare } from "@/lib/crownShare";
import CopyCrownsButton from "@/components/crowns/CopyCrownsButton";
import { SIZE_LABELS } from "@/lib/sizeLabels";

const QUEST_ICON = { "Event Quests": "event", "Optional Quests": "optional", "Field Survey Quests": "survey", "Investigation Quests": "investigation" };
const questLabel = (q) => (q || "Optional Quests").replace(/ Quests$/, " Quest").replace("Field Survey Quest", "Field Survey");
const QUEST_TYPES = ["Any", "Optional Quests", "Field Survey Quests", "Investigation Quests", "Event Quests"];
const STRENGTH_OPTIONS = ["Any", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const PER_PAGE = 9;
const nonce = () => Date.now().toString(36);
const normalizeMonsterName = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[right.length];
}

function monsterMatchScore(query, name) {
  const normalizedQuery = normalizeMonsterName(query);
  const normalizedName = normalizeMonsterName(name);
  if (!normalizedQuery || !normalizedName) return null;
  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  const substringIndex = normalizedName.indexOf(normalizedQuery);
  if (substringIndex >= 0) return 2 + substringIndex / 100;
  if (normalizedQuery.length < 3 || normalizedQuery.length > normalizedName.length + 2) return null;

  const tolerance = Math.min(2, Math.max(1, Math.floor(normalizedQuery.length / 4)));
  let best = tolerance + 1;
  for (let length = Math.max(1, normalizedQuery.length - tolerance); length <= Math.min(normalizedName.length, normalizedQuery.length + tolerance); length += 1) {
    for (let start = 0; start <= normalizedName.length - length; start += 1) {
      best = Math.min(best, editDistance(normalizedQuery, normalizedName.slice(start, start + length)));
      if (best === 0) break;
    }
    if (best === 0) break;
  }
  return best <= tolerance ? 3 + best : null;
}

const matchesCrownFilter = (group, filterState, search, monsterTypeById) => {
  const term = String(search || "").trim().toLowerCase();
  if (term) {
    const haystack = [
      group[0]?.name,
      group[0]?.monster_name,
      group[0]?.inv_monster_name,
      group[0]?.quest,
      group[0]?.type,
      group[0]?.size_label,
      group[0]?.strength_rating,
      group[0]?.remaining_uses,
      ...group.map((c) => c.name),
      ...group.map((c) => c.monster_name),
      ...group.map((c) => c.inv_monster_name),
      ...group.map((c) => c.type),
      ...group.map((c) => c.size_label),
      ...group.map((c) => c.quest),
      ...group.map((c) => c.strength_rating),
      ...group.map((c) => c.remaining_uses),
    ].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  if (filterState.questType !== "Any" && (group[0]?.quest || "") !== filterState.questType) return false;
  if (filterState.questType === "Investigation Quests" && filterState.usesLeft !== "Any") {
    const uses = Number(group[0]?.remaining_uses ?? NaN);
    if (!Number.isFinite(uses) || uses !== Number(filterState.usesLeft)) return false;
  }
  if (filterState.monsterId !== "Any" && !group.some((c) => String(c.monster_id) === String(filterState.monsterId))) return false;
  if (filterState.monsterType !== "Any" && !group.some((c) => monsterTypeById[String(c.monster_id)] === filterState.monsterType)) return false;
  if (filterState.monsterSize !== "Any" && !group.some((c) => String(c.type) === filterState.monsterSize)) return false;
  if (filterState.strength !== "Any" && !group.some((c) => Number(c.strength_rating || 0) >= Number(filterState.strength))) return false;
  if (filterState.tempered && !group.some((c) => !!c.tempered)) return false;
  if (filterState.lengthMode === "cm" && filterState.lengthCm !== "" && !group.some((c) => Number(c.size_cm) === Number(filterState.lengthCm))) return false;
  if (filterState.lengthMode === "size" && filterState.lengthSize !== "Any" && !group.some((c) => String(c.size_label || "").toUpperCase() === filterState.lengthSize)) return false;

  return true;
};

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

function groupCrowns(crowns) {
  const out = [], pairs = new Set(), invs = new Set();
  for (const c of crowns) {
    if (c.pair_id) {
      if (pairs.has(c.pair_id)) continue;
      pairs.add(c.pair_id);
      const g = crowns.filter((x) => x.pair_id === c.pair_id);
      g.forEach((x) => x.investigation_id && invs.add(x.investigation_id));
      out.push(g);
    } else if (c.investigation_id) {
      if (invs.has(c.investigation_id)) continue;
      invs.add(c.investigation_id);
      out.push(crowns.filter((x) => x.investigation_id === c.investigation_id && !x.pair_id));
    } else out.push([c]);
  }
  return out;
}
const keyOf = (g) => (g[0].pair_id ? `p${g[0].pair_id}` : g[0].investigation_id ? `i${g[0].investigation_id}` : `s${g[0].id}`);

function HuntRecord({ group, isOwner, select, picked, onPick, onEdit, onDelete, onShare, onUseCharge, onTile }) {
  const g0 = group[0];
  const tiles = tilesOf(group.map((c) => ({ name: c.name, image: c.image_name, type: c.type, tempered: !!c.tempered, strength: c.strength_rating, size: c.size_cm, sizeLabel: c.size_label })));
  const prim = g0.inv_monster_id && String(g0.inv_monster_id) !== String(g0.monster_id) ? g0 : null;
  const trackedInv = g0.quest === "Investigation Quests" && g0.remaining_uses != null;
  return (
    <div className={`aRec ${group.some((c) => c.tempered) ? "tp" : ""} ${picked ? "picked" : ""}`} style={{ "--n": tiles.length }} onClick={select ? onPick : undefined}>
      <div className="aHead pf-hunt-header">
        <div className="aH1">
          <span className="aQ">
            <Icon name={QUEST_ICON[g0.quest] || "optional"} />
            <span className="aQ-label">
              <span className="aQ-label-main">{questLabel(g0.quest).replace(/ Quest$/, "")}</span>
              {trackedInv && <span className="aQ-uses-word"> · {g0.remaining_uses}</span>}
            </span>
            {prim?.inv_monster_image && <Image src={`/monsters/${prim.inv_monster_image}`} alt={`Investigation target: ${prim.inv_monster_name}`} title={`Investigation target: ${prim.inv_monster_name}`} width={22} height={22} unoptimized className="pf-investigation-target" />}
          </span>
        </div>
        <div className="aH2">
          {select && <span className={`pk ${picked ? "on" : ""}`}>{picked && <Icon name="check" />}</span>}
          {!select && (
            <div className="pc2x">
              {isOwner && trackedInv && <button className="chg" onClick={onUseCharge} title="Use a charge (reduces uses left)" aria-label="Use a charge, reducing uses left by 1"><b>&minus;1</b></button>}
              {isOwner && <button onClick={onEdit} title="Edit hunt record" aria-label="Edit hunt record"><Icon name="edit" /></button>}
              <button onClick={onShare} title="Copy link" aria-label="Copy link"><Icon name="link" /></button>
              {isOwner && <button className="dl" onClick={onDelete} title="Delete hunt record" aria-label="Delete hunt record"><Icon name="trash" /></button>}
            </div>
          )}
        </div>
      </div>
      <div className="aParty">
        {tiles.map((t, i) => <HuntTile key={i} tile={t} onClick={select ? undefined : () => onTile(t.name)} />)}
      </div>
    </div>
  );
}

function SizeCard({ m, type, isOwner, onToggle, noun }) {
  const { openDrawer } = useDrawer();
  const has = (k) => type === "both" || type === k;
  const btn = (k, label) => (
    <button className={`szb ${has(k) ? "on" : ""}`} aria-pressed={has(k)} disabled={!isOwner}
      onClick={(e) => { e.stopPropagation(); onToggle(m, k); }}
      aria-label={`${label} crown of ${m.name}: ${has(k) ? noun : "not " + noun}`}>
      <Image src={`/icons/${k}crown.png`} alt="" width={16} height={16} className="px" /><span>{label}</span>
    </button>
  );
  return (
    <div className={`pc2 ${type ? "" : "miss"}`} onClick={() => openDrawer(m.name)}>
      <div className="pc2a"><Image src={`/monsters/${m.image_name}`} alt="" width={56} height={56} unoptimized className="px" /></div>
      <div className="pc2b"><b>{m.name}</b>
        <div className="pc2c"><span className="ck">{type ? (type === "both" ? "Both sizes" : type === "small" ? "Small only" : "Large only") : `Not ${noun}`}</span></div>
      </div>
      <div className="szs">{btn("small", "Small")}{btn("large", "Large")}</div>
    </div>
  );
}

export default function ProfileView({ user, crowns, stats, mp, rank, collection, wishlist, allMonsters, isOwner, viewerId, openSettings }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();

  const [tab, setTab] = useState("Crowns");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filterMenuField, setFilterMenuField] = useState(null);
  const [page, setPage] = useState(1);
  const [select, setSelect] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const { openSettings: showSettings } = useSettings();
  const filterRef = useRef(null);
  const [filterState, setFilterState] = useState({
    questType: "Any",
    usesLeft: "Any",
    monsterId: "Any",
    monsterType: "Any",
    monsterSize: "Any",
    strength: "Any",
    tempered: false,
    lengthMode: "cm",
    lengthCm: "",
    lengthSize: "Any",
  });

  useEffect(() => {
    if (openSettings && isOwner) showSettings();
  }, [openSettings, isOwner, showSettings]);

  useEffect(() => {
    const onClick = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
        setFilterMenuField(null);
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const [col, setCol] = useState(() => Object.fromEntries(collection.map((c) => [c.monster_id, c.type])));
  const [wish, setWish] = useState(() => Object.fromEntries(wishlist.map((w) => [w.monster_id, w.type])));

  const monsterOptions = useMemo(() => [
    { value: "Any", label: "Any monster" },
    ...allMonsters.map((m) => ({ value: String(m.id), label: m.name, image_name: m.image_name }))
  ], [allMonsters]);
  const monsterTypeOptions = useMemo(() => {
    const types = [...new Set(allMonsters.map((m) => m.type || "Monster"))].sort((a, b) => a.localeCompare(b));
    return ["Any", ...types];
  }, [allMonsters]);
  const monsterTypeById = useMemo(() => Object.fromEntries(allMonsters.map((m) => [String(m.id), m.type || "Monster"])), [allMonsters]);
  const monsterSuggestions = useMemo(() => {
    if (!filterQuery.trim()) return [];
    return allMonsters
      .map((monster) => ({ monster, score: monsterMatchScore(filterQuery, monster.name) }))
      .filter(({ score }) => score !== null)
      .sort((a, b) => a.score - b.score || a.monster.name.localeCompare(b.monster.name))
      .slice(0, 5)
      .map(({ monster }) => monster);
  }, [allMonsters, filterQuery]);

  const activeFilters = [];
  if (filterState.questType !== "Any") activeFilters.push({ key: "questType", label: `Quest: ${filterState.questType}` });
  if (filterState.questType === "Investigation Quests" && filterState.usesLeft !== "Any") activeFilters.push({ key: "usesLeft", label: `Uses left: ${filterState.usesLeft}` });
  if (filterState.monsterId !== "Any") activeFilters.push({ key: "monsterId", label: `Monster: ${monsterOptions.find((option) => option.value === filterState.monsterId)?.label || "Selected"}` });
  if (filterState.monsterType !== "Any") activeFilters.push({ key: "monsterType", label: `Type: ${filterState.monsterType}` });
  if (filterState.monsterSize !== "Any") activeFilters.push({ key: "monsterSize", label: `Size: ${filterState.monsterSize === "small" ? "Small" : "Large"}` });
  if (filterState.strength !== "Any") activeFilters.push({ key: "strength", label: `Strength: ${filterState.strength}+` });
  if (filterState.tempered) activeFilters.push({ key: "tempered", label: "Tempered" });
  if (filterState.lengthMode === "cm" && filterState.lengthCm !== "") activeFilters.push({ key: "length", label: `Length: ${filterState.lengthCm} cm` });
  if (filterState.lengthMode === "size" && filterState.lengthSize !== "Any") activeFilters.push({ key: "length", label: `Length: ${filterState.lengthSize}` });

  const filterTitles = {
    questType: "Quest type",
    usesLeft: "Uses left",
    monsterId: "Monster",
    monsterType: "Monster type",
    monsterSize: "Monster size",
    strength: "Monster strength",
    length: "Length",
  };
  const filterCategories = [
    { key: "questType", value: filterState.questType === "Any" ? "Any" : filterState.questType },
    ...(filterState.questType === "Investigation Quests" ? [{ key: "usesLeft", value: filterState.usesLeft === "Any" ? "Any" : `${filterState.usesLeft} left` }] : []),
    { key: "monsterId", value: filterState.monsterId === "Any" ? "Any" : monsterOptions.find((option) => option.value === filterState.monsterId)?.label || "Any" },
    { key: "monsterType", value: filterState.monsterType },
    { key: "monsterSize", value: filterState.monsterSize === "Any" ? "Any" : filterState.monsterSize === "small" ? "Small" : "Large" },
    { key: "strength", value: filterState.strength === "Any" ? "Any" : `${filterState.strength}+` },
    { key: "length", value: filterState.lengthMode === "cm" ? (filterState.lengthCm ? `${filterState.lengthCm} cm` : "Any") : (filterState.lengthSize === "Any" ? "Any" : filterState.lengthSize) },
  ];
  const filterMenuOptions = filterMenuField === "questType"
    ? QUEST_TYPES.map((value) => ({ value, label: value === "Any" ? "Any quest type" : value }))
    : filterMenuField === "usesLeft"
      ? ["Any", "1", "2", "3"].map((value) => ({ value, label: value === "Any" ? "Any" : `${value} left` }))
      : filterMenuField === "monsterId"
        ? monsterOptions
        : filterMenuField === "monsterType"
          ? monsterTypeOptions.map((value) => ({ value, label: value === "Any" ? "Any monster type" : value }))
          : filterMenuField === "monsterSize"
            ? ["Any", "small", "large"].map((value) => ({ value, label: value === "Any" ? "Any size" : value === "small" ? "Small" : "Large" }))
            : filterMenuField === "strength"
              ? STRENGTH_OPTIONS.map((value) => ({ value, label: value === "Any" ? "Any strength" : `${value}★+` }))
              : [];

  const chooseFilterValue = (value) => {
    setFilterState((current) => {
      if (filterMenuField === "questType") return { ...current, questType: value, usesLeft: value === "Investigation Quests" ? current.usesLeft : "Any" };
      if (filterMenuField === "usesLeft") return { ...current, usesLeft: value };
      if (filterMenuField === "monsterId") return { ...current, monsterId: value };
      if (filterMenuField === "monsterType") return { ...current, monsterType: value };
      if (filterMenuField === "monsterSize") return { ...current, monsterSize: value };
      if (filterMenuField === "strength") return { ...current, strength: value };
      return current;
    });
    setFilterMenuField(null);
  };

  const clearFilter = (key) => {
    const reset = {
      questType: { questType: "Any", usesLeft: "Any" },
      usesLeft: { usesLeft: "Any" },
      monsterId: { monsterId: "Any" },
      monsterType: { monsterType: "Any" },
      monsterSize: { monsterSize: "Any" },
      strength: { strength: "Any" },
      tempered: { tempered: false },
      length: { lengthMode: "cm", lengthCm: "", lengthSize: "Any" },
    };
    setFilterState((current) => ({ ...current, ...reset[key] }));
  };

  const clearAllFilters = () => {
    setFilterState({ questType: "Any", usesLeft: "Any", monsterId: "Any", monsterType: "Any", monsterSize: "Any", strength: "Any", tempered: false, lengthMode: "cm", lengthCm: "", lengthSize: "Any" });
    setFilterQuery("");
    setPage(1);
  };

  const groups = useMemo(() => groupCrowns(crowns), [crowns]);
  const list = groups.filter((g) => matchesCrownFilter(g, filterState, filterQuery, monsterTypeById));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const tempered = crowns.filter((c) => c.tempered).length;
  const toggleTab = { Collected: [setCol, "/api/collection", "collection", col], Wishlist: [setWish, "/api/wishlist", "wishlist", wish] };

  const toggleSize = async (m, k) => {
    const [setMap, url, noun, map] = toggleTab[tab];
    const cur = map[m.id] || null;
    let s = cur === "both" || cur === "small", l = cur === "both" || cur === "large";
    if (k === "small") s = !s; else l = !l;
    const next = s && l ? "both" : s ? "small" : l ? "large" : null;
    setMap((p) => ({ ...p, [m.id]: next }));
    try {
      const res = await fetch(url, { method: next ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monsterId: m.id, type: next }) });
      if (!res.ok) throw new Error();
      toast.success(`${m.name} ${k} crown ${(k === "small" ? s : l) ? "added to" : "removed from"} your ${noun}.`);
      router.refresh();
    } catch {
      setMap((p) => ({ ...p, [m.id]: cur }));
      toast.error(`Could not update your ${noun}.`);
    }
  };

  const del = async (gs) => {
    const n = gs.length, cr = gs.reduce((a, g) => a + g.length, 0);
    const ok = await confirm(`This removes ${cr} crown${cr === 1 ? "" : "s"} and the Mastery Points they earned. It cannot be undone.`, {
      title: `Delete ${n === 1 ? "this hunt record" : `these ${n} hunt records`}?`, danger: true, confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      const rs = await Promise.all(gs.flat().map((c) => fetch(`/api/crowns/${c.id}`, { method: "DELETE" })));
      if (rs.some((r) => !r.ok)) throw new Error();
      toast.success(`Deleted ${n} hunt record${n === 1 ? "" : "s"}.`);
      setSelect(false);
      setPicked(new Set());
      router.refresh();
    } catch {
      toast.error("Could not delete every crown.");
    }
  };

  const share = (g) => {
    const url = `${window.location.origin}/monster/${encodeURIComponent(g[0].name)}?crownId=${g[0].id}&user=${user.id}&share=${nonce()}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast.info("Link copied to your clipboard.");
  };

  const spendCharge = async (g) => {
    const investigationId = g[0].investigation_id;
    if (!investigationId) return;
    try {
      const res = await fetch(`/api/investigations/${investigationId}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.removed) toast.success("Investigation used up — record removed.");
      else toast.info(`${data.remaining_uses} use${data.remaining_uses === 1 ? "" : "s"} left.`);
      router.refresh();
    } catch {
      toast.error("Could not update the investigation.");
    }
  };
  const copy = (v) => { navigator.clipboard?.writeText(v).catch(() => {}); toast.info("Copied to your clipboard."); };

  const copyWishlist = async () => {
    const entries = allMonsters.filter((m) => wish[m.id]).map((m) => ({ name: m.name, emoji: m.emoji, type: wish[m.id] }));
    const copied = await copyText(formatWishlistShare(entries));
    if (copied) toast.success("Wishlist copied to your clipboard.");
    else toast.error("Could not copy your wishlist. Check clipboard permissions and try again.");
  };

  const allPicked = list.length > 0 && list.every((g) => picked.has(keyOf(g)));
  const tabs = [["Crowns", crowns.length], ["Collected", Object.values(col).filter(Boolean).length], ["Wishlist", Object.values(wish).filter(Boolean).length]];

  const sizes = (map, noun) => {
    const have = allMonsters.filter((m) => map[m.id]), lack = allMonsters.filter((m) => !map[m.id]);
    const card = (m) => <SizeCard key={m.id} m={m} type={map[m.id]} isOwner={isOwner} onToggle={toggleSize} noun={noun} />;
    const tip = isOwner
      ? (noun === "collected" ? "Choose the crown sizes you have collected for each monster. Others use this to see what you can host. This is a personal tracker only - Mastery Points come from crowns you log in the Crown Ledger." : "Choose the crown sizes you are looking for. Hosts can find you in searches.")
      : `The crown sizes ${user.username} has ${noun}.`;
    return (
      <>
        {noun === "wishlisted" && isOwner && have.length > 0 && (
          <div className="ptools">
            <button className="btn o sm" onClick={copyWishlist} title="Copy your wishlist with MH Wilds emotes"><Icon name="copy" />Copy wishlist</button>
          </div>
        )}
        <p className="ptip">{tip}</p>
        {have.length ? <div className="pgrid">{have.map(card)}</div> : <div className="m2empty"><b>{noun === "collected" ? "Nothing collected yet" : "No wishes yet"}</b><span>{isOwner ? "Pick a size on any monster below." : ""}</span></div>}
        {lack.length > 0 && <><div className="plab">Not {noun} yet <i>{lack.length}</i></div><div className="pgrid">{lack.map(card)}</div></>}
      </>
    );
  };

  return (
    <div className="pad pf">
      <section className="pf-hero">
        <div className="pf-av">
          <UserAvatar src={user.avatar_url} alt={user.username} size={96} className="pf-a" />
          <span className="pf-b" title={rank.title}><Emblem rank={rank.rank} /></span>
        </div>
        <div className="pf-id">
          <span className="eyebrow">Hunter profile</span>
          <h1>{user.username}</h1>
          <div className="pf-m"><span className="pf-rk">{rank.title}</span><span className="pf-idn">ID {user.id}</span></div>
          {user.status_message && <p className="pf-q">&ldquo;{user.status_message}&rdquo;</p>}
        </div>
        <div className="pf-act">
          <CopyCrownsButton crowns={crowns} userId={user.id} />
          {viewerId && !isOwner && <Link className="btn o sm" href={`/compare?a=${viewerId}&b=${user.id}`}><Icon name="compare" />Compare with you</Link>}
          {isOwner && <Link className="btn o sm" href={`/compare?a=${user.id}`}><Icon name="compare" />Compare with…</Link>}
          {isOwner && <button className="btn sm" onClick={() => showSettings()}><Icon name="edit" />Edit profile</button>}
        </div>
      </section>

      <div className="pf-cols">
        <aside className="pf-side">
          <section className="wd pf-rank">
            <div className="pf-rt"><div className="pf-re"><Emblem rank={rank.rank} /></div><div><small>Mastery</small><b>{rank.title}</b><span>{mp} MP</span></div></div>
            <div className="ladder mini" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={`rg ${i + 1 < rank.rank ? "done" : i + 1 === rank.rank ? "cur" : "lock"}`}><div className="rge"><Emblem rank={i + 1} /></div></div>
              ))}
            </div>
            <p className="pf-next">{rank.nextTitle ? <><b>{rank.toNext} MP</b> to reach {rank.nextTitle}</> : "Highest rank reached"}</p>
            <div className="pf-tiles">
              <div><b>{crowns.length}</b><span>Crowns</span></div><div><b>{Number(stats.small || 0)}</b><span>Small</span></div>
              <div><b>{Number(stats.large || 0)}</b><span>Large</span></div><div><b>{tempered}</b><span>Tempered</span></div>
            </div>
          </section>
          {(user.lobby_id || isOwner) && (
            <section className="wd pf-lobby">
              <div className="wh"><h3>Lobby info</h3>{isOwner && <button className="lnk" onClick={() => showSettings()}>Edit</button>}</div>
              {user.lobby_id ? (
                <>
                  <div className="lrow2"><div><small>Lobby ID</small><code>{user.lobby_id}</code></div><button className="cp" onClick={() => copy(user.lobby_id)} aria-label="Copy lobby ID" title="Copy"><Icon name="copy" /></button></div>
                  {user.quest_password && <div className="lrow2"><div><small>Passcode</small><code>{user.quest_password}</code></div><button className="cp" onClick={() => copy(user.quest_password)} aria-label="Copy passcode" title="Copy"><Icon name="copy" /></button></div>}
                </>
              ) : <p className="ptip" style={{ margin: 0 }}>No active lobby. Standing by.</p>}
            </section>
          )}
        </aside>

        <section className="wd pf-main">
          <div className="tabs3" role="tablist">
            {tabs.map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setSelect(false); setPicked(new Set()); }}>{t}<i>{n}</i></button>)}
          </div>
          <div className="pf-body">
            {tab === "Crowns" ? (
              <>
                <div className="ptools">
                  <div className="pf-tools-main">
                  <div className="pf-filter-wrap" ref={filterRef}>
                    <div className="pf-filter" role="search">
                      <button type="button" className="pf-filter-trigger" onClick={() => { setSuggestionsOpen(false); setFilterMenuField(null); setFilterOpen((open) => !open); }} aria-expanded={filterOpen} aria-label="Open filter options" title="Filter">
                        <Icon name="filter" />
                      </button>
                      <div className="pf-filter-chips">
                        {activeFilters.map((filter) => (
                          <span className="pf-filter-chip" key={filter.key}>
                            <span>{filter.label}</span>
                            <button type="button" onClick={() => clearFilter(filter.key)} aria-label={`Remove ${filter.label} filter`} title={`Remove ${filter.label}`}><Icon name="close" /></button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="search"
                        value={filterQuery}
                        onChange={(e) => { setFilterQuery(e.target.value); setPage(1); setSuggestionsOpen(true); setFilterOpen(false); }}
                        onFocus={() => { setSuggestionsOpen(true); setFilterOpen(false); setFilterMenuField(null); }}
                        placeholder={activeFilters.length ? "" : "Search crowns..."}
                        aria-label="Search crowns"
                        autoComplete="off"
                      />
                    </div>
                    {suggestionsOpen && monsterSuggestions.length > 0 && (
                      <div className="pf-suggestions" role="listbox" aria-label="Monster suggestions">
                        <div className="pf-suggestions-head">Is this what you&apos;re looking for?</div>
                        {monsterSuggestions.map((monster) => (
                          <button key={monster.id} type="button" className="pf-suggestion" role="option" aria-selected={false} onClick={() => {
                            setFilterState((current) => ({ ...current, monsterId: String(monster.id) }));
                            setFilterQuery("");
                            setSuggestionsOpen(false);
                            setPage(1);
                          }}>
                            {monster.image_name && <Image src={`/monsters/${monster.image_name}`} alt="" width={26} height={26} unoptimized />}
                            <span>{monster.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {filterOpen && (
                      <div className="pf-filter-menu" role="dialog" aria-label="Filter crowns">
                        <div className="pf-filter-menu-head">
                          {filterMenuField && <button type="button" className="pf-menu-back" onClick={() => setFilterMenuField(null)} aria-label="Back to filters"><Icon name="back" /></button>}
                          <span>{filterMenuField ? filterTitles[filterMenuField] : "Add filter"}</span>
                          {activeFilters.length > 0 && <button type="button" className="pf-filter-reset" onClick={clearAllFilters}>Clear all</button>}
                        </div>

                        {!filterMenuField ? (
                          <div className="pf-filter-menu-options">
                            {filterCategories.map(({ key, value }) => (
                              <button type="button" className="pf-filter-menu-row" key={key} onClick={() => setFilterMenuField(key)}>
                                <span>{filterTitles[key]}</span><small>{value}</small><Icon name="down" className="pf-row-chevron" />
                              </button>
                            ))}
                            <button type="button" className="pf-filter-menu-row" aria-pressed={filterState.tempered} onClick={() => setFilterState((current) => ({ ...current, tempered: !current.tempered }))}>
                              <span>Tempered</span><Icon name="check" className="pf-row-check" />
                            </button>
                          </div>
                        ) : filterMenuField === "length" ? (
                          <div className="pf-length-editor">
                            <div className="pf-length-modes" role="group" aria-label="Length format">
                              <button type="button" aria-pressed={filterState.lengthMode === "cm"} onClick={() => setFilterState((current) => ({ ...current, lengthMode: "cm", lengthCm: "", lengthSize: "Any" }))}>cm</button>
                              <button type="button" aria-pressed={filterState.lengthMode === "size"} onClick={() => setFilterState((current) => ({ ...current, lengthMode: "size", lengthCm: "", lengthSize: "Any" }))}>Size</button>
                            </div>
                            {filterState.lengthMode === "cm" ? (
                              <label className="pf-length-input">
                                <input type="number" min="0" step="any" value={filterState.lengthCm} onChange={(e) => setFilterState((current) => ({ ...current, lengthCm: e.target.value }))} placeholder="Any length" aria-label="Length in centimeters" />
                                <span>cm</span>
                              </label>
                            ) : (
                              <div className="pf-filter-menu-options">
                                {["Any", ...SIZE_LABELS].map((value) => (
                                  <button type="button" className="pf-filter-menu-option" key={value} aria-pressed={filterState.lengthSize === value} onClick={() => setFilterState((current) => ({ ...current, lengthSize: value }))}>
                                    <span>{value === "Any" ? "Any size" : value}</span>{filterState.lengthSize === value && <Icon name="check" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pf-filter-menu-options">
                            {filterMenuOptions.map(({ value, label, image_name }) => {
                              const selected = filterMenuField === "questType" ? filterState.questType === value
                                : filterMenuField === "usesLeft" ? filterState.usesLeft === value
                                  : filterMenuField === "monsterId" ? filterState.monsterId === value
                                    : filterMenuField === "monsterType" ? filterState.monsterType === value
                                      : filterMenuField === "monsterSize" ? filterState.monsterSize === value
                                        : filterState.strength === value;
                              return (
                                <button type="button" className="pf-filter-menu-option" key={value} aria-pressed={selected} onClick={() => chooseFilterValue(value)}>
                                  <span>{label}</span>
                                  {filterMenuField === "monsterId" && image_name ? <Image src={`/monsters/${image_name}`} alt="" width={22} height={22} unoptimized className="pf-monster-option-image" /> : selected && <Icon name="check" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="ptc">{list.length} hunt record{list.length === 1 ? "" : "s"}</span>
                  </div>
                  {isOwner && (
                    <div className="pf-selection-actions" role="group" aria-label="Hunt record selection actions">
                      {select ? (
                        <>
                          <span className="selc">{picked.size} selected</span>
                          <button className="tbx" onClick={() => setPicked(allPicked ? new Set() : new Set(list.map(keyOf)))}>{allPicked ? "Clear all" : "Select all"}</button>
                          <button className="tbx danger" disabled={!picked.size} onClick={() => del(list.filter((g) => picked.has(keyOf(g))))}><Icon name="trash" />Delete</button>
                          <button className="tbx" onClick={() => { setSelect(false); setPicked(new Set()); }}>Cancel</button>
                        </>
                      ) : <button className="tbx" onClick={() => setSelect(true)}><Icon name="check" />Select</button>}
                    </div>
                  )}
                </div>
                {list.length ? (
                  <div className="ggrid">
                    {shown.map((g) => (
                      <HuntRecord key={keyOf(g)} group={g} isOwner={isOwner} select={select} picked={picked.has(keyOf(g))}
                        onPick={() => setPicked((p) => { const n = new Set(p); if (n.has(keyOf(g))) n.delete(keyOf(g)); else n.add(keyOf(g)); return n; })}
                        onEdit={() => openLog({ group: g })} onDelete={() => del([g])} onShare={() => share(g)} onUseCharge={() => spendCharge(g)} onTile={openDrawer} />
                    ))}
                  </div>
                ) : <div className="m2empty"><b>No crowns here</b><span>{isOwner ? "Log a crown to fill this list." : ""}</span></div>}
                <Pager page={cur} pages={pages} onPage={setPage} />
              </>
            ) : tab === "Collected" ? sizes(col, "collected") : sizes(wish, "wishlisted")}
          </div>
        </section>
      </div>

    </div>
  );
}
