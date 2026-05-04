"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import MonsterIcon from "@/components/MonsterIcon";
import EditCrownModal from "./EditCrownModal";
import styles from "@/app/profile/[id]/profile.module.css";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "@/app/UIProvider";

export default function ProfileCrowns({ initialCrowns, isOwner, userId }) {
  const [crowns, setCrowns] = useState(initialCrowns);
  const [editingCrown, setEditingCrown] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const groupRefs = useRef({});
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const onPointerDown = (e) => {
      const key = activeGroupKey;
      if (!key) return;
      const el = groupRefs.current[key];
      if (el && !el.contains(e.target)) setActiveGroupKey(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeGroupKey]);

  useEffect(() => {
    setCrowns(initialCrowns);
  }, [initialCrowns]);

  const handleDelete = async (id) => {
    const ok = await confirm("Remove this crown from your collection?", { title: "Remove Crown", danger: true, confirmLabel: "Remove" });
    if (!ok) return;

    try {
      const res = await fetch(`/api/crowns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCrowns(crowns.filter(c => c.id !== id));
        router.refresh();
      } else {
        toast.error("Failed to delete crown.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred.");
    }
  };

  // Group crowns by pair_id first, then investigation_id
  const groupedCrowns = [];
  const usedPairIds = new Set();
  const usedInvIds = new Set();
  for (const crown of crowns) {
    if (crown.pair_id) {
      if (usedPairIds.has(crown.pair_id)) continue;
      usedPairIds.add(crown.pair_id);
      const group = crowns.filter(c => c.pair_id === crown.pair_id);
      group.forEach(c => { if (c.investigation_id) usedInvIds.add(c.investigation_id); });
      groupedCrowns.push(group);
    } else if (crown.investigation_id) {
      if (usedInvIds.has(crown.investigation_id)) continue;
      usedInvIds.add(crown.investigation_id);
      groupedCrowns.push(crowns.filter(c => c.investigation_id === crown.investigation_id && !c.pair_id));
    } else {
      groupedCrowns.push([crown]);
    }
  }

  const handleDeleteGroup = async (group) => {
    const ok = await confirm(`Remove all ${group.length} linked crowns from your collection?`, { title: "Remove Linked Crowns", danger: true, confirmLabel: "Remove All" });
    if (!ok) return;
    try {
      await Promise.all(group.map(c => fetch(`/api/crowns/${c.id}`, { method: "DELETE" })));
      setCrowns(prev => prev.filter(c => !group.find(g => g.id === c.id)));
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred.");
    }
  };

  const renderGroupActions = (group) => {
    if (!isOwner) return null;
    const first = group[0];
    return (
      <div className={styles.groupActions}>
        <button
          onClick={() => {
            const url = `${window.location.origin}/monster/${encodeURIComponent(first.name)}?crownId=${first.id}&user=${userId}`;
            navigator.clipboard.writeText(url);
            toast.info("Link copied to clipboard!");
          }}
          className={styles.actionBtn}
          title="Share Crown"
        >
          <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
        </button>
        <button
          onClick={() => setEditingGroup(group)}
          className={styles.actionBtn}
          title="Edit Crown"
        >
          <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
        </button>
        <button
          onClick={() => handleDeleteGroup(group)}
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          title="Delete All Linked Crowns"
        >
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
        </button>
      </div>
    );
  };

  const renderCard = (crown, hideActions = false) => {
    const titleCase = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "??";
    const hasInvestigation = crown.quest === "Investigation Quests";
    const hasFieldSurvey = crown.quest === "Field Survey Quests" && crown.inv_monster_id && crown.inv_monster_id !== crown.monster_id;
    const hostDiffers = crown.inv_monster_id && crown.inv_monster_id !== crown.monster_id;

    let investigationLabel = null;
    if (hasInvestigation) {
      investigationLabel = hostDiffers
        ? `${titleCase(crown.inv_monster_name)} Inv.${crown.remaining_uses != null ? ` · ${crown.remaining_uses}` : ""}`
        : `Investigation${crown.remaining_uses != null ? ` · ${crown.remaining_uses} left` : ""}`;
    } else if (hasFieldSurvey) {
      investigationLabel = `${titleCase(crown.inv_monster_name)} Field Survey`;
    }

    return (
      <div className={styles.crownCard}>
        {(hasInvestigation || hasFieldSurvey) && (
          <div className={styles.crownCornerLeft}>
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={12} height={12} alt="" className="pixel-art" />
          </div>
        )}
        <div className={styles.crownCornerRight}>
          <Image
            src={crown.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"}
            width={16} height={16} alt={crown.type} className="pixel-art"
          />
        </div>
        <Link href={`/monster/${crown.name}`} className={styles.monsterLink}>
          <MonsterIcon
            imageName={crown.image_name}
            name={crown.name}
            tempered={crown.tempered}
            size={64}
          />
        </Link>
        <div className={styles.crownOverlay}>
          <Link href={`/monster/${crown.name}`} className={styles.nameLink}>
            <h3>{crown.name}</h3>
          </Link>
          <div className={styles.crownDetail}>
            <span className={styles.ratingBadge}>
              {crown.strength_rating}★
            </span>
            {!!crown.tempered && <span className={styles.temperedBadge}>Tempered</span>}
          </div>
          {investigationLabel && (
            <div className={styles.crownInvestigation}>{investigationLabel}</div>
          )}
        </div>
        {isOwner && !hideActions && (
          <div className={styles.cardActions}>
            <button
              onClick={() => {
                const url = `${window.location.origin}/monster/${encodeURIComponent(crown.name)}?crownId=${crown.id}&user=${userId}`;
                navigator.clipboard.writeText(url);
                toast.info("Link copied to clipboard!");
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
    );
  };

  return (
    <>
      <div className={styles.scrollArea}>
        <div className={styles.crownGrid}>
          {crowns.length > 0 ? groupedCrowns.map((group) => {
            if (group.length === 1) {
              return <div key={group[0].id}>{renderCard(group[0])}</div>;
            }
            return (
              <div
                key={group[0].pair_id ? `pair-${group[0].pair_id}` : `inv-${group[0].investigation_id}`}
                className={`${styles.crownGroup}${activeGroupKey === (group[0].pair_id ?? `inv-${group[0].investigation_id}`) ? ` ${styles.crownGroupActive}` : ""}`}
                ref={el => { groupRefs.current[group[0].pair_id ?? `inv-${group[0].investigation_id}`] = el; }}
                onClick={() => setActiveGroupKey(group[0].pair_id ?? `inv-${group[0].investigation_id}`)}
              >
                {renderGroupActions(group)}
                {group.map((crown, i) => (
                  <>
                    {i > 0 && (
                      <div key={`connector-${crown.id}`} className={styles.chainConnector}>
                        <Image
                          src="/icons/MHWilds-Link_Party_Icon.png"
                          width={14} height={14}
                          alt="linked"
                          className="pixel-art"
                        />
                      </div>
                    )}
                    <div key={crown.id} className={styles.crownGroupItem}>
                      {renderCard(crown, true)}
                    </div>
                  </>
                ))}
              </div>
            );
          }) : (
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
        onUpdated={() => { router.refresh(); }}
      />
      <EditCrownModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        crown={editingGroup?.[0] ?? null}
        group={editingGroup}
        onUpdated={() => { router.refresh(); }}
      />
    </>
  );
}
