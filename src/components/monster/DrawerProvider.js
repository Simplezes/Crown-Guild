"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Icon } from "@/components/shell/Icon";
import TrackPin from "@/components/registry/TrackPin";
import UserAvatar from "@/components/ui/UserAvatar";
import { useLog } from "@/components/log/LogProvider";

const DrawerContext = createContext({ openDrawer: () => {} });
export const useDrawer = () => useContext(DrawerContext);

const cache = new Map();

function Crown({ kind, label, n }) {
  return (
    <div className={`d2c ${n ? "on" : ""}`}>
      <span className="d2ci"><Image src={`/icons/${kind}crown.png`} alt="" width={22} height={22} className="px" /></span>
      <div className="d2ct"><b>{label}</b><span>{n ? `${n} logged` : "Not logged yet"}</span></div>
      <span className="d2cn">{n}</span>
    </div>
  );
}

function Drawer({ name, onClose }) {
  const { openLog } = useLog();
  const [data, setData] = useState(() => cache.get(name) || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/monster-summary?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { cache.set(name, d); if (alive) setData(d); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [name]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const href = `/monster/${encodeURIComponent(name)}`;
  const d = data;

  return (
    <div className="ovl">
      <div className="dback enter" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <aside className="drawer d2" role="dialog" aria-label={name}>
          <header className="d2h">
            <span>Monster</span>
            <div className="d2hb">
              <Link className="d2op" href={href} onClick={onClose}>Open full page<Icon name="open" /></Link>
              <button className="x" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
            </div>
          </header>
          <div className="d2b">
            <section className="d2hero">
              <div className="d2art">{d?.image_name && <Image src={`/monsters/${d.image_name}`} alt="" width={120} height={120} unoptimized className="px" />}</div>
              <div className="d2id"><h2>{name}</h2><span className="d2ty">{d?.type || (failed ? "Unavailable" : "Loading")}</span></div>
            </section>
            {d && (
              <>
                <section className="d2st">
                  <div><b className="dm">{d.demand}</b><span>Seeking</span></div>
                  <div><b>{d.hostCount.small}</b><span>Small hosts</span></div>
                  <div><b>{d.hostCount.large}</b><span>Large hosts</span></div>
                </section>
                {d.signedIn && (
                  <section className="d2s"><h3>Your crowns</h3>
                    <div className="d2cs"><Crown kind="small" label="Small crown" n={d.mine.s} /><Crown kind="large" label="Large crown" n={d.mine.l} /></div>
                  </section>
                )}
                <section className="d2s"><h3>Physiology</h3>
                  <div className="d2p">
                    <div><small>Element</small><span className="pl">{d.elements.length ? d.elements.join(", ") : "None"}</span></div>
                    <div><small>Weak to</small>
                      <div className="pills2">{d.weakness.length ? d.weakness.map((x) => <span key={x} className="pl w">{x}</span>) : <span className="pl">Unknown</span>}</div>
                    </div>
                  </div>
                </section>
                <section className="d2s"><h3>Hosts <em>{d.hostCount.small + d.hostCount.large} total</em></h3>
                  <div className="d2hs">
                    {d.hosts.map((h, i) => (
                      <Link key={i} className="d2ho" href={`${href}?user=${h.user_id}`} onClick={onClose}>
                        <UserAvatar src={h.avatar_url} alt={h.username || "?"} size={38} className="d2av" />
                        <div className="d2hn"><b>{h.username}</b><span>{h.strength_rating}★ &middot; {h.type === "large" ? "Large" : "Small"}{h.tempered ? " · Tempered" : ""}{h.remaining_uses != null ? ` · ${h.remaining_uses} left` : ""}</span></div>
                        <span className="d2ct2"><Icon name="open" /></span>
                      </Link>
                    ))}
                    {d.hosts.length === 0 && <p className="ptip" style={{ margin: 0 }}>No hosts yet.</p>}
                  </div>
                  <Link className="d2more" href={href} onClick={onClose}>See all hosts</Link>
                </section>
              </>
            )}
          </div>
          <footer className="d2f">
            {d?.signedIn ? (
              <>
                <button className="btn" onClick={() => { onClose(); openLog({ monsterId: d.id }); }}><Icon name="plus" />Log {name} crown</button>
                <TrackPin trigger="d2pin" up monsterId={d.id} name={name} initialType={d.wishlistType} />
              </>
            ) : d ? (
              <button className="btn" onClick={() => signIn("discord")}>Sign in to log</button>
            ) : null}
          </footer>
        </aside>
      </div>
    </div>
  );
}

export function DrawerProvider({ children }) {
  const [name, setName] = useState(null);
  const openDrawer = useCallback((n) => setName(n), []);
  const close = useCallback(() => setName(null), []);
  return (
    <DrawerContext.Provider value={{ openDrawer }}>
      {children}
      {name && <Drawer key={name} name={name} onClose={close} />}
    </DrawerContext.Provider>
  );
}
