"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useToast, useConfirm } from "@/app/UIProvider";
import Toggle from "@/components/ui/Toggle";

const inputClass = "w-full rounded-lg border border-white/10 bg-void px-3.5 py-2.5 font-body text-sm text-mist placeholder:text-mist-faint focus:border-ember/50 focus:outline-none";

export default function SettingsForm({ initialData }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [formData, setFormData] = useState(initialData);
  const [status, setStatus] = useState("idle");
  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggle = () => {
    setFormData(prev => ({
      ...prev,
      receive_dms: prev.receive_dms === 1 ? 0 : 1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedPassword = String(formData.quest_password || "").trim();
    if (normalizedPassword !== "" && !/^\d{4}$/.test(normalizedPassword)) {
      setValidationError("Quest Password must be exactly 4 digits (numbers only).");
      setStatus("error");
      return;
    }

    setValidationError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setValidationError(data?.error || "");
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm(
      "This will permanently delete your account, all your crowns, and your mission history. This action cannot be undone.",
      { title: "Delete Account", danger: true, confirmLabel: "Delete My Account" }
    );
    if (!ok) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account. Please try again.");
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting your account.");
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="rounded-2xl border border-white/5 bg-void-panel p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <Image src="/icons/MHWilds-Lobby_Icon.png" width={20} height={20} alt="" className="pixel-art" />
          <h2 className="font-display text-sm uppercase tracking-widest text-mist">Lobby Configuration</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Lobby ID (Session ID)</label>
            <input
              type="text"
              name="lobby_id"
              value={formData.lobby_id || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. 7fKx-abc..."
            />
            <span className="font-body text-xs text-mist-faint">Hunters will use this to join your session.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Quest Password</label>
            <input
              type="text"
              name="quest_password"
              value={formData.quest_password || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="4-digit password (leave blank if public)"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
            />
            <span className="font-body text-xs text-mist-faint">If set, this must be exactly 4 digits.</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-void-panel p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={20} height={20} alt="" className="pixel-art" />
          <h2 className="font-display text-sm uppercase tracking-widest text-mist">Communications</h2>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-void px-4 py-3.5">
          <div>
            <label className="font-body text-sm text-mist">Receive Discord Direct Messages</label>
            <p className="mt-0.5 font-body text-xs text-mist-faint">Reserved for future contact features.</p>
          </div>
          <Toggle checked={formData.receive_dms === 1} onChange={handleToggle} labelOn="On" labelOff="Off" />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === "loading"} className="rounded-lg bg-ember px-6 py-2.5 font-display text-xs uppercase tracking-widest text-void transition-colors hover:bg-ember-bright disabled:opacity-50">
          {status === "loading" ? "Saving..." : status === "success" ? "Saved!" : "Save Settings"}
        </button>
        {status === "error" && <span className="font-body text-xs text-blood-bright">{validationError || "Failed to save settings."}</span>}
      </div>

      <section className="rounded-2xl border border-blood/20 bg-blood/5 p-6">
        <div className="mb-2 flex items-center gap-2.5">
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={20} height={20} alt="" className="pixel-art" />
          <h2 className="font-display text-sm uppercase tracking-widest text-blood-bright">Danger Zone</h2>
        </div>
        <p className="mb-4 font-body text-xs text-mist-dim">Permanently remove your data from the Guild Registry.</p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={status === "loading"}
          className="rounded-lg border border-blood/40 px-4 py-2 font-body text-xs font-semibold text-blood-bright transition-colors hover:bg-blood/10 disabled:opacity-50"
        >
          Delete Account
        </button>
      </section>
    </form>
  );
}
