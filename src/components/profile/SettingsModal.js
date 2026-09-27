"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useToast } from "@/app/UIProvider";
import { Icon } from "@/components/shell/Icon";

export default function SettingsModal({ user, rank, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const initial = {
    lobby: user.lobby_id || "",
    pass: user.quest_password || "",
    status: user.status_message || "",
    dms: user.receive_dms === undefined || user.receive_dms === null ? true : !!Number(user.receive_dms),
  };
  const [saved, setSaved] = useState(initial);
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobby_id: d.lobby.trim(), quest_password: d.pass.trim(), status_message: d.status.trim(), receive_dms: d.dms }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not save your settings.");
        return;
      }
      setSaved(d);
      toast.success("Settings saved.");
      router.refresh();
      onClose();
    } catch {
      toast.error("Could not save your settings.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (!res.ok) throw new Error();
      signOut({ callbackUrl: "/" });
    } catch {
      setBusy(false);
      toast.error("Could not delete your account.");
    }
  };

  return (
    <div className="ovl">
      <div className="mback sb2 enter" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="mform sm st" role="dialog" aria-label="Hunter settings">
          <div className="sthd">
            <div className="sav"><span>{(user.username || "?").slice(0, 2).toUpperCase()}</span></div>
            <div className="stt"><h2>Hunter settings</h2><p>{user.username} &middot; {rank.title}</p></div>
            <button className="x2" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
          <div className="stbody">
            <section className="stsec">
              <div className="sth"><span className="sti"><Icon name="flag" /></span><div><b>Lobby</b><small>Shown on your profile so hosts can join you.</small></div></div>
              <div className="fld2"><label htmlFor="sf1">Default session ID</label>
                <input id="sf1" value={d.lobby} onChange={(e) => set("lobby", e.target.value)} placeholder="e.g. 999DT8L8" maxLength={64} autoComplete="off" spellCheck={false} /></div>
              <div className="fld2"><label htmlFor="sf2">Quest password</label>
                <input id="sf2" value={d.pass} onChange={(e) => set("pass", e.target.value.replace(/\D/g, ""))} placeholder="4 digits, e.g. 1234" inputMode="numeric" maxLength={4} autoComplete="off" /></div>
            </section>
            <section className="stsec">
              <div className="sth"><span className="sti"><Icon name="chat" /></span><div><b>Status</b><small>A short note other hunters see under your name.</small></div></div>
              <div className="fld2"><label htmlFor="sf3">Status message</label>
                <input id="sf3" value={d.status} onChange={(e) => set("status", e.target.value)} placeholder="Hunting Rathalos tonight..." maxLength={120} autoComplete="off" />
                <span className="cnt2">{d.status.length}/120</span></div>
            </section>
            <section className="stsec">
              <div className="strow"><div><b>Discord DMs</b><small>Let other hunters contact you through Discord.</small></div>
                <button className="sw" role="switch" aria-checked={d.dms} aria-label="Receive Discord DMs" onClick={() => set("dms", !d.dms)} /></div>
            </section>
            <section className="stsec dz2">
              <div className="strow"><div><b>Delete account</b><small>Permanently remove your data from the Guild Registry.</small></div>
                {!confirmDelete && <button className="tbx danger" onClick={() => setConfirmDelete(true)}>Delete</button>}</div>
              {confirmDelete && (
                <div className="dzc"><span>This deletes your account and all your crowns. Are you sure?</span>
                  <div><button className="tbx" onClick={() => setConfirmDelete(false)}>Keep account</button><button className="tbx danger solid" disabled={busy} onClick={remove}>Yes, delete</button></div></div>
              )}
            </section>
          </div>
          <div className="stft">
            <span className="stn">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
            <button className="tbx" onClick={onClose}>{dirty ? "Discard" : "Close"}</button>
            <button className="tbx pri" disabled={!dirty || busy} onClick={save}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
