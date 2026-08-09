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
  const crownIcon = linkedCrown
    ? '/icons/largecrown.png'
    : crown.type === 'small' ? '/icons/smallcrown.png' : '/icons/largecrown.png';
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
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-void transition-all ${
        isHighlighted ? 'border-ember shadow-[0_0_0_1px_rgba(201,162,74,0.4),0_0_28px_rgba(201,162,74,0.3)]' : 'border-white/5 hover:-translate-y-0.5 hover:border-ember/30 hover:shadow-lift'
      }`}
    >
      {isHighlighted && (
        <span className="absolute right-3 top-3 z-10 rounded bg-ember px-2 py-0.5 font-display text-[10px] uppercase tracking-wide text-void">
          Featured
        </span>
      )}

      <div className="relative h-16 shrink-0 overflow-hidden border-b border-white/5 bg-gradient-to-r from-ember/15 via-white/[0.03] to-transparent">
        {ghostImageName && (
          <div className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 opacity-[0.12]">
            <Image src={`/monsters/${ghostImageName}`} alt="" fill sizes="96px" className="scale-125 object-contain grayscale pixel-art" />
          </div>
        )}
        <div className="relative z-[1] flex items-center gap-1.5 px-3.5 pt-3">
          <Image src={crownIcon} width={14} height={14} alt="" className="pixel-art" />
          <span className="font-display text-[11px] uppercase tracking-wide text-ember-bright">{crownTypeLabel}</span>
        </div>
      </div>

      <Link href={`/profile/${user_id}`} className="relative z-[1] -mt-6 flex min-w-0 flex-1 flex-col gap-3 px-3.5 pb-3.5">
        <div className="flex items-end gap-3">
          <UserAvatar
            src={avatar_url}
            alt={username}
            size={52}
            className={`h-[52px] w-[52px] shrink-0 rounded-xl border-2 bg-black object-cover transition-colors ${
              hasTempered ? 'tempered-monster-icon border-tempered/70' : 'border-void group-hover:border-ember/50'
            }`}
          />
          <div className="min-w-0 pb-0.5">
            <p className="truncate font-display text-base tracking-wide text-ember-bright">{username}</p>
            <p className="truncate font-body text-[11px] italic text-mist-dim">&ldquo;{noteText}&rdquo;</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {linkedCrown ? (
            <>
              <span className="rounded border border-ember/30 bg-ember/10 px-1.5 py-0.5 font-body text-[9px] font-bold text-ember">
                S {smallC?.strength_rating ?? '-'}★
              </span>
              <span className="rounded border border-ember/30 bg-ember/10 px-1.5 py-0.5 font-body text-[9px] font-bold text-ember">
                L {largeC?.strength_rating ?? '-'}★
              </span>
            </>
          ) : (
            <span className="rounded border border-ember/30 bg-ember/10 px-1.5 py-0.5 font-body text-[9px] font-bold text-ember">
              {strength_rating}★
            </span>
          )}
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
          <p className="font-body text-[9px] uppercase tracking-wide text-mist-faint">
            Hosted on {hostName} {quest === "Field Survey Quests" ? "Field Survey" : "Investigation"}
          </p>
        )}
      </Link>

      <div className="relative z-[1] border-t border-white/5 px-3.5 py-2.5 [&_button]:w-full [&_button]:justify-center">
        {(effectiveUses > 0 || effectiveUses === null) ? (
          <ContactButton
            hostId={user_id}
            monsterId={monster_id}
            monsterName={monsterName}
            crownId={crownId}
            discordId={username}
            quest={quest}
            canDeploy={quest === "Investigation Quests" && effectiveUses > 0}
          />
        ) : (
          <span className="block h-9" />
        )}
      </div>
    </div>
  );
}
