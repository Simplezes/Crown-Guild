"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./WishlistUserPickerModal.module.css";

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} animate-mh-slide-down`} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title || "Select Hunter"}</h2>
          <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Close picker">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all hunters..."
            />
          </div>

          <p className={styles.meta}>
            {loading ? "Loading hunters..." : `${total} hunters found`}
          </p>

          {users.length === 0 && !loading ? (
            <p className={styles.empty}>No matching hunters found.</p>
          ) : (
            <div className={styles.list}>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={styles.userCard}
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                >
                  <span className={styles.userMain}>
                    <Image
                      src={user.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                      alt=""
                      width={36}
                      height={36}
                      className={styles.avatar}
                    />
                    <span className={styles.userInfo}>
                      <span className={styles.username}>{user.username || `Hunter ${String(user.id).slice(0, 4)}`}</span>
                      <span className={styles.count}>{user.crown_count || 0} crowns • {user.wishlist_count || 0} wishlist</span>
                    </span>
                  </span>
                  <span className={styles.pickTag}>Pick</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.pageLabel}>Page {page} of {totalPages}</span>
          <div className={styles.pager}>
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={!canPrev || loading}>
              Previous
            </button>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!canNext || loading}>
              Next
            </button>
          </div>
        </footer>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
