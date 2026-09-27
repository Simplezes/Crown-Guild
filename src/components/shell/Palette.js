"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "./Icon";
import { useLog } from "@/components/log/LogProvider";
import { useDrawer } from "@/components/monster/DrawerProvider";

const PaletteContext = createContext({ openPalette: () => {} });
export const usePalette = () => useContext(PaletteContext);

let monstersCache = null;

function Palette({ onClose }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openLog } = useLog();
  const { openDrawer } = useDrawer();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [monsters, setMonsters] = useState(monstersCache || []);
  const listRef = useRef(null);

  useEffect(() => {
    if (monstersCache) return;
    fetch("/api/monsters").then((r) => r.json()).then((d) => { monstersCache = d; setMonsters(d); }).catch(() => {});
  }, []);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const acts = [];
    if (session?.user) acts.push({ k: "a", t: "Log a crown", ic: "plus", h: "L", run: () => openLog() });
    acts.push({ k: "a", t: "Go to Home", ic: "home", h: "Page", run: () => router.push("/") });
    acts.push({ k: "a", t: "Go to Monsters", ic: "monsters", h: "Page", run: () => router.push("/investigation") });
    acts.push({ k: "a", t: "Go to Compare", ic: "compare", h: "Page", run: () => router.push("/compare") });
    const mons = (s ? monsters.filter((m) => m.name.toLowerCase().includes(s)) : monsters.slice(0, 5)).slice(0, 6)
      .map((m) => ({ k: "m", t: m.name, img: m.image_name, h: "Monster", run: () => openDrawer(m.name) }));
    return acts.filter((a) => a.t.toLowerCase().includes(s)).concat(mons);
  }, [q, monsters, session, openLog, openDrawer, router]);

  const cur = Math.min(sel, Math.max(0, items.length - 1));
  const run = (i) => { const it = items[i]; if (!it) return; onClose(); it.run(); };

  useEffect(() => {
    listRef.current?.querySelector(".pi.on")?.scrollIntoView({ block: "nearest" });
  }, [cur]);

  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel(Math.min(items.length - 1, cur + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(Math.max(0, cur - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(cur); }
  };

  let last = "";
  return (
    <div className="ovl">
      <div className="mback pb enter" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="pal" role="dialog" aria-label="Command palette" onKeyDown={onKey}>
          <div className="pin"><Icon name="search" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search monsters or actions" aria-label="Search" /></div>
          <div className="plist" ref={listRef}>
            {items.map((x, i) => {
              const grp = x.k === "a" ? "Actions" : "Monsters";
              const head = grp !== last ? <div className="pg" key={`g${grp}`}>{grp}</div> : null;
              last = grp;
              return (
                <span key={x.t} style={{ display: "contents" }}>
                  {head}
                  <button className={`pi ${i === cur ? "on" : ""}`} onMouseMove={() => setSel(i)} onClick={() => run(i)}>
                    {x.ic ? <Icon name={x.ic} /> : <Image className="px" src={`/monsters/${x.img}`} alt="" width={24} height={24} unoptimized />}
                    {x.t}<small>{x.h}</small>
                  </button>
                </span>
              );
            })}
            {items.length === 0 && <div className="pg">No results</div>}
          </div>
          <div className="pfoot"><span><kbd>↑↓</kbd>navigate</span><span><kbd>Enter</kbd>select</span><span><kbd>Esc</kbd>close</span></div>
        </div>
      </div>
    </div>
  );
}

export function PaletteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|select|textarea/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PaletteContext.Provider value={{ openPalette }}>
      {children}
      {open && <Palette onClose={close} />}
    </PaletteContext.Provider>
  );
}
