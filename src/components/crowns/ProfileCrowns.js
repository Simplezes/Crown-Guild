"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MonsterIcon from "@/components/ui/MonsterIcon";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "@/app/UIProvider";

const cardBase = "group relative flex flex-col overflow-hidden rounded-lg border border-white/5 bg-void p-2.5 transition-colors hover:border-white/10";
const cardTempered = "border-tempered/40 shadow-[0_0_16px_-8px_rgba(180,95,240,0.5)]";
const chipSmall = "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-mist";
const chipLarge = "inline-flex items-center gap-1 rounded-md border border-ember/30 bg-ember/10 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-ember-bright";
const chipTempered = "rounded-md border border-tempered/40 bg-tempered/10 px-1.25 py-0.5 font-body text-[8px] font-semibold uppercase text-tempered";

export default function ProfileCrowns({ initialCrowns, isOwner, userId }) {
  const CROWNS_PER_PAGE = 24;
  const [crowns, setCrowns] = useState(initialCrowns);
  const [page, setPage] = useState(1);
  const [activeCardId, setActiveCardId] = useState(null);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const hasDifferentHostMonster = (crown) => {
    if (!crown?.inv_monster_image || !crown?.inv_monster_id || !crown?.monster_id) return false;
    return String(crown.inv_monster_id) !== String(crown.monster_id);
  };

  const hasPrimaryQuestMonster = (crown) => hasDifferentHostMonster(crown);

  const buildShareNonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const renderPrimaryQuestGhost = (crown) => {
    if (!hasPrimaryQuestMonster(crown)) return null;
    return (
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-[0.08]" aria-hidden="true">
        <Image src={`/monsters/${crown.inv_monster_image}`} alt="" fill sizes="112px" className="object-contain pixel-art" />
      </div>
    );
  };

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

  const CardActions = ({ cardId, onShare, onEdit, onDelete }) => (
    <button
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-mist-dim hover:bg-white/10 hover:text-mist"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveCardId(prev => prev === cardId ? null : cardId); }}
      title="Options"
    >⋮</button>
  );

  const ActionsMenu = ({ cardId, onShare, onEdit, onDelete, editTitle, deleteTitle }) => (
    activeCardId === cardId && (
      <div
        className="absolute right-2 top-9 z-10 flex gap-1 rounded-lg border border-white/10 bg-void-raised p-1 shadow-lift"
        onClick={(e) => { e.stopPropagation(); setActiveCardId(null); }}
      >
        <button onClick={onShare} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10" title="Share">
          <Image src="/icons/MHWilds-Link_Party_Icon.png" width={14} height={14} alt="Share" className="pixel-art" />
        </button>
        <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10" title={editTitle}>
          <Image src="/icons/MHWilds-Settings_Icon.png" width={14} height={14} alt="Edit" className="pixel-art" />
        </button>
        <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-md text-blood-bright hover:bg-blood/10" title={deleteTitle}>
          <Image src="/icons/MHWilds-Notes_X_Icon.png" width={14} height={14} alt="Delete" className="pixel-art" />
        </button>
      </div>
    )
  );

  const renderCard = (crown) => {
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
      <div className={`${cardBase} ${crown.tempered ? cardTempered : ''}`}>
        {renderPrimaryQuestGhost(crown)}

        <div className="mb-1.5 flex items-start justify-between gap-1.5">
          <div className="flex flex-wrap gap-1">
            <span className={crown.type === 'small' ? chipSmall : chipLarge}>
              <Image src={crown.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={10} height={10} alt="" className="pixel-art" />
              {crown.type === 'small' ? 'Small' : 'Large'}
            </span>
            {!!crown.tempered && <span className={chipTempered}>Tempered</span>}
          </div>
          {isOwner && <CardActions cardId={cardId} />}
        </div>

        <Link href={`/monster/${crown.name}?crownId=${crown.id}&user=${userId}`} className="mx-auto">
          <MonsterIcon imageName={crown.image_name} name={crown.name} tempered={crown.tempered} size={44} />
        </Link>

        <div className="mt-1.5 text-center">
          <Link href={`/monster/${crown.name}?crownId=${crown.id}&user=${userId}`}>
            <h3 className="truncate font-display text-[11px] uppercase tracking-wide text-mist hover:text-ember-bright">{crown.name}</h3>
          </Link>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1 font-body text-[10px] text-mist-dim">
            <span className="text-ember-bright">{crown.strength_rating}★</span>
            {investigationLabel && <span className="truncate">{investigationLabel}</span>}
          </div>
        </div>

        {isOwner && (
          <ActionsMenu
            cardId={cardId}
            editTitle="Edit Crown"
            deleteTitle="Delete Crown"
            onShare={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(crown.name)}?crownId=${crown.id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }}
            onEdit={(e) => { e.stopPropagation(); router.push(`/crowns/log?edit=${crown.id}`); }}
            onDelete={(e) => { e.stopPropagation(); handleDelete(crown.id); setActiveCardId(null); }}
          />
        )}
      </div>
    );
  };

  const renderGroupCard = (group) => {
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
      <div className={`${cardBase} ${anyTempered ? cardTempered : ''}`}>
        {renderPrimaryQuestGhost(first)}

        <div className="mb-1.5 flex items-start justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <Image src="/icons/MHWilds-Link_Party_Icon.png" width={10} height={10} alt="" className="pixel-art opacity-50" />
            {group.map(c => (
              <span key={c.id} className={c.type === 'small' ? chipSmall : chipLarge}>
                <Image src={c.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={10} height={10} alt="" className="pixel-art" />
                {c.type === 'small' ? 'S' : 'L'} {c.strength_rating}★
                {!!c.tempered && <span className="ml-0.5 text-tempered">T</span>}
              </span>
            ))}
          </div>
          {isOwner && <CardActions cardId={cardId} />}
        </div>

        <Link href={`/monster/${first.name}?crownId=${first.id}&user=${userId}`} className="mx-auto">
          <MonsterIcon imageName={first.image_name} name={first.name} tempered={anyTempered} size={44} />
        </Link>

        <div className="mt-1.5 text-center">
          <Link href={`/monster/${first.name}?crownId=${first.id}&user=${userId}`}>
            <h3 className="truncate font-display text-[11px] uppercase tracking-wide text-mist hover:text-ember-bright">{first.name}</h3>
          </Link>
          {investigationLabel && <p className="mt-1 truncate font-body text-[10px] text-mist-dim">{investigationLabel}</p>}
        </div>

        {isOwner && (
          <ActionsMenu
            cardId={cardId}
            editTitle="Edit Linked Crowns"
            deleteTitle="Delete Linked Crowns"
            onShare={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(first.name)}?crownId=${first.id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }}
            onEdit={(e) => { e.stopPropagation(); router.push(`/crowns/log?edit=${group.map(c => c.id).join(',')}`); }}
            onDelete={(e) => { e.stopPropagation(); handleDeleteGroup(group); setActiveCardId(null); }}
          />
        )}
      </div>
    );
  };

  const renderMultiMonsterGroupCard = (group) => {
    const first = group[0];
    const titleCase = (str) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "??";
    const sides = group.map(c => ({ crowns: [c], name: c.name, image_name: c.image_name }));
    const quest = group[0]?.quest;
    const isQuad = sides.length > 2;

    const cardId = first.pair_id || first.investigation_id || first.id;
    const questLabel = quest === "Investigation Quests"
      ? `Investigation${first.remaining_uses != null ? ` · ${first.remaining_uses}` : ''}`
      : quest;
    const anyTempered = group.some(c => c.tempered);

    return (
      <div className={`${cardBase} col-span-2 ${anyTempered ? cardTempered : ''}`}>
        {renderPrimaryQuestGhost(first)}

        <div className="mb-1.5 flex items-start justify-between gap-1.5">
          <div className="flex flex-wrap gap-1">
            {group.map(c => (
              <span key={c.id} className={c.type === 'small' ? chipSmall : chipLarge}>
                <Image src={c.type === 'small' ? "/icons/smallcrown.png" : "/icons/largecrown.png"} width={10} height={10} alt="" className="pixel-art" />
                {c.type === 'small' ? 'S' : 'L'} {c.strength_rating}★
              </span>
            ))}
          </div>
          {isOwner && <CardActions cardId={cardId} />}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {sides.map((side, idx) => (
            <React.Fragment key={side.crowns[0].id}>
              <Link href={`/monster/${side.name}?user=${userId}`} className="flex flex-col items-center gap-1">
                <MonsterIcon imageName={side.image_name} name={side.name} tempered={side.crowns.some(c => c.tempered)} size={isQuad ? 36 : 40} />
                <span className="font-body text-[10px] text-mist-dim">{titleCase(side.name)}</span>
              </Link>
              {idx < sides.length - 1 && <span className="font-display text-lg text-mist-faint">+</span>}
            </React.Fragment>
          ))}
        </div>

        {questLabel && (
          <p className="mt-1.5 text-center font-body text-[10px] text-mist-dim">{questLabel}</p>
        )}

        {isOwner && (
          <ActionsMenu
            cardId={cardId}
            editTitle="Edit Quest Pair"
            deleteTitle="Delete Quest Pair"
            onShare={(e) => { e.stopPropagation(); const url = `${window.location.origin}/monster/${encodeURIComponent(group[0].name)}?crownId=${group[0].id}&user=${userId}&share=${buildShareNonce()}`; navigator.clipboard.writeText(url); toast.info("Link copied to clipboard!"); setActiveCardId(null); }}
            onEdit={(e) => { e.stopPropagation(); router.push(`/crowns/log?edit=${group.map(c => c.id).join(',')}`); }}
            onDelete={(e) => { e.stopPropagation(); handleDeleteGroup(group); setActiveCardId(null); }}
          />
        )}
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(groupedCrowns.length / CROWNS_PER_PAGE));
  const pagedGroups = groupedCrowns.slice((page - 1) * CROWNS_PER_PAGE, page * CROWNS_PER_PAGE);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
          <div className="col-span-full flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-12 text-center">
            <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={40} height={40} alt="" className="pixel-art opacity-50" />
            <p className="font-body text-sm text-mist-dim">No Crowns in stock yet.</p>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 font-display text-lg text-mist disabled:opacity-30" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
          <span className="font-display text-xs uppercase tracking-widest text-mist-dim">Page {page} / {totalPages}</span>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 font-display text-lg text-mist disabled:opacity-30" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">›</button>
        </div>
      )}
    </div>
  );
}
