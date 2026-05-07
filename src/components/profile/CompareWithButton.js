"use client";

import { useRouter } from "next/navigation";
import styles from "./CompareWithButton.module.css";
import Image from "next/image";
import { useState } from "react";
import WishlistUserPickerModal from "@/components/ui/WishlistUserPickerModal";

export default function CompareWithButton({ baseUserId, baseUsername, variant = "default" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isIdentity = variant === "identity";
  const containerClass = isIdentity ? styles.containerIdentity : styles.container;
  const buttonClass = isIdentity ? styles.compareBtnIdentity : styles.compareBtn;

  return (
    <div className={containerClass}>
      <button type="button" className={`mh-button ${buttonClass}`} onClick={() => setOpen(true)}>
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
    </div>
  );
}
