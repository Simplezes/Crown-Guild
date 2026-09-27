"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/UIProvider";
import { Icon } from "@/components/shell/Icon";

export default function TrackPin({ monsterId, name, initialType, trigger = "pin", up = false, onChange }) {
  const router = useRouter();
  const toast = useToast();
  const wrap = useRef(null);
  const btn = useRef(null);
  const menu = useRef(null);
  const [pos, setPos] = useState(null);
  const [type, setType] = useState(initialType || null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (wrap.current?.contains(e.target) || menu.current?.contains(e.target)) return;
      setOpen(false);
    };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const W = 250, H = 190;
    const below = up ? false : r.bottom + H + 12 < window.innerHeight;
    const left = trigger === "btn" || trigger === "btn-o" ? r.left : r.right - W;
    setPos({
      left: Math.max(8, Math.min(left, window.innerWidth - W - 8)),
      ...(below ? { top: r.bottom + 8 } : { bottom: window.innerHeight - r.top + 8 }),
    });
  }, [open, up, trigger]);

  const has = (k) => type === "both" || type === k;

  const toggle = async (k) => {
    if (busy) return;
    const other = k === "small" ? "large" : "small";
    const next = has(k) ? (has(other) ? other : null) : has(other) ? "both" : k;
    const prev = type;
    setBusy(true);
    setType(next);
    onChange?.(next);
    try {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsterId, type: next }),
      });
      if (!res.ok) throw new Error();
      toast.info(`${name}: ${has(k) ? "stopped tracking" : "tracking"} the ${k} crown.`);
      router.refresh();
    } catch {
      setType(prev);
      onChange?.(prev);
      toast.error("Could not update your targets.");
    } finally {
      setBusy(false);
    }
  };

  const label = type ? `Tracking ${type === "both" ? "small and large" : type} crown` : `Track ${name}`;
  const btnProps = {
    "aria-pressed": !!type,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-label": label,
    title: label,
    onClick: (e) => { e.stopPropagation(); setOpen((v) => !v); },
  };

  const summary = type === "both" ? "Small + Large" : type === "small" ? "Small only" : type === "large" ? "Large only" : "Not tracking";
  const cls = trigger === "h5b" ? "h5b" : trigger === "d2pin" ? "d2pin" : trigger === "pin" ? "m2p" : trigger === "btn-o" ? "btn o" : "btn sm";
  const labelled = trigger === "btn" || trigger === "btn-o";

  return (
    <div className="tpin" ref={wrap} onClick={(e) => e.stopPropagation()}>
      <button ref={btn} className={cls} {...btnProps}>
        {labelled ? (<><Icon name="pin" />{type ? "Tracking" : "Track target"}</>) : <Icon name="pin" />}
      </button>
      {open && pos && createPortal(
        <div className="tmenu" ref={menu} style={pos} role="menu" aria-label="Track crown sizes">
          <div className="tm-h"><b>Track crowns</b><span>{summary}</span></div>
          {["small", "large"].map((k) => (
            <button key={k} role="menuitemcheckbox" aria-checked={has(k)} className={`tm-o ${has(k) ? "on" : ""}`} disabled={busy} onClick={() => toggle(k)}>
              <span className="tm-i"><Image src={`/icons/${k}crown.png`} alt="" width={20} height={20} className="px" /></span>
              <span className="tm-t"><b>{k === "small" ? "Small crown" : "Large crown"}</b><small>{has(k) ? "Tracking" : "Not tracking"}</small></span>
              <span className="tm-c">{has(k) && <Icon name="check" />}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
