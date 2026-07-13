"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import CrownLogModal from "@/components/crowns/CrownLogModal";

const LINKS = [
  { href: "/", label: "Hub", icon: "/icons/MHWilds-Lobby_Icon.png" },
  { href: "/investigation", label: "Ledger", icon: "/icons/MHWilds-Expedition_Record_Board_Icon.png" },
  { href: "/compare", label: "Compare", icon: "/icons/MHWilds-Squad_Information_Counter_Icon.png" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-20 flex-col items-center border-r border-white/5 bg-void-soft py-6">
        <Link href="/" className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-ember/20 bg-void">
          <Image src="/icon.png" alt="Crown Guild" width={28} height={28} priority className="pixel-art rounded" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-ember/15 text-ember-bright" : "text-mist-dim hover:bg-white/5 hover:text-mist"
                }`}
              >
                {active && <span className="absolute -left-3 h-6 w-1 rounded-full bg-ember" />}
                <Image src={l.icon} width={22} height={22} alt="" className="pixel-art opacity-90" />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-void-raised px-2.5 py-1.5 text-xs font-body text-mist opacity-0 shadow-lift transition-opacity group-hover:opacity-100">
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-3">
          {session && (
            <button
              onClick={() => setCreateOpen(true)}
              title="Create Crown"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember text-void transition-transform hover:scale-105 hover:bg-ember-bright"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          )}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen((v) => !v)} className="block rounded-xl border border-white/10 p-0.5">
                {session.user.image && (
                  <Image src={session.user.image} alt={session.user.name} width={36} height={36} unoptimized className="pixel-art rounded-lg" />
                )}
              </button>
              {isDropdownOpen && (
                <div className="absolute bottom-0 left-full ml-3 w-48 overflow-hidden rounded-xl border border-white/10 bg-void-raised shadow-lift">
                  <Link href={`/profile/${session.user.id}`} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-3 text-sm font-body text-mist hover:bg-white/5">Profile</Link>
                  <Link href={`/profile/${session.user.id}?settings=true`} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-3 text-sm font-body text-mist hover:bg-white/5">Settings</Link>
                  <button onClick={() => signOut()} className="block w-full px-4 py-3 text-left text-sm font-body text-blood-bright hover:bg-blood/10">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signIn("discord")} title="Sign In" className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember text-void hover:bg-ember-bright">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
            </button>
          )}
        </div>
      </aside>

      
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-void-soft px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Crown Guild" width={30} height={30} priority className="pixel-art rounded" />
          <span className="font-display uppercase tracking-widest text-ember">Crown Guild</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10">
            <Image src={mobileOpen ? "/icons/MHWilds-Notes_X_Icon.png" : "/icons/MHWilds-Quest_Menu_Icon.png"} width={18} height={18} alt="" className="pixel-art" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-white/5 bg-void-soft p-4 shadow-lift lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-body ${isActive(pathname, l.href) ? "bg-ember/15 text-ember-bright" : "text-mist"}`}>
                <Image src={l.icon} width={18} height={18} alt="" className="pixel-art" />
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
            {session ? (
              <>
                <button onClick={() => { setMobileOpen(false); setCreateOpen(true); }} className="flex-1 rounded-lg bg-ember py-2.5 text-center text-sm font-display uppercase tracking-wider text-void">Create Crown</button>
                <Link href={`/profile/${session.user.id}`} onClick={() => setMobileOpen(false)}>
                  {session.user.image && <Image src={session.user.image} alt="" width={36} height={36} unoptimized className="pixel-art rounded-lg" />}
                </Link>
                <button onClick={() => signOut()} className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-blood-bright">Sign Out</button>
              </>
            ) : (
              <button onClick={() => signIn("discord")} className="flex-1 rounded-lg bg-ember py-2.5 text-sm font-display uppercase tracking-wider text-void">Sign In</button>
            )}
          </div>
        </div>
      )}

      
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-white/5 bg-void-soft lg:hidden">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link key={l.href} href={l.href} className={`flex flex-col items-center gap-1 ${active ? "text-ember-bright" : "text-mist-dim"}`}>
              <Image src={l.icon} width={20} height={20} alt="" className="pixel-art" />
              <span className="text-[10px] font-body uppercase tracking-wide">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <CrownLogModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
