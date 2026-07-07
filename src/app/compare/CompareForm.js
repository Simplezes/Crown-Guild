"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import WishlistUserPickerModal from "@/components/ui/WishlistUserPickerModal";
import styles from "./compare.module.css";

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
      <form onSubmit={handleSubmit} className={styles.compareForm}>
        <div className={styles.pickerField + " " + styles.primaryPickerField}>
          <label>Hunter A</label>
          <button type="button" className={styles.pickerBtn} onClick={() => setPickAOpen(true)}>
            <span className={styles.pickerBtnInner}>
              <Image
                src={a?.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                alt=""
                width={28}
                height={28}
                className={styles.pickerAvatar}
              />
              <span className={styles.pickerBtnText}>{a?.username || "Select hunter..."}</span>
            </span>
            <span className={styles.pickerBtnHint}>Pick</span>
          </button>
        </div>

        <div className={styles.pickerField + " " + styles.primaryPickerField}>
          <label>Hunter B</label>
          <button type="button" className={styles.pickerBtn} onClick={() => setPickBOpen(true)}>
            <span className={styles.pickerBtnInner}>
              <Image
                src={b?.avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
                alt=""
                width={28}
                height={28}
                className={styles.pickerAvatar}
              />
              <span className={styles.pickerBtnText}>{b?.username || "Select hunter..."}</span>
            </span>
            <span className={styles.pickerBtnHint}>Pick</span>
          </button>
        </div>

        <button type="submit" className={`mh-button ${styles.compareAction}`} disabled={!a?.id || !b?.id}>
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
