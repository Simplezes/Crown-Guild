"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import WishlistUserPickerModal from "@/components/ui/WishlistUserPickerModal";

export default function CompareWithButton({ baseUserId, baseUsername, variant = "default", className }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className || `flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-mist transition-colors hover:border-ember/40 hover:text-ember-bright ${variant === "default" ? "w-full" : ""}`}
        onClick={() => setOpen(true)}
      >
        <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={16} height={16} alt="" className="pixel-art" />
        <span>Compare With</span>
      </button>

      <WishlistUserPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        excludeUserId={baseUserId}
        title={`Compare ${baseUsername || "Hunter"} with...`}
        onSelect={(selectedUser) => {
          if (!selectedUser?.id) return;
          router.push(`/compare?a=${encodeURIComponent(baseUserId)}&b=${encodeURIComponent(selectedUser.id)}`);
        }}
      />
    </>
  );
}
