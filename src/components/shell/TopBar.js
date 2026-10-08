"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLog } from "@/components/log/LogProvider";
import { Icon, Emblem } from "./Icon";
import { usePalette } from "./Palette";
import UserAvatar from "@/components/ui/UserAvatar";
import { useSettings } from "@/components/profile/SettingsProvider";
import { useDrawer } from "@/components/monster/DrawerProvider";

const NAV = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/investigation", label: "Monsters", icon: "monsters", match: (p) => p.startsWith("/investigation") || p.startsWith("/monster") },
  { href: "/compare", label: "Compare", icon: "compare", match: (p) => p.startsWith("/compare") },
];

function titleFor(p) {
  if (p === "/") return "Home";
  if (p.startsWith("/investigation")) return "Monsters";
  if (p.startsWith("/monster")) return "Monster";
  if (p.startsWith("/compare")) return "Compare";
  if (p.startsWith("/profile")) return "Profile";
  if (p.startsWith("/settings")) return "Settings";
  return "Crown Guild";
}

export default function TopBar({ user, summary }) {
  const pathname = usePathname() || "/";
  const [menu, setMenu] = useState(false);
  const [tmenu, setTmenu] = useState(false);
  const { openLog } = useLog();
  const { openPalette } = usePalette();
  const { openSettings } = useSettings();
  const { openDrawer } = useDrawer();
  const wrap = useRef(null);
  const twrap = useRef(null);
  const mwrap = useRef(null);
  const profileHref = user ? `/profile/${user.id}` : null;
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    const onDown = (e) => { if (!wrap.current?.contains(e.target) && !mwrap.current?.contains(e.target)) setMenu(false);
      if (twrap.current && !twrap.current.contains(e.target)) setTmenu(false); };
    const onKey = (e) => {
      if (e.key === "Escape") { setMenu(false); setTmenu(false); }
      const typing = /input|select|textarea/i.test(e.target.tagName) || e.target.isContentEditable;
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "l" || e.key === "L") && user) openLog();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [user, openLog]);


  const accountMenu = (extra) => menu && (
      <div className={`dd um ${extra}`} role="menu">
        <div className="uhd">
          <UserAvatar src={user.image} alt={user.name} size={46} className="uav lg" />
          <div><b>{user.name}</b><span>Signed in with Discord</span></div>
        </div>
        <div className="rcard">
          <span className="emb"><Emblem rank={summary.rank} /></span>
          <div className="rc"><small>Guild rank</small><b>{summary.title}</b></div>
          <div className="rn"><b>{summary.mp}</b><small>MP</small></div>
        </div>
        <div className="rprog">
          <div className="bar"><i style={{ width: `${summary.progress}%` }} /></div>
          <span>{summary.nextTitle ? `${summary.toNext} MP to ${summary.nextTitle}` : "Top rank reached"}</span>
        </div>
        <div className="us3">
          <div><b>{summary.stats.s}</b><span>Small</span></div>
          <div><b>{summary.stats.l}</b><span>Large</span></div>
          <div><b>{summary.stats.t}</b><span>Tempered</span></div>
        </div>
        <div className="sep" />
        <Link href={profileHref} role="menuitem" onClick={() => setMenu(false)}><Icon name="user" />Profile</Link>
        <button role="menuitem" onClick={() => { setMenu(false); openSettings(); }}><Icon name="settings" />Settings</button>
        <a href="https://discord.gg/mhwilds" target="_blank" rel="noopener noreferrer" role="menuitem"><Icon name="chat" />Join Discord</a>
        <div className="sep" />
        <Link href="/terms" role="menuitem" onClick={() => setMenu(false)}>Terms of Service</Link>
        <Link href="/privacy" role="menuitem" onClick={() => setMenu(false)}>Privacy Policy</Link>
        <div className="sep" />
        <button className="out" role="menuitem" onClick={() => signOut()}>Sign out</button>
      </div>
  );

  return (
    <>
      <div className="bar2">
        <Link className="brand" href="/">
          <Image src="/icon.png" alt="" width={32} height={32} priority />
          Crown Guild
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={n.match(pathname) ? "on" : ""}>
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ))}
        </nav>

        <button className="cmdk" onClick={openPalette} aria-label="Search monsters or actions">
          <Icon name="search" /><span className="lbl">Search monsters or actions</span><kbd>Ctrl K</kbd>
        </button>

        {user ? (
          <>
            <div className="avwrap" ref={twrap}>
              <button className="tbtn" aria-haspopup="true" aria-expanded={tmenu} onClick={() => { setTmenu((v) => !v); setMenu(false); }}>
                <Icon name="pin" /><span className="lbl">Targets</span><b>{summary.targets.length}</b>
              </button>
              {tmenu && (
                <div className="dd tgd" role="menu">
                  <div className="sl" style={{ paddingTop: 4 }}>Your targets</div>
                  {summary.targets.length ? summary.targets.map((t) => (
                    <a key={t.name} href="#" role="menuitem" onClick={(e) => { e.preventDefault(); setTmenu(false); openDrawer(t.name); }}>
                      <Image src={`/monsters/${t.image}`} alt="" width={28} height={28} unoptimized className="px" />{t.name}
                    </a>
                  )) : <div className="none">Nothing tracked yet. Use Track on any monster.</div>}
                </div>
              )}
            </div>
            <button className="btn sm" onClick={() => openLog()}>
              <Image src="/icons/largecrown.png" alt="" width={16} height={16} className="px" />
              Log a crown<kbd>L</kbd>
            </button>
            <div className="avwrap" ref={wrap}>
              <button
                className="uchip"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label={`Account menu. ${summary.title}, ${summary.mp} MP`}
                onClick={() => { setMenu((v) => !v); setTmenu(false); }}
              >
                <UserAvatar src={user.image} alt={user.name} size={36} className="uav" />
                <span className="ut">
                  <b>{user.name}</b>
                  <span className="ur">
                    <span className="emb"><Emblem rank={summary.rank} /></span>
                    {summary.title} &middot; {summary.mp} MP
                  </span>
                </span>
                <svg className="ui" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5.6 8.6L12 15l6.4-6.4-1.8-1.8L12 11.4 7.4 6.8z" transform="translate(0 1.4)" />
                </svg>
              </button>
              {accountMenu("")}
            </div>
          </>
        ) : (
          <Link className="btn sm" href={signInHref}>Sign in with Discord</Link>
        )}
      </div>

      <div className="mtitle">
        <div className="pt">{titleFor(pathname)}</div>
        <div className="mr">
          <button className="ib" onClick={openPalette} aria-label="Search"><Icon name="search" /></button>
          {user ? (
            <div className="avwrap" ref={mwrap}>
              <button className="mava" aria-haspopup="menu" aria-expanded={menu} aria-label={`Account menu. ${summary.title}, ${summary.mp} MP`} onClick={() => { setMenu((v) => !v); setTmenu(false); }}>
                <UserAvatar src={user.image} alt={user.name} size={36} className="ava" />
              </button>
              {accountMenu("mdd")}
            </div>
          ) : (
            <Link className="btn sm" href={signInHref}>Sign in</Link>
          )}
        </div>
      </div>

      <div className="bnav">
        <Link className={pathname === "/" ? "on" : ""} href="/"><Icon name="home" />Home</Link>
        <Link className={NAV[1].match(pathname) ? "on" : ""} href="/investigation"><Icon name="monsters" />Monsters</Link>
        {user && (
          <button className="fab" aria-label="Log a crown" onClick={() => openLog()}><Icon name="plus" /></button>
        )}
        <Link className={pathname.startsWith("/compare") ? "on" : ""} href="/compare"><Icon name="compare" />Compare</Link>
        {user ? (
          <Link className={pathname.startsWith("/profile") ? "on" : ""} href={profileHref}><Icon name="user" />Profile</Link>
        ) : (
          <Link href={signInHref}><Icon name="user" />Sign in</Link>
        )}
      </div>

    </>
  );
}
