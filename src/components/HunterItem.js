import Link from "next/link";
import Image from "next/image";
import ContactButton from "./ContactButton";
import { getQuestIcon } from "@/lib/monsters";
import styles from "@/app/monster/[name]/monster.module.css";

export default function HunterItem({ crown, monsterName, isHighlighted }) {
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

  // Resolve effective remaining uses (new model: on investigation; legacy: on crown)
  const effectiveUses = inv_remaining_uses !== undefined ? inv_remaining_uses : remaining_uses;

  // Whether the crown's investigation/survey is for a different host monster
  const hasHost = inv_monster_id && String(inv_monster_id) !== String(monster_id);
  const hostName = hasHost
    ? inv_monster_name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : null;

  return (
    <div className={`${styles.hunterItem} mh-card ${isHighlighted ? styles.highlighted : ''}`} id={`crown-${crownId}`}>
      <Link href={`/profile/${user_id}`} className={styles.hunterMain}>
        <div className={styles.iconPair}>
          <img
            src={avatar_url || "/icons/MHWilds-Quest_Members_Icon.png"}
            alt=""
            className={styles.avatar}
            style={{ borderRadius: 10 }}
          />
        </div>
        <div className={styles.hunterDetail}>
          <span className={styles.name}>{username}</span>
          {status_message && (
            <div className={styles.statusBubble}>
              <Image
                src="/icons/MHWilds-Notes_Checkmark_Icon.png"
                width={12}
                height={12}
                alt=""
                className="pixel-art"
              />
              <span>{status_message}</span>
            </div>
          )}
          <div className={styles.questMeta}>
            <div className={styles.questIcon}>
              <Image
                src={`/icons/${getQuestIcon(quest)}`}
                width={24}
                height={24}
                alt=""
                className="pixel-art"
              />
            </div>
            <span className={tempered ? styles.tempered : styles.normal}>
              {quest || "Hunt"} • {strength_rating}
              <Image src="/icons/MHWilds-Notes_1_Star_Icon.png" width={12} height={12} alt="★" className="pixel-art" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
              • {tempered ? (
                <span style={{ color: 'var(--mh-red)' }}>
                  <Image src="/icons/MHWilds-Hunt_Icon.png" width={12} height={12} alt="" className="pixel-art" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
                  Tempered In Stock
                </span>
              ) : "In Stock"}
              {quest === "Investigation Quests" && effectiveUses !== null && ` (${effectiveUses} left)`}
            </span>
          </div>
          {/* Host monster context */}
          {hasHost && (
            <div className={styles.hostMonsterLine}>
              <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={10} height={10} alt="" className="pixel-art" />
              <span>
                {quest === "Field Survey Quests"
                  ? `${hostName} Field Survey`
                  : `${hostName} Investigation`}
              </span>
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

