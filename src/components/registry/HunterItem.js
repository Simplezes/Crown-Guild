import Link from "next/link";
import Image from "next/image";
import ContactButton from "../beacon/ContactButton";
import { getQuestIcon } from "@/lib/monsters";
import styles from "@/app/monster/[name]/monster.module.css";
import InfoTrigger from "../ui/InfoTrigger";

export default function HunterItem({ crown, linkedCrown = null, monsterName, isHighlighted }) {
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

  const smallC = linkedCrown ? (crown.type === 'small' ? crown : linkedCrown) : null;
  const largeC = linkedCrown ? (crown.type === 'large' ? crown : linkedCrown) : null;
  const anyTempered = linkedCrown ? (crown.tempered || linkedCrown.tempered) : null;

  return (
    <div className={`${styles.hunterItem} mh-card ${isHighlighted ? styles.highlighted : ''}`} id={`crown-${crownId}`}>
      <Link href={`/profile/${user_id}`} className={styles.hunterMain}>
        <img
          src={avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
          alt=""
          className={styles.avatar}
        />
        <div className={styles.hunterDetail}>
          <div className={styles.hunterTop}>
            <span className={styles.name}>{username}</span>
            {!linkedCrown && (
              <div className={styles.crownBadges}>
                <span className={styles.ratingChip}>
                  {strength_rating}★
                  <InfoTrigger 
                    title="Strength Rating" 
                    content="The difficulty level of the quest this crown was found in." 
                  />
                </span>
                {!!tempered && (
                  <span className={styles.temperedChip}>
                    Tempered
                    <InfoTrigger 
                      title="Tempered" 
                      content="A more powerful monster variant. Tempered hunts often have better odds for specific crowns." 
                    />
                  </span>
                )}
              </div>
            )}
          </div>
          {status_message && (
            <div className={styles.statusBubble}>
              <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={10} height={10} alt="" className="pixel-art" />
              <span>{status_message}</span>
            </div>
          )}
          <div className={styles.questRow}>
            <Image src={`/icons/${getQuestIcon(quest)}`} width={14} height={14} alt="" className="pixel-art" />
            <span className={styles.questLabel}>{quest || "Hunt"}</span>
            {quest === "Investigation Quests" && effectiveUses != null && (
              <span className={styles.usesChip}>{effectiveUses} left</span>
            )}
          </div>
          {linkedCrown && (
            <div className={styles.linkedRow}>
              <Image src="/icons/smallcrown.png" width={10} height={10} alt="S" className="pixel-art" />
              <span className={smallC.tempered ? styles.temperedText : styles.ratingText}>{smallC.strength_rating}★</span>
              {!!smallC.tempered && <span className={styles.temperedChip}>T</span>}
              <span className={styles.linkedSep}>·</span>
              <Image src="/icons/largecrown.png" width={12} height={12} alt="L" className="pixel-art" />
              <span className={largeC.tempered ? styles.temperedText : styles.ratingText}>{largeC.strength_rating}★</span>
              {!!largeC.tempered && <span className={styles.temperedChip}>T</span>}
            </div>
          )}
          {hasHost && (
            <div className={styles.hostLine}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={10} height={10} alt="" className="pixel-art" />
              <span>{quest === "Field Survey Quests" ? `${hostName} Field Survey` : `${hostName} Investigation`}</span>
            </div>
          )}
        </div>
      </Link>
      {(effectiveUses > 0 || effectiveUses === null) && (
        <ContactButton
          hostId={user_id}
          monsterId={monster_id}
          monsterName={monsterName}
          crownId={crownId}
          discordId={username}
        />
      )}
    </div>
  );
}