"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import UserAvatar from "@/components/ui/UserAvatar";

const PAGE_SIZE = 12;

export default function WishlistUserPickerModal({
  isOpen,
  onClose,
  onSelect,
  title,
  excludeUserId,
}) {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (excludeUserId) params.set("exclude", excludeUserId);
    return `/api/wishlist/users?${params.toString()}`;
  }, [page, debouncedQuery, excludeUserId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        setUsers(data.users || []);
        setTotal(Number(data.total || 0));
        setTotalPages(Number(data.totalPages || 1));
      } catch (error) {
        if (!cancelled) {
          setUsers([]);
          setTotal(0);
          setTotalPages(1);
        }
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [endpoint, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onEsc(e) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, excludeUserId]);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="animate-mh-slide-down flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-void-raised shadow-lift" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-mist">{title || "Select Hunter"}</h2>
          <button type="button" onClick={onClose} aria-label="Close picker" className="flex h-8 w-8 items-center justify-center rounded-lg text-mist-dim hover:bg-white/5 hover:text-mist">×</button>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all hunters..."
            className="w-full rounded-lg border border-white/10 bg-void px-3.5 py-2.5 font-body text-sm text-mist placeholder:text-mist-faint focus:border-ember/50 focus:outline-none"
          />

          <p className="font-body text-xs text-mist-dim">
            {loading ? "Loading hunters..." : `${total} hunters found`}
          </p>

          {users.length === 0 && !loading ? (
            <p className="py-8 text-center font-body text-sm text-mist-dim">No matching hunters found.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-void px-3 py-2.5 text-left transition-colors hover:border-ember/30 hover:bg-white/5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar
                      src={user.avatar_url}
                      alt={user.username || `Hunter ${String(user.id).slice(0, 4)}`}
                      size={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-body text-sm font-medium text-mist">{user.username || `Hunter ${String(user.id).slice(0, 4)}`}</span>
                      <span className="block truncate font-body text-xs text-mist-dim">{user.crown_count || 0} crowns • {user.wishlist_count || 0} wishlist</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-body text-xs text-ember-dim">Pick</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-4">
          <span className="font-body text-xs text-mist-dim">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={!canPrev || loading} className="rounded-lg border border-white/10 px-3 py-1.5 font-body text-xs text-mist disabled:opacity-30">
              Previous
            </button>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!canNext || loading} className="rounded-lg border border-white/10 px-3 py-1.5 font-body text-xs text-mist disabled:opacity-30">
              Next
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
