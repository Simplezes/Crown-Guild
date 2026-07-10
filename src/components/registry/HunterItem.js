import Link from "next/link";
import Image from "next/image";
import ContactButton from "../beacon/ContactButton";
import UserAvatar from "@/components/ui/UserAvatar";

export default function HunterItem({ crown, linkedCrown = null, monsterName, monsterImageName, isHighlighted }) {
  const {
    user_id,
    avatar_url,
    username,
    status_message,
    quest,
    tempered,
    strength_rating,
    remaining_uses,
    id: crownId,
    monster_id,
    inv_remaining_uses,
    inv_monster_id,
    inv_monster_name,
  } = crown;

  const effectiveUses = inv_remaining_uses !== undefined ? inv_remaining_uses : remaining_uses;
  const hasHost = inv_monster_id && String(inv_monster_id) !== String(monster_id);
  const hostName = hasHost
    ? inv_monster_name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : null;

  const smallC = linkedCrown ? (crown.type === 'small' ? crown : linkedCrown) : crown.type === 'small' ? crown : null;
  const largeC = linkedCrown ? (crown.type === 'large' ? crown : linkedCrown) : crown.type === 'large' ? crown : null;
  const crownTypeLabel = linkedCrown ? 'Crown Pair' : crown.type === 'small' ? 'Small Crown' : 'Large Crown';
  const ratingLabel = linkedCrown
    ? `S ${smallC?.strength_rating ?? '-'}★ • L ${largeC?.strength_rating ?? '-'}★`
    : `${strength_rating}★`;
  const hasTempered = linkedCrown
    ? Boolean(smallC?.tempered || largeC?.tempered)
    : Boolean(tempered);
  const showUses = quest === "Investigation Quests" && effectiveUses != null;
  const noteText = status_message?.trim() || "No note set";
  const questLabel = quest || "Hunt";
  const ghostImageName = hasHost && inv_monster_name
    ? `MHWilds-${inv_monster_name.replace(/\s+/g, '_')}_Icon.png`
    : null;

  return (
    <div
      id={`crown-${crownId}`}
      className={`group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border bg-void px-3 py-2.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isHighlighted ? 'border-ember bg-ember/5 shadow-[0_0_0_1px_rgba(201,162,74,0.4),0_0_24px_rgba(201,162,74,0.3)]' : 'border-white/5 hover:border-ember/30'
      }`}
    >
      {isHighlighted && (
        <span className="absolute right-4 top-3.5 z-10 rounded bg-ember px-2 py-0.5 font-display text-[10px] uppercase tracking-wide text-void">
          Featured
        </span>
      )}

      {ghostImageName && (
        <div className="pointer-events-none absolute inset-y-2 right-2 w-24 overflow-hidden opacity-15 sm:w-32">
          <Image src={`/monsters/${ghostImageName}`} alt="" fill sizes="120px" className="scale-125 object-contain grayscale pixel-art" />
        </div>
      )}

      <Link href={`/profile/${user_id}`} className="relative z-[1] flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar
          src={avatar_url}
          alt={username}
          size={44}
          className={`h-11 w-11 shrink-0 rounded-lg border bg-black object-cover transition-colors ${
            hasTempered ? 'tempered-monster-icon border-tempered/60' : 'border-white/10 group-hover:border-ember/40'
          }`}
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm tracking-wide text-ember-bright">{username}</p>
          <p className="mt-0.5 truncate font-body text-[11px] italic text-mist-dim">&ldquo;{noteText}&rdquo;</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="rounded border border-ember/30 bg-ember/10 px-1.5 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-ember-bright">
              {crownTypeLabel}
            </span>
            <span className="rounded border border-ember/30 bg-ember/10 px-1.5 py-0.5 font-body text-[9px] font-bold text-ember">
              {ratingLabel}
            </span>
            {hasTempered && (
              <span className="rounded border border-tempered/50 bg-tempered/15 px-1.5 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-tempered">
                Tempered
              </span>
            )}
            <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-body text-[9px] uppercase tracking-wide text-mist-dim">
              {questLabel}
            </span>
            {showUses && (
              <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-body text-[9px] uppercase tracking-wide text-mist-dim">
                {effectiveUses} left
              </span>
            )}
          </div>

          {hasHost && (
            <p className="mt-1 font-body text-[9px] uppercase tracking-wide text-mist-faint">
              Hosted on {hostName} {quest === "Field Survey Quests" ? "Field Survey" : "Investigation"}
            </p>
          )}
        </div>
      </Link>

      <div className="relative z-[1] flex shrink-0 justify-end border-t border-white/5 pt-2 sm:border-t-0 sm:pt-0 sm:pl-3">
        {(effectiveUses > 0 || effectiveUses === null) && (
          <ContactButton
            hostId={user_id}
            monsterId={monster_id}
            monsterName={monsterName}
            crownId={crownId}
            discordId={username}
            quest={quest}
            canDeploy={quest === "Investigation Quests" && effectiveUses > 0}
          />
        )}
      </div>
    </div>
  );
}
