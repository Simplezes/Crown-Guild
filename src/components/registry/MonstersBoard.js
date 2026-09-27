"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/shell/Icon";
import { useLog } from "@/components/log/LogProvider";
import { useDrawer } from "@/components/monster/DrawerProvider";
import Pager from "@/components/ui/Pager";
import TrackPin from "./TrackPin";

const FILTERS = ["All", "Tracked", "Complete", "Demand"];
const SORTS = {
  Demand: (a, b) => b.demand - a.demand,
  Name: (a, b) => a.name.localeCompare(b.name),
  "S. Hosts": (a, b) => b.hostCount.small - a.hostCount.small,
  "L. Hosts": (a, b) => b.hostCount.large - a.hostCount.large,
};
const CARD_W = 265, GAP = 14, CARD_H = 224, ROW_H = 64, HEAD_H = 44, BOTTOM = 84;

function Pips({ mine }) {
  return (
    <div className="m2y" title="Your crowns">
      <span className={mine.s ? "on" : ""}><Image src="/icons/smallcrown.png" alt="Small" width={18} height={18} className="px" />{mine.s}</span>
      <span className={mine.l ? "on" : ""}><Image src="/icons/largecrown.png" alt="Large" width={18} height={18} className="px" />{mine.l}</span>
    </div>
  );
}

