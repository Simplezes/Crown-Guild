"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSettings } from "@/features/profile";
import { Emblem, Icon, UserAvatar } from "@/shared/ui";
import type { ShellSummary, ShellUser } from "../types";

interface AccountMenuProps {
  user: ShellUser;
  summary: ShellSummary;
  className?: string;
  onClose: () => void;
}

export function AccountMenu({ user, summary, className = "", onClose }: AccountMenuProps) {
  const { openSettings } = useSettings();

  return (
    <div className={`dd um ${className}`} role="menu">
      <div className="uhd">
        <UserAvatar src={user.image} alt={user.name} size={46} className="uav lg" />
        <div>
          <b>{user.name}</b>
          <span>Signed in with Discord</span>
        </div>
      </div>
      <div className="rcard">
        <span className="emb">
          <Emblem rank={summary.rank} />
        </span>
        <div className="rc">
          <small>Guild rank</small>
          <b>{summary.title}</b>
        </div>
        <div className="rn">
          <b>{summary.mp}</b>
          <small>MP</small>
        </div>
      </div>
      <div className="rprog">
        <div className="bar">
          <i style={{ width: `${summary.progress}%` }} />
        </div>
        <span>
          {summary.nextTitle ? `${summary.toNext} MP to ${summary.nextTitle}` : "Top rank reached"}
        </span>
      </div>
      <div className="us3">
        <div>
          <b>{summary.stats.s}</b>
          <span>Small</span>
        </div>
        <div>
          <b>{summary.stats.l}</b>
          <span>Large</span>
        </div>
        <div>
          <b>{summary.stats.t}</b>
          <span>Tempered</span>
        </div>
      </div>
      <div className="sep" />
      <Link href={`/profile/${user.id}`} role="menuitem" onClick={onClose}>
        <Icon name="user" />
        Profile
      </Link>
      <button
        role="menuitem"
        onClick={() => {
          onClose();
          openSettings();
        }}
      >
        <Icon name="settings" />
        Settings
      </button>
      <a
        href="https://discord.gg/mhwilds"
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
      >
        <Icon name="chat" />
        Join Discord
      </a>
      <div className="sep" />
      <Link href="/terms" role="menuitem" onClick={onClose}>
        Terms of Service
      </Link>
      <Link href="/privacy" role="menuitem" onClick={onClose}>
        Privacy Policy
      </Link>
      <div className="sep" />
      <button className="out" role="menuitem" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}
