"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { UserAvatar, Icon } from "@/shared/ui";
import { AccountMenu } from "./AccountMenu";
import { NAV, titleFor, type ShellSummary, type ShellUser } from "../types";

interface MobileTitleProps {
  pathname: string;
  user: ShellUser | null;
  summary: ShellSummary | null;
  signInHref: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSearch: () => void;
}

export const MobileTitle = forwardRef<HTMLDivElement, MobileTitleProps>(
  function MobileTitle(props, ref) {
    const { pathname, user, summary } = props;

    return (
      <div className="mtitle">
        <div className="pt">{titleFor(pathname)}</div>
        <div className="mr">
          <button className="ib" onClick={props.onSearch} aria-label="Search">
            <Icon name="search" />
          </button>
          {user && summary ? (
            <div className="avwrap" ref={ref}>
              <button
                className="mava"
                aria-haspopup="menu"
                aria-expanded={props.menuOpen}
                aria-label={`Account menu. ${summary.title}, ${summary.mp} MP`}
                onClick={props.onToggleMenu}
              >
                <UserAvatar src={user.image} alt={user.name} size={36} className="ava" />
              </button>
              {props.menuOpen && (
                <AccountMenu
                  user={user}
                  summary={summary}
                  className="mdd"
                  onClose={props.onCloseMenu}
                />
              )}
            </div>
          ) : (
            <Link className="btn sm" href={props.signInHref}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    );
  },
);

interface BottomNavProps {
  pathname: string;
  user: ShellUser | null;
  signInHref: string;
  onLog: () => void;
}

export function BottomNav({ pathname, user, signInHref, onLog }: BottomNavProps) {
  const [, monsters, compare] = NAV;

  return (
    <div className="bnav">
      <Link className={pathname === "/" ? "on" : ""} href="/">
        <Icon name="home" />
        Home
      </Link>
      <Link className={monsters?.match(pathname) ? "on" : ""} href="/investigation">
        <Icon name="monsters" />
        Monsters
      </Link>
      {user && (
        <button className="fab" aria-label="Log a crown" onClick={onLog}>
          <Icon name="plus" />
        </button>
      )}
      <Link className={compare?.match(pathname) ? "on" : ""} href="/compare">
        <Icon name="compare" />
        Compare
      </Link>
      {user ? (
        <Link className={pathname.startsWith("/profile") ? "on" : ""} href={`/profile/${user.id}`}>
          <Icon name="user" />
          Profile
        </Link>
      ) : (
        <Link href={signInHref}>
          <Icon name="user" />
          Sign in
        </Link>
      )}
    </div>
  );
}
