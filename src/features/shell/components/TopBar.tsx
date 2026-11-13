"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLog } from "@/features/crowns";
import { Emblem, Icon, UserAvatar } from "@/shared/ui";
import { NAV, type ShellSummary, type ShellUser } from "../types";
import { usePalette } from "../palette/PaletteProvider";
import { AccountMenu } from "./AccountMenu";
import { BottomNav, MobileTitle } from "./MobileBars";
import { TargetsMenu } from "./TargetsMenu";

interface TopBarProps {
  user: ShellUser | null;
  summary: ShellSummary | null;
}

const isTyping = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return !!element && (/input|select|textarea/i.test(element.tagName) || element.isContentEditable);
};

export function TopBar({ user, summary }: TopBarProps) {
  const pathname = usePathname() || "/";
  const [menu, setMenu] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const { openLog } = useLog();
  const { openPalette } = usePalette();
  const accountRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!accountRef.current?.contains(target) && !mobileRef.current?.contains(target))
        setMenu(false);
      if (targetsRef.current && !targetsRef.current.contains(target)) setTargetsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        setTargetsOpen(false);
      }
      const plain = !event.metaKey && !event.ctrlKey && !event.altKey;
      if (user && plain && !isTyping(event.target) && event.key.toLowerCase() === "l") openLog();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [user, openLog]);

  const toggleMenu = () => {
    setMenu((value) => !value);
    setTargetsOpen(false);
  };

  return (
    <>
      <div className="bar2">
        <Link className="brand" href="/">
          <Image src="/icon.png" alt="" width={32} height={32} priority />
          Crown Guild
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={item.match(pathname) ? "on" : ""}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="cmdk" onClick={openPalette}>
          <Icon name="search" />
          <span className="lbl">Search monsters or actions</span>
          <kbd>Ctrl K</kbd>
        </button>

        {user && summary ? (
          <>
            <TargetsMenu
              ref={targetsRef}
              summary={summary}
              open={targetsOpen}
              onToggle={() => {
                setTargetsOpen((value) => !value);
                setMenu(false);
              }}
              onClose={() => setTargetsOpen(false)}
            />
            <button className="btn sm" onClick={() => openLog()}>
              <Image src="/icons/largecrown.png" alt="" width={16} height={16} className="px" />
              Log a crown<kbd>L</kbd>
            </button>
            <div className="avwrap" ref={accountRef}>
              <button
                className="uchip"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label={`Account menu. ${summary.title}, ${summary.mp} MP`}
                onClick={toggleMenu}
              >
                <UserAvatar src={user.image} alt={user.name} size={36} className="uav" />
                <span className="ut">
                  <b>{user.name}</b>
                  <span className="ur">
                    <span className="emb">
                      <Emblem rank={summary.rank} />
                    </span>
                    {summary.title} &middot; {summary.mp} MP
                  </span>
                </span>
                <svg className="ui" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M5.6 8.6L12 15l6.4-6.4-1.8-1.8L12 11.4 7.4 6.8z"
                    transform="translate(0 1.4)"
                  />
                </svg>
              </button>
              {menu && <AccountMenu user={user} summary={summary} onClose={() => setMenu(false)} />}
            </div>
          </>
        ) : (
          <Link className="btn sm" href={signInHref}>
            Sign in with Discord
          </Link>
        )}
      </div>

      <MobileTitle
        ref={mobileRef}
        pathname={pathname}
        user={user}
        summary={summary}
        signInHref={signInHref}
        menuOpen={menu}
        onToggleMenu={toggleMenu}
        onCloseMenu={() => setMenu(false)}
        onSearch={openPalette}
      />
      <BottomNav pathname={pathname} user={user} signInHref={signInHref} onLog={() => openLog()} />
    </>
  );
}
