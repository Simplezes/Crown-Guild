"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shell/Icon";

const nonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function ContactButton({ hostId, monsterId, monsterName, crownId, discordId, quest, canDeploy = false, dmsOpen = true }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const isOwn = session?.user?.id === hostId;
  const showDeploy = isOwn && canDeploy;
  const busy = status === "loading";

  useEffect(() => {
    if (!menu && !confirm) return;
    const onKey = (e) => { if (e.key === "Escape") { setMenu(false); setConfirm(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu, confirm]);

  const flash = (s, then) => {
    setStatus(s);
    setTimeout(() => { setStatus("idle"); then?.(); }, 1400);
  };

  const copyTag = () => {
    navigator.clipboard?.writeText(discordId || hostId);
    flash("copied", () => setMenu(false));
  };

  const shareLink = () => {
    const url = `${window.location.origin}/monster/${encodeURIComponent(monsterName)}?crownId=${crownId}&user=${hostId}&share=${nonce()}`;
    navigator.clipboard?.writeText(url);
    flash("shared", () => setMenu(false));
  };

  const deploy = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/crowns/deploy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crownId }) });
      const data = await res.json();
      if (res.ok) {
        flash("deployed", () => { setConfirm(false); router.refresh(); });
      } else {
        setError(data?.error || "Failed to deploy crown");
        flash("error");
      }
    } catch {
      setError("Network error");
      flash("error");
    }
  };

  if (isOwn && !showDeploy) return null;

  if (showDeploy) {
    return (
      <>
        <button className="hk-btn dep" onClick={() => setConfirm(true)} disabled={busy}
          title={quest === "Investigation Quests" ? "Spend one investigation use and mark as deployed" : "Deploy crown"}>
          <Icon name="flag" />{status === "deployed" ? "Deployed!" : "Deploy crown"}
        </button>
        {confirm && typeof document !== "undefined" && createPortal(
          <div className="cfmwrap" onClick={() => !busy && setConfirm(false)}>
            <div className="cfm" role="alertdialog" aria-label="Confirm deploy" onClick={(e) => e.stopPropagation()}>
              <span className="cfi ok"><Icon name="flag" /></span>
              <h3>Spend an investigation use?</h3>
              <p>This lowers the remaining uses for this crown by 1.</p>
              {status === "error" && <p className="cfe">{error}</p>}
              <div className="cfb">
                <button className="tbx" onClick={() => setConfirm(false)} disabled={busy}>Cancel</button>
                <button className="tbx pri" onClick={deploy} disabled={busy}>{busy ? "Working…" : "Yes, deploy"}</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (!dmsOpen) {
    return (
      <button className="hk-btn off" disabled title="This hunter has Discord DMs turned off, so they can't be contacted.">
        <Icon name="chat" />DMs closed
      </button>
    );
  }

  return (
    <>
      <button className="hk-btn" onClick={() => setMenu(true)} disabled={busy}>
        <Icon name="chat" />Contact hunter
      </button>
      {menu && typeof document !== "undefined" && createPortal(
        <div className="cfmwrap" onClick={() => setMenu(false)}>
          <div className="cfm ctm" role="dialog" aria-label="Contact options" onClick={(e) => e.stopPropagation()}>
            <div className="tm-h"><b>Contact {discordId || "hunter"}</b><button className="x2" onClick={() => setMenu(false)} aria-label="Close"><Icon name="close" /></button></div>
            <a className="tm-o" href={`https://discord.com/users/${hostId}`} target="_blank" rel="noopener noreferrer" onClick={() => setMenu(false)}>
              <span className="tm-i"><Icon name="chat" /></span>
              <span className="tm-t"><b>Discord profile</b><small>Opens Discord</small></span>
              <span className="tm-c"><Icon name="open" /></span>
            </a>
            <button className="tm-o" onClick={copyTag}>
              <span className="tm-i"><Icon name="copy" /></span>
              <span className="tm-t"><b>{status === "copied" ? "Copied!" : "Copy Discord ID"}</b><small>To add them manually</small></span>
            </button>
            <button className="tm-o" onClick={shareLink}>
              <span className="tm-i"><Icon name="link" /></span>
              <span className="tm-t"><b>{status === "shared" ? "Link copied!" : "Share this crown"}</b><small>Copy a link to it</small></span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
