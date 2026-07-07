import Link from "next/link";
import Image from "next/image";
import ContactButton from "../beacon/ContactButton";
import styles from "@/app/monster/[name]/monster.module.css";

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
    <div className={`${styles.hunterItem} ${isHighlighted ? styles.highlighted : ''}`} id={`crown-${crownId}`}>
      {ghostImageName && (
        <div className={styles.primaryQuestGhost}>
          <Image src={`/monsters/${ghostImageName}`} alt="" fill sizes="120px" className={`${styles.primaryQuestGhostImage} pixel-art`} />
        </div>
      )}

      <Link href={`/profile/${user_id}`} className={styles.hunterMain}>
        <div className={styles.social}>
          <div className={styles.avatarWrap}>
            <Image
              src={avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
              alt=""
              width={66}
              height={66}
              className={styles.avatar}
            />
            <span className={styles.mobileName}>{username}</span>
          </div>
          <div className={styles.hunterIdentity}>
            <span className={styles.name}>{username}</span>
            <div className={styles.status}>"{noteText}"</div>

            <div className={styles.chipRow}>
              <span className={styles.typeChip}>{crownTypeLabel}</span>
              <span className={styles.ratingChip}>{ratingLabel}</span>
              {hasTempered && <span className={styles.temperedChip}>Tempered</span>}
              <span className={styles.questChip}>{questLabel}</span>
              {showUses && <span className={styles.usesChip}>{effectiveUses} left</span>}
            </div>

            {hasHost && (
              <div className={styles.hostLine}>
                Hosted on {hostName} {quest === "Field Survey Quests" ? "Field Survey" : "Investigation"}
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className={styles.hunterAction}>
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