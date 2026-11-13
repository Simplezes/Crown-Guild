"use client";

import { useEffect, useState } from "react";
import type { UserListing } from "@/server/services/compare";
import { Icon } from "@/shared/ui";
import type { CompareSide } from "../types";
import { HunterAvatar } from "./HunterAvatar";

interface HunterPickerProps {
  side: string;
  exclude: string | undefined;
  onPick: (hunter: CompareSide) => void;
  onClose: () => void;
}

export function HunterPicker({ side, exclude, onPick, onClose }: HunterPickerProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserListing[] | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ limit: "12" });
      if (query.trim()) params.set("q", query.trim());
      if (exclude) params.set("exclude", exclude);
      fetch(`/api/wishlist/users?${params}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ users?: UserListing[] }>)
        .then((data) => alive && setUsers(data.users || []))
        .catch(() => alive && setUsers([]));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, exclude]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ovl">
      <div
        className="mback pb enter"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div
          className="pal cmp-picker"
          role="dialog"
          aria-modal="true"
          aria-label={`Select Hunter ${side}`}
        >
          <div className="hpkh">
            <b>Select Hunter {side}</b>
            <button className="x2" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <label className="pin">
            <Icon name="search" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hunters"
              aria-label="Search hunters"
              autoComplete="off"
            />
          </label>
          <div className="plist">
            <div className="pg">Hunters</div>
            {users === null ? (
              <div className="cmp-no-users">Loading…</div>
            ) : users.length === 0 ? (
              <div className="cmp-no-users">No hunters match. Try another name.</div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="pi"
                  onClick={() =>
                    onPick({
                      id: String(user.id),
                      name: user.username,
                      avatar: user.avatar_url || null,
                    })
                  }
                >
                  <HunterAvatar
                    hunter={{ name: user.username, avatar: user.avatar_url }}
                    className="cmp-pick-avatar"
                  />
                  <span className="cmp-pick-copy">
                    <b>{user.username}</b>
                    <small>
                      {user.crown_count} crowns &middot; {user.wishlist_count} wishlisted
                    </small>
                  </span>
                  <Icon name="check" />
                </button>
              ))
            )}
          </div>
          <div className="pfoot">
            <span>Choose a hunter to compare</span>
            <span>
              <kbd>Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
