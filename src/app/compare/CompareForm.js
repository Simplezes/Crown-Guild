"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import WishlistUserPickerModal from "@/components/ui/WishlistUserPickerModal";
import UserAvatar from "@/components/ui/UserAvatar";

export default function CompareForm({ initialA, initialB }) {
  const router = useRouter();
  const [a, setA] = useState(initialA || null);
  const [b, setB] = useState(initialB || null);
  const [pickAOpen, setPickAOpen] = useState(false);
  const [pickBOpen, setPickBOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!a?.id || !b?.id) return;
    router.push(`/compare?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-3 rounded-2xl border border-white/5 bg-void-panel p-5 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Hunter A</label>
          <button type="button" onClick={() => setPickAOpen(true)} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-void px-3.5 py-2.5 text-left transition-colors hover:border-ember/40">
            <span className="flex min-w-0 items-center gap-2.5">
              <UserAvatar src={a?.avatar_url} alt={a?.username || "Hunter A"} size={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
              <span className="truncate font-body text-sm text-mist">{a?.username || "Select hunter..."}</span>
            </span>
            <span className="shrink-0 font-body text-xs text-ember-dim">Pick</span>
          </button>
        </div>

        <span className="hidden pb-3 font-display text-sm text-mist-faint sm:block">vs</span>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="font-body text-xs uppercase tracking-wider text-mist-dim">Hunter B</label>
          <button type="button" onClick={() => setPickBOpen(true)} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-void px-3.5 py-2.5 text-left transition-colors hover:border-ember/40">
            <span className="flex min-w-0 items-center gap-2.5">
              <UserAvatar src={b?.avatar_url} alt={b?.username || "Hunter B"} size={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
              <span className="truncate font-body text-sm text-mist">{b?.username || "Select hunter..."}</span>
            </span>
            <span className="shrink-0 font-body text-xs text-ember-dim">Pick</span>
          </button>
        </div>

        <button type="submit" disabled={!a?.id || !b?.id} className="rounded-lg bg-ember px-6 py-2.5 font-display text-xs uppercase tracking-widest text-void transition-colors hover:bg-ember-bright disabled:opacity-40">
          Compare
        </button>
      </form>

      <WishlistUserPickerModal
        isOpen={pickAOpen}
        onClose={() => setPickAOpen(false)}
        title="Select Hunter A"
        excludeUserId={b?.id}
        onSelect={(user) => setA(user)}
      />

      <WishlistUserPickerModal
        isOpen={pickBOpen}
        onClose={() => setPickBOpen(false)}
        title="Select Hunter B"
        excludeUserId={a?.id}
        onSelect={(user) => setB(user)}
      />
    </>
  );
}
