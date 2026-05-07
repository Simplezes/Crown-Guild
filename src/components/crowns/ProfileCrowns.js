"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MonsterIcon from "@/components/ui/MonsterIcon";
import UnifiedQuestModal from "./UnifiedQuestModal";
import styles from "@/app/profile/[id]/profile.module.css";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "@/app/UIProvider";

export default function ProfileCrowns({ initialCrowns, isOwner, userId }) {
  const CROWNS_PER_PAGE = 15;
  const [crowns, setCrowns] = useState(initialCrowns);
  const [page, setPage] = useState(1);
  const [editingCrown, setEditingCrown] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const hasDifferentHostMonster = (crown) => {
    if (!crown?.inv_monster_image || !crown?.inv_monster_id || !crown?.monster_id) return false;
    return String(crown.inv_monster_id) !== String(crown.monster_id);
  };

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    setCrowns(initialCrowns);
    setPage(1);
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

  const renderCard = (crown, hideActions = false) => {
    const titleCase = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "??";
    const hasInvestigation = crown.quest === "Investigation Quests";
    const hostDiffers = hasDifferentHostMonster(crown);
    const hasFieldSurvey = crown.quest === "Field Survey Quests" && hostDiffers;

    let investigationLabel = null;
    if (hasInvestigation) {
      investigationLabel = hostDiffers
        ? `${titleCase(crown.inv_monster_name)} Inv.${crown.remaining_uses != null ? ` · ${crown.remaining_uses}` : ""}`
        : `Investigation${crown.remaining_uses != null ? ` · ${crown.remaining_uses} left` : ""}`;
    } else if (hasFieldSurvey) {
      investigationLabel = `${titleCase(crown.inv_monster_name)} Field Survey`;
    }

    const cardId = crown.id;
    return (
      <div className={styles.crownCard}>
        {hostDiffers && (
          <div className={styles.ghostHost}>
            <Image src={`/monsters/${crown.inv_monster_image}`} alt="" fill sizes="180px" className={styles.ghostImage} />
          </div>
        )}
        <div className={styles.crownCornerRight}>
          <Image src={crown.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={16} height={16} alt={crown.type} className="pixel-art" />
        </div>
        <Link href={`/monster/${crown.name}?crownId=${crown.id}&user=${userId}`} className={styles.monsterLink}>
          <MonsterIcon imageName={crown.image_name} name={crown.name} tempered={crown.tempered} size={64} />
        </Link>
        <div className={styles.crownOverlay}>
          <Link href={`/monster/${crown.name}?crownId=${crown.id}&user=${userId}`} className={styles.nameLink}>
            <h3>{crown.name}</h3>
          </Link>
          <div className={styles.crownDetail}>
            <span className={crown.type === 'small' ? styles.crownChipSmall : styles.crownChipLarge}>
              {crown.type === 'small' ? 'S' : 'L'} {crown.strength_rating}★
            </span>
            {!!crown.tempered && <span className={styles.crownChipTempered}>Tempered</span>}
          </div>
          {investigationLabel && (
            <div className={styles.crownInvestigation}>{investigationLabel}</div>
          )}
        </div>
        {isOwner && !hideActions && (
          <>
            <button
              className={`${styles.actionsTrigger} ${activeCardId === cardId ? styles.actionsTriggerActive : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveCardId(prev => prev === cardId ? null : cardId); }}
              title="Options"
            >⋮</button>
            <div
              className={`${styles.cardActions} ${activeCardId === cardId ? styles.cardActionsActive : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveCardId(null); }}
            >
              <button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(crown.name)}?crownId=${crown.id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }} className={styles.actionBtn} title="Share Crown">
                <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditingCrown(crown); setActiveCardId(null); }} className={styles.actionBtn} title="Edit Crown">
                <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(crown.id); setActiveCardId(null); }} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Crown">
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderGroupCard = (group) => {
    if (group.length > 1) {
      return renderMultiMonsterGroupCard(group);
    }

    const first = group[0];
    const titleCase = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "??";
    const hasInvestigation = first.quest === "Investigation Quests";
    const hostDiffers = hasDifferentHostMonster(first);
    const hasFieldSurvey = first.quest === "Field Survey Quests" && hostDiffers;
    const anyTempered = group.some(c => c.tempered);

    let investigationLabel = null;
    if (hasInvestigation) {
      investigationLabel = hostDiffers
        ? `${titleCase(first.inv_monster_name)} Inv.${first.remaining_uses != null ? ` · ${first.remaining_uses}` : ""}`
        : `Investigation${first.remaining_uses != null ? ` · ${first.remaining_uses} left` : ""}`;
    } else if (hasFieldSurvey) {
      investigationLabel = `${titleCase(first.inv_monster_name)} Field Survey`;
    }

    const cardId = first.pair_id || first.investigation_id || first.id;
    return (
      <div className={`${styles.crownCard} ${styles.crownCardDual}`}>
        {hostDiffers && (
          <div className={styles.ghostHost}>
            <Image src={`/monsters/${first.inv_monster_image}`} alt="" fill sizes="180px" className={styles.ghostImage} />
          </div>
        )}
        <div className={styles.crownCornerLeft}>
          <Image src="/icons/MHWilds-Link_Party_Icon.png" width={12} height={12} alt="linked" className="pixel-art" />
        </div>
        <div className={`${styles.crownCornerRight} ${styles.linkedCrownTypes}`}>
          {group.map(c => (
            <Image key={c.id} src={c.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={14} height={14} alt={c.type} className="pixel-art" />
          ))}
        </div>
        <Link href={`/monster/${first.name}?crownId=${first.id}&user=${userId}`} className={styles.monsterLink}>
          <MonsterIcon imageName={first.image_name} name={first.name} tempered={anyTempered} size={64} />
        </Link>
        <div className={styles.crownOverlay}>
          <Link href={`/monster/${first.name}?crownId=${first.id}&user=${userId}`} className={styles.nameLink}>
            <h3>{first.name}</h3>
          </Link>
          <div className={styles.linkedCrownRows}>
            {group.map(c => (
              <div key={c.id} className={styles.linkedCrownRow}>
                <div className={styles.crownDetail}>
                  <span className={c.type === 'small' ? styles.crownChipSmall : styles.crownChipLarge}>
                    {c.type === 'small' ? 'S' : 'L'} {c.strength_rating}★
                  </span>
                  {!!c.tempered && <span className={styles.crownChipTempered}>T</span>}
                </div>
              </div>
            ))}
          </div>
          {investigationLabel && (
            <div className={styles.crownInvestigation}>{investigationLabel}</div>
          )}
        </div>
        {isOwner && (
          <>
            <button
              className={`${styles.actionsTrigger} ${activeCardId === cardId ? styles.actionsTriggerActive : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveCardId(prev => prev === cardId ? null : cardId); }}
              title="Options"
            >⋮</button>
            <div
              className={`${styles.cardActions} ${activeCardId === cardId ? styles.cardActionsActive : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveCardId(null); }}
            >
              <button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(first.name)}?crownId=${first.id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }} className={styles.actionBtn} title="Share Crown">
                <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setActiveCardId(null); }} className={styles.actionBtn} title="Edit Linked Crowns">
                <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); setActiveCardId(null); }} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Linked Crowns">
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMultiMonsterGroupCard = (group) => {
    const first = group[0];
    const titleCase = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "??";
    const hostDiffers = hasDifferentHostMonster(first);
    const sides = group.map(c => ({ crowns: [c], name: c.name, image_name: c.image_name }));
    const quest = group[0]?.quest;
    const isQuad = sides.length > 2;

    const cardId = first.pair_id || first.investigation_id || first.id;
    const questLabel = quest === "Investigation Quests"
      ? `Investigation${first.remaining_uses != null ? ` · ${first.remaining_uses}` : ''}`
      : quest;

    return (
      <div className={`${styles.crownCard} ${styles.crownCardDual} ${isQuad ? styles.crownCardQuad : ""}`}>
        {hostDiffers && (
          <div className={styles.ghostHost}>
            <Image src={`/monsters/${first.inv_monster_image}`} alt="" fill sizes="180px" className={styles.ghostImage} />
          </div>
        )}
        <div className={styles.crownCornerLeft}>
          <Image src="/icons/MHWilds-Link_Party_Icon.png" width={12} height={12} alt="linked" className="pixel-art" />
        </div>
        <div className={`${styles.crownCornerRight} ${styles.linkedCrownTypes}`}>
          {group.map(c => (
            <Image key={c.id} src={c.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={14} height={14} alt={c.type} className="pixel-art" />
          ))}
        </div>

        <div className={styles.dualSides}>
          {sides.map((side, idx) => (
            <React.Fragment key={side.crowns[0].id}>
              <Link href={`/monster/${side.name}?user=${userId}`} className={`${styles.dualSide}`}>
                <MonsterIcon imageName={side.image_name} name={side.name} tempered={side.crowns.some(c => c.tempered)} size={isQuad ? 48 : 56} />
                <div className={styles.dualOverlay}>
                  <span className={styles.dualMonsterName}>{titleCase(side.name)}</span>
                  <div className={styles.linkedCrownRows}>
                    {side.crowns.map(c => (
                      <div key={c.id} className={styles.linkedCrownRow}>
                        <div className={styles.crownDetail}>
                          <span className={c.type === 'small' ? styles.crownChipSmall : styles.crownChipLarge}>
                            {c.type === 'small' ? 'S' : 'L'} {c.strength_rating}★
                          </span>
                          {!!c.tempered && <span className={styles.crownChipTempered}>T</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
              {idx < sides.length - 1 && (
                <div className={styles.dualDivider}>+</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {questLabel && (
          <div className={styles.dualQuestLabel}>{questLabel}</div>
        )}

        {isOwner && (
          <>
            <button
              className={`${styles.actionsTrigger} ${activeCardId === cardId ? styles.actionsTriggerActive : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveCardId(prev => prev === cardId ? null : cardId); }}
              title="Options"
            >⋮</button>
            <div
              className={`${styles.cardActions} ${activeCardId === cardId ? styles.cardActionsActive : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveCardId(null); }}
            >
              <button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(group[0].name)}?crownId=${group[0].id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }} className={styles.actionBtn} title="Share Pair">
                <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setActiveCardId(null); }} className={styles.actionBtn} title="Edit Quest Pair">
                <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); setActiveCardId(null); }} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Quest Pair">
                <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(groupedCrowns.length / CROWNS_PER_PAGE));
  const pagedGroups = groupedCrowns.slice((page - 1) * CROWNS_PER_PAGE, page * CROWNS_PER_PAGE);

  return (
    <>
      <div className={styles.scrollArea}>
        <div className={styles.crownGrid}>
          {crowns.length > 0 ? pagedGroups.map((group) => {
            const key = group[0].pair_id ? `pair-${group[0].pair_id}` : (group[0].investigation_id ? `inv-${group[0].investigation_id}` : `single-${group[0].id}`);

            if (group.length === 1) {
              return <React.Fragment key={key}>{renderCard(group[0])}</React.Fragment>;
            }
            return (
              <React.Fragment key={key}>
                {renderMultiMonsterGroupCard(group)}
              </React.Fragment>
            );
          }) : (
            <div className={styles.noRecords}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={48} height={48} alt="" className="pixel-art" />
              <p>No Crowns in stock yet.</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
            <span className={styles.pageInfo}>Page {page} / {totalPages}</span>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">›</button>
          </div>
        )}
      </div>

      <UnifiedQuestModal
        isOpen={!!editingCrown}
        onClose={() => setEditingCrown(null)}
        initialGroup={editingCrown ? [editingCrown] : null}
        onUpdated={() => { router.refresh(); }}
      />

      <UnifiedQuestModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        initialGroup={editingGroup}
        onUpdated={() => { router.refresh(); }}
      />
    </>
  );
}
