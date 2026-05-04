"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MonsterIcon from "@/components/MonsterIcon";
import EditCrownModal from "./EditCrownModal";
import styles from "@/app/profile/[id]/profile.module.css";
import { useRouter } from "next/navigation";

export default function ProfileCrowns({ initialCrowns, isOwner, userId }) {
  const [crowns, setCrowns] = useState(initialCrowns);
  const [editingCrown, setEditingCrown] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setCrowns(initialCrowns);
  }, [initialCrowns]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this crown from your collection?")) return;

    try {
      const res = await fetch(`/api/crowns/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCrowns(crowns.filter(c => c.id !== id));
        router.refresh();
      } else {
        alert("Failed to delete crown.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred.");
    }
  };

  return (
    <>
      <div className={styles.scrollArea}>
        <div className={styles.crownGrid}>
          {crowns.length > 0 ? crowns.map((crown, idx) => (
            <div key={crown.id || idx} className={styles.crownCard}>
              <Link href={`/monster/${crown.name}`} className={styles.monsterLink}>
                <div className={styles.monsterIconWrapper}>
                  <MonsterIcon
                    imageName={crown.image_name}
                    name={crown.name}
                    tempered={crown.tempered}
                    size={48}
                  />
                </div>
              </Link>
              <div className={styles.crownInfo}>
                <div className={styles.crownInfoHeader}>
                  <Link href={`/monster/${crown.name}`} className={styles.nameLink}>
                    <h3>{crown.name}</h3>
                  </Link>
                  {isOwner && (
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/monster/${encodeURIComponent(crown.name)}?crownId=${crown.id}&user=${userId}`;
                          navigator.clipboard.writeText(url);
                          alert("Link copied to clipboard!");
                        }}
                        className={styles.actionBtn}
                        title="Share Crown"
                      >
                        <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
                      </button>
                      <button
                        onClick={() => setEditingCrown(crown)}
                        className={styles.actionBtn}
                        title="Edit Crown"
                      >
                        <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
                      </button>
                      <button
                        onClick={() => handleDelete(crown.id)}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        title="Delete Crown"
                      >
                        <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.crownDetail}>
                  <Image
                    src={crown.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
                    width={14} height={14} alt="" className="pixel-art"
                  />
                  <span>
                    {crown.type} • {crown.strength_rating}
                    <Image src="/icons/MHWilds-Notes_1_Star_Icon.png" width={10} height={10} alt="★" className="pixel-art" style={{ display: 'inline', margin: '0 2px' }} />
                    {crown.tempered ? "• Tempered" : ""}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className={styles.noRecords}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art" />
              <p>No Crowns in stock yet.</p>
            </div>
          )}
        </div>
      </div>

      <EditCrownModal
        isOpen={!!editingCrown}
        onClose={() => setEditingCrown(null)}
        crown={editingCrown}
        onUpdated={() => {
          router.refresh();
        }}
      />
    </>
  );
}
