"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/shared/providers";
import { Icon } from "@/shared/ui";

type Trigger = "pin" | "btn" | "btn-o" | "h5b" | "d2pin";
type Kind = "small" | "large";

const MENU_WIDTH = 250;
const MENU_HEIGHT = 190;

const TRIGGER_CLASS: Record<Trigger, string> = {
  h5b: "h5b",
  d2pin: "d2pin",
  pin: "m2p",
  "btn-o": "btn o",
  btn: "btn sm",
};

interface TrackPinProps {
  monsterId: number;
  name: string;
  initialType?: string | null;
  trigger?: Trigger;
  up?: boolean;
  noIcon?: boolean;
  onChange?: (type: string | null) => void;
}

function nextType(type: string | null, kind: Kind): string | null {
  const other: Kind = kind === "small" ? "large" : "small";
  const has = (k: Kind) => type === "both" || type === k;
  if (has(kind)) return has(other) ? other : null;
  return has(other) ? "both" : kind;
}

function summaryOf(type: string | null): string {
  if (type === "both") return "Small + Large";
  if (type === "small") return "Small only";
  if (type === "large") return "Large only";
  return "Not tracking";
}

export function TrackPin({
  monsterId,
  name,
  initialType,
  trigger = "pin",
  up = false,
  noIcon = false,
  onChange,
}: TrackPinProps) {
  const router = useRouter();
  const toast = useToast();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [type, setType] = useState<string | null>(initialType || null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const down = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrap.current?.contains(target) || menu.current?.contains(target)) return;
      setOpen(false);
    };
    const key = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
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
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    const below = up ? false : rect.bottom + MENU_HEIGHT + 12 < window.innerHeight;
    const left = trigger === "btn" || trigger === "btn-o" ? rect.left : rect.right - MENU_WIDTH;
    setPosition({
      left: Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8)),
      ...(below ? { top: rect.bottom + 8 } : { bottom: window.innerHeight - rect.top + 8 }),
    });
  }, [open, up, trigger]);

  const has = (kind: Kind) => type === "both" || type === kind;

  const toggle = async (kind: Kind) => {
    if (busy) return;
    const previous = type;
    const next = nextType(type, kind);
    setBusy(true);
    setType(next);
    onChange?.(next);
    try {
      const response = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsterId, type: next }),
      });
      if (!response.ok) throw new Error();
      toast.info(`${name}: ${has(kind) ? "stopped tracking" : "tracking"} the ${kind} crown.`);
      router.refresh();
    } catch {
      setType(previous);
      onChange?.(previous);
      toast.error("Could not update your targets.");
    } finally {
      setBusy(false);
    }
  };

  const label = type
    ? `Tracking ${type === "both" ? "small and large" : type} crown`
    : `Track ${name}`;
  const labelled = trigger === "btn" || trigger === "btn-o";

  return (
    <div className="tpin" ref={wrap} onClick={(event) => event.stopPropagation()}>
      <button
        ref={button}
        className={TRIGGER_CLASS[trigger]}
        aria-pressed={!!type}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {labelled ? (
          <>
            {!noIcon && <Icon name="pin" />}
            {type ? "Tracking" : "Track target"}
          </>
        ) : (
          <Icon name="pin" />
        )}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            className="tmenu"
            ref={menu}
            style={position}
            role="menu"
            aria-label="Track crown sizes"
          >
            <div className="tm-h">
              <b>Track crowns</b>
              <span>{summaryOf(type)}</span>
            </div>
            {(["small", "large"] as const).map((kind) => (
              <button
                key={kind}
                role="menuitemcheckbox"
                aria-checked={has(kind)}
                className={`tm-o ${has(kind) ? "on" : ""}`}
                disabled={busy}
                onClick={() => toggle(kind)}
              >
                <span className="tm-i">
                  <Image
                    src={`/icons/${kind}crown.png`}
                    alt=""
                    width={20}
                    height={20}
                    className="px"
                  />
                </span>
                <span className="tm-t">
                  <b>{kind === "small" ? "Small crown" : "Large crown"}</b>
                  <small>{has(kind) ? "Tracking" : "Not tracking"}</small>
                </span>
                <span className="tm-c">{has(kind) && <Icon name="check" />}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