export default function MonstersBoard({ monsters, signedIn }) {
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Demand");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [rows, setRows] = useState(0);
  const bodyRef = useRef(null);
  const [tracks, setTracks] = useState(() => Object.fromEntries(monsters.map((m) => [m.id, m.wishlistType || null])));

  useEffect(() => {
    const fit = () => {
      const el = bodyRef.current;
      if (!el) return;
      if (window.innerWidth <= 900) { setRows(0); return setSize(8); }
      const avail = window.innerHeight - (el.getBoundingClientRect().top + window.scrollY) - BOTTOM;
      if (view === "grid") {
        const cols = Math.max(1, Math.floor((el.clientWidth + GAP) / (CARD_W + GAP)));
        const r = Math.max(1, Math.floor((avail + GAP) / (CARD_H + GAP)));
        setRows(r);
        setSize(cols * r);
      } else {
        const n = Math.max(3, Math.floor((avail - HEAD_H) / ROW_H));
        setRows(n);
        setSize(n);
      }
    };
    const id = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", fit); };
  }, [view]);

  const trackOf = (m) => tracks[m.id] || null;

  const counts = useMemo(
    () => ({
      All: monsters.length,
      Tracked: monsters.filter((m) => tracks[m.id]).length,
      Complete: monsters.filter((m) => m.isCompleted).length,
      Demand: monsters.filter((m) => m.demand > 0).length,
    }),
    [monsters, tracks]
  );

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return monsters
      .filter((m) => !term || m.name.toLowerCase().includes(term) || (m.extraInfo?.type || "").toLowerCase().includes(term))
      .filter((m) => filter === "All" || (filter === "Tracked" && tracks[m.id]) || (filter === "Complete" && m.isCompleted) || (filter === "Demand" && m.demand > 0))
      .sort(SORTS[sort]);
  }, [monsters, q, filter, sort, tracks]);

  const pages = Math.max(1, Math.ceil(list.length / size));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * size, cur * size);
  const reset = (fn) => (...a) => { fn(...a); setPage(1); };
  const goPage = (n) => setPage(n);

  const pinBtn = (m) =>
    signedIn ? (
      <TrackPin monsterId={m.id} name={m.name} initialType={m.wishlistType} onChange={(t) => setTracks((p) => ({ ...p, [m.id]: t }))} />
    ) : null;

  const logBtn = (m) =>
    signedIn ? (
      <button className="lg2" onClick={(e) => { e.stopPropagation(); openLog({ monsterId: m.id }); }} aria-label={`Log a ${m.name} crown`}>
        <Icon name="plus" />Log crown
      </button>
    ) : null;

  const th = (k, label) => <button className={sort === k ? "on" : ""} onClick={reset(() => setSort(k))}>{label}</button>;

  return (
    <div className="pad m2page">
      <div className="m2h">
        <div>
          <h2>Monsters</h2>
          <p>Every crown target, what the guild has and what hunters want.</p>
        </div>
        {signedIn && (
          <div className="m2c">
            <div><b>{counts.Complete}</b><span>Complete</span></div>
            <div><b>{counts.Tracked}</b><span>Tracking</span></div>
            <div><b>{monsters.length}</b><span>Listed</span></div>
          </div>
        )}
      </div>

      <div className="m2b">
        <label className="search">
          <Icon name="search" />
          <input type="search" value={q} onChange={reset((e) => setQ(e.target.value))} placeholder="Search monsters" aria-label="Search monsters" />
          {q && <button className="x" onClick={reset(() => setQ(""))} aria-label="Clear"><Icon name="close" /></button>}
        </label>
        <div className="m2ch" role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={reset(() => setFilter(f))}>{f}<i>{counts[f]}</i></button>
          ))}
        </div>
        <span className="sp" />
        <div className="m2so">
          <span>Sort</span>
          <details className="m2sort" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }}>
            <summary className="m2sort-trigger" aria-label={`Sort monsters by ${sort}`}><span>{sort}</span><Icon name="down" /></summary>
            <div className="m2sort-menu" role="group" aria-label="Sort options">
              {Object.keys(SORTS).map((k) => (
                <button key={k} type="button" className="m2sort-option" aria-pressed={sort === k}
                  onClick={(e) => { const d = e.currentTarget.closest("details"); reset(() => setSort(k))(); d.open = false; }}>
                  <span>{k}</span>{sort === k && <Icon name="check" />}
                </button>
              ))}
            </div>
          </details>
        </div>
        <div className="vt" role="group" aria-label="View">
          <button aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Card view"><Icon name="grid" /></button>
          <button aria-pressed={view === "table"} onClick={() => setView("table")} aria-label="Table view"><Icon name="rows" /></button>
        </div>
      </div>

      <div ref={bodyRef} style={rows ? { minHeight: view === "grid" ? rows * (CARD_H + GAP) - GAP : HEAD_H + rows * ROW_H } : undefined}>
      {list.length === 0 ? (
        <div className="m2empty"><b>No monsters match</b><span>Try another filter or clear the search.</span></div>
      ) : view === "grid" ? (
        <div className="m2g">
          {shown.map((m) => (
            <div key={m.id} className={`m2 ${signedIn && m.isCompleted ? "done" : ""}`} onClick={() => openDrawer(m.name)}>
              <div className="m2t">
                <div className="m2a"><Image src={`/monsters/${m.image_name}`} alt="" width={44} height={44} unoptimized className="px" /></div>
                <div className="m2n"><b>{m.name}</b><span>{m.extraInfo?.type || "Monster"}</span></div>
                {pinBtn(m)}
              </div>
              <div className="m2s">
                <div><b className="dm">{m.demand}</b><span>Seeking</span></div>
                <div><b>{m.hostCount.small}</b><span>S. hosts</span></div>
                <div><b>{m.hostCount.large}</b><span>L. hosts</span></div>
              </div>
              <div className="m2f">{signedIn ? <Pips mine={m.mine} /> : <span />}{logBtn(m)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tbl">
          <div className="th">
            {th("Name", "Monster")}{th("Demand", "Seeking")}{th("S. Hosts", "S. hosts")}{th("L. Hosts", "L. hosts")}<span>You</span><span />
          </div>
          {shown.map((m) => (
            <div key={m.id} className="tr" onClick={() => openDrawer(m.name)}>
              <div className="m">
                <div className="mi"><Image src={`/monsters/${m.image_name}`} alt="" width={30} height={30} unoptimized className="px" /></div>
                <div style={{ minWidth: 0 }}><b>{m.name}</b><span>{m.extraInfo?.type || "Monster"}<em className="mdm">{m.demand} seeking</em></span></div>
              </div>
              <div className="c dm">{m.demand}</div>
              <div className="c sh">{m.hostCount.small}</div>
              <div className="c sh">{m.hostCount.large}</div>
              {signedIn ? <Pips mine={m.mine} /> : <div />}
              <div className="ract">{logBtn(m)}{pinBtn(m)}</div>
            </div>
          ))}
        </div>
      )}
      </div>

      <Pager page={cur} pages={pages} onPage={goPage} />
    </div>
  );
}
