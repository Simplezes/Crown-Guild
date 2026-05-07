"use client";

import { useRouter } from "next/navigation";
import styles from "./CompareWithButton.module.css";
import Image from "next/image";
import { useState } from "react";
import WishlistUserPickerModal from "@/components/ui/WishlistUserPickerModal";

export default function CompareWithButton({ baseUserId, baseUsername }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button type="button" className={`mh-button ${styles.compareBtn}`} onClick={() => setOpen(true)}>
        <Image src="/icons/MHWilds-Communication_Menu_Icon.png" width={15} height={15} alt="" className="pixel-art" />
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
