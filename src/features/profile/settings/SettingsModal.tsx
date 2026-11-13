"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { UserSettings } from "@/server/services/settings";
import { useToast } from "@/shared/providers";
import { Icon } from "@/shared/ui";
import { DangerZone, SettingsFields, type Draft } from "./SettingsSections";

interface SettingsModalProps {
  user: UserSettings;
  rank: { title: string };
  onClose: () => void;
}

export function SettingsModal({ user, rank, onClose }: SettingsModalProps) {
  const router = useRouter();
  const toast = useToast();
  const initial: Draft = {
    lobby: user.lobby_id,
    pass: user.quest_password,
    status: user.status_message,
    dms: !!Number(user.receive_dms),
  };
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobby_id: draft.lobby.trim(),
          quest_password: draft.pass.trim(),
          status_message: draft.status.trim(),
          receive_dms: draft.dms,
        }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(error.error || "Could not save your settings.");
        return;
      }
      setSaved(draft);
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
      const response = await fetch("/api/user/settings", { method: "DELETE" });
      if (!response.ok) throw new Error();
      signOut({ callbackUrl: "/" });
    } catch {
      setBusy(false);
      toast.error("Could not delete your account.");
    }
  };

  return (
    <div className="ovl">
      <div
        className="mback sb2 enter"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="mform sm st" role="dialog" aria-label="Hunter settings">
          <div className="sthd">
            <div className="sav">
              <span>{(user.username || "?").slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="stt">
              <h2>Hunter settings</h2>
              <p>
                {user.username} &middot; {rank.title}
              </p>
            </div>
            <button className="x2" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="stbody">
            <SettingsFields draft={draft} onChange={set} />
            <DangerZone
              confirming={confirmDelete}
              busy={busy}
              onAsk={() => setConfirmDelete(true)}
              onCancel={() => setConfirmDelete(false)}
              onDelete={remove}
            />
          </div>
          <div className="stft">
            <span className="stn">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
            <button className="tbx" onClick={onClose}>
              {dirty ? "Discard" : "Close"}
            </button>
            <button className="tbx pri" disabled={!dirty || busy} onClick={save}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
