"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatCrownShare } from "@/lib/crownShare";

const QUEST_ICON = { "Event Quests": "event", "Optional Quests": "optional", "Field Survey Quests": "survey", "Investigation Quests": "investigation" };
const questLabel = (q) => (q || "Optional Quests").replace(/ Quests$/, " Quest").replace("Field Survey Quest", "Field Survey");
const FILTERS = ["All", "Small", "Large", "Tempered"];
const PER_PAGE = 9;
const nonce = () => Date.now().toString(36);

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

function HuntRecord({ group, isOwner, select, picked, onPick, onEdit, onDelete, onShare, onTile }) {
  const g0 = group[0];
  const tiles = tilesOf(group.map((c) => ({ name: c.name, image: c.image_name, type: c.type, tempered: !!c.tempered, strength: c.strength_rating, size: c.size_cm })));
  const prim = g0.inv_monster_id && String(g0.inv_monster_id) !== String(g0.monster_id) ? g0 : null;
  const uses = g0.quest === "Investigation Quests" && g0.remaining_uses != null ? ` · ${g0.remaining_uses} left` : "";
  return (
    <div className={`aRec ${group.some((c) => c.tempered) ? "tp" : ""} ${picked ? "picked" : ""}`} style={{ "--n": tiles.length }} onClick={select ? onPick : undefined}>
      <div className="aHead">
        <div className="aH1">
          <span className="aQ"><Icon name={QUEST_ICON[g0.quest] || "optional"} />{questLabel(g0.quest)}{uses}</span>
          {select && <span className={`pk ${picked ? "on" : ""}`}>{picked && <Icon name="check" />}</span>}
          {!select && (
            <div className="pc2x">
              {isOwner && <button onClick={onEdit} title="Edit hunt record" aria-label="Edit hunt record"><Icon name="edit" /></button>}
              <button onClick={onShare} title="Copy link" aria-label="Copy link"><Icon name="link" /></button>
              {isOwner && <button className="dl" onClick={onDelete} title="Delete hunt record" aria-label="Delete hunt record"><Icon name="trash" /></button>}
            </div>
          )}
        </div>
        <div className="aH2">
          <span className="aN">{group.length} crown{group.length === 1 ? "" : "s"}</span>
          {prim && (
            <span className="aPm" title={`This quest is for ${prim.inv_monster_name}. The crowns were found along the way.`}>
              {prim.inv_monster_image && <Image src={`/monsters/${prim.inv_monster_image}`} alt="" width={20} height={20} unoptimized className="px" />}
              {prim.inv_monster_name}
            </span>
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
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [select, setSelect] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const { openSettings: showSettings } = useSettings();

  useEffect(() => {
    if (openSettings && isOwner) showSettings();
  }, [openSettings, isOwner, showSettings]);
  const [col, setCol] = useState(() => Object.fromEntries(collection.map((c) => [c.monster_id, c.type])));
  const [wish, setWish] = useState(() => Object.fromEntries(wishlist.map((w) => [w.monster_id, w.type])));

  const groups = useMemo(() => groupCrowns(crowns), [crowns]);
  const list = groups.filter((g) => filter === "All" || (filter === "Small" && g.some((c) => c.type === "small")) || (filter === "Large" && g.some((c) => c.type === "large")) || (filter === "Tempered" && g.some((c) => c.tempered)));
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
  const copy = (v) => { navigator.clipboard?.writeText(v).catch(() => {}); toast.info("Copied to your clipboard."); };
  const copyCrowns = async (useEmojis = true) => {
    const shareId = `${nonce()}-${Math.random().toString(36).slice(2, 8)}`;
    const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(user.id)}?share=${shareId}`;
    const copied = await copyText(formatCrownShare(crowns, profileUrl, useEmojis));
    if (copied) toast.success("All crowns copied to your clipboard.");
    else toast.error("Could not copy crowns. Check clipboard permissions and try again.");
  };

  const allPicked = list.length > 0 && list.every((g) => picked.has(keyOf(g)));
  const tabs = [["Crowns", crowns.length], ["Collected", Object.values(col).filter(Boolean).length], ["Wishlist", Object.values(wish).filter(Boolean).length]];

  const sizes = (map, noun) => {
    const have = allMonsters.filter((m) => map[m.id]), lack = allMonsters.filter((m) => !map[m.id]);
    const card = (m) => <SizeCard key={m.id} m={m} type={map[m.id]} isOwner={isOwner} onToggle={toggleSize} noun={noun} />;
    const tip = isOwner
      ? (noun === "collected" ? "Choose the crown sizes you have collected for each monster. Others use this to see what you can host." : "Choose the crown sizes you are looking for. Hosts can find you in searches.")
      : `The crown sizes ${user.username} has ${noun}.`;
    return (
      <>
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
          <div className="pf-copy">
            <button className="btn o sm" onClick={() => copyCrowns(true)} title="Copy all crowns with MH Wilds emotes"><Icon name="copy" />Copy crowns</button>
            <details className="pf-copy-more" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }}>
              <summary className="btn o sm pf-copy-trigger" aria-label="More copy formats" title="More copy formats"><Icon name="down" /></summary>
              <div className="pf-copy-menu" role="group" aria-label="Copy format">
                <button className="pf-copy-option" type="button" onClick={(e) => { copyCrowns(false); e.currentTarget.closest("details").open = false; }}>Plain text</button>
              </div>
            </details>
          </div>
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
                  <div className="m2ch" role="group" aria-label="Filter crowns">{FILTERS.map((x) => <button key={x} aria-pressed={filter === x} onClick={() => { setFilter(x); setPage(1); }}>{x}</button>)}</div>
                  <span className="ptc">{list.length} hunt record{list.length === 1 ? "" : "s"}</span>
                  <span className="sp" />
                  {isOwner && (select ? (
                    <>
                      <span className="selc">{picked.size} selected</span>
                      <button className="tbx" onClick={() => setPicked(allPicked ? new Set() : new Set(list.map(keyOf)))}>{allPicked ? "Clear all" : "Select all"}</button>
                      <button className="tbx danger" disabled={!picked.size} onClick={() => del(list.filter((g) => picked.has(keyOf(g))))}><Icon name="trash" />Delete</button>
                      <button className="tbx" onClick={() => { setSelect(false); setPicked(new Set()); }}>Cancel</button>
                    </>
                  ) : <button className="tbx" onClick={() => setSelect(true)}><Icon name="check" />Select</button>)}
                </div>
                {list.length ? (
                  <div className="ggrid">
                    {shown.map((g) => (
                      <HuntRecord key={keyOf(g)} group={g} isOwner={isOwner} select={select} picked={picked.has(keyOf(g))}
                        onPick={() => setPicked((p) => { const n = new Set(p); if (n.has(keyOf(g))) n.delete(keyOf(g)); else n.add(keyOf(g)); return n; })}
                        onEdit={() => openLog({ group: g })} onDelete={() => del([g])} onShare={() => share(g)} onTile={openDrawer} />
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
