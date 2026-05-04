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
    monster_id
  } = crown;

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
              {quest === "Investigation Quests" && remaining_uses !== null && ` (${remaining_uses} left)`}
            </span>
          </div>
        </div>
      </Link>
      {(remaining_uses > 0 || remaining_uses === null) && (
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

