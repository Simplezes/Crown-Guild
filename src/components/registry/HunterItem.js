import Link from "next/link";
import Image from "next/image";
import ContactButton from "../beacon/ContactButton";
import UserAvatar from "@/components/ui/UserAvatar";
import { Icon } from "@/components/shell/Icon";

const QUEST_ICON = { "Event Quests": "event", "Optional Quests": "optional", "Field Survey Quests": "survey", "Investigation Quests": "investigation" };
const questName = (q) => (q || "Hunt").replace(/ Quests$/, " Quest").replace("Field Survey Quest", "Field Survey");
const titleCase = (s) => s?.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function Row({ c, label, kind }) {
  return (
    <div className="hk-row">
      <Image src={`/icons/${kind}crown.png`} alt="" width={18} height={18} className="px" />
      <span>{label}</span>
      <b>{c?.strength_rating ?? "-"}★</b>
      {c?.size_cm ? <em><Icon name="ruler" />{Number(c.size_cm)} cm</em> : c?.size_label ? <em>{c.size_label}</em> : null}
    </div>
  );
}

export default function HunterItem({ crown, linkedCrown = null, monsterName, isHighlighted, viewerId = null }) {
  const {
    user_id, avatar_url, username, status_message, quest, tempered, remaining_uses, id: crownId, monster_id,
    inv_remaining_uses, inv_monster_id, inv_monster_name, receive_dms,
  } = crown;

  const uses = inv_remaining_uses !== undefined ? inv_remaining_uses : remaining_uses;
  const hasHost = inv_monster_id && String(inv_monster_id) !== String(monster_id);
  const hostName = hasHost ? titleCase(inv_monster_name) : null;

  const smallC = linkedCrown ? (crown.type === "small" ? crown : linkedCrown) : crown.type === "small" ? crown : null;
  const largeC = linkedCrown ? (crown.type === "large" ? crown : linkedCrown) : crown.type === "large" ? crown : null;
  const hasTempered = linkedCrown ? Boolean(smallC?.tempered || largeC?.tempered) : Boolean(tempered);
  const showUses = quest === "Investigation Quests" && uses != null;
  const typeLabel = linkedCrown ? "Crown pair" : crown.type === "small" ? "Small crown" : "Large crown";
  const dmsOpen = Number(receive_dms ?? 1) !== 0;
  const note = status_message?.trim();
  const isOwn = viewerId != null && String(viewerId) === String(user_id);
  const canDeploy = quest === "Investigation Quests" && uses > 0;

  return (
    <div id={`crown-${crownId}`} className={`hk ${hasTempered ? "t" : ""} ${isHighlighted ? "feat" : ""}`}>
      <div className="hk-top">
        <span className={`hk-ty ${linkedCrown || crown.type === "large" ? "l" : ""}`}>
          <Image src={crown.type === "small" && !linkedCrown ? "/icons/smallcrown.png" : "/icons/largecrown.png"} alt="" width={15} height={15} className="px" />
          {typeLabel}
        </span>
        {hasTempered && <span className="hk-tp"><Icon name="tempered" />Tempered</span>}
        {isHighlighted && <span className="hk-ft">Featured</span>}
      </div>

      <Link className="hk-id" href={`/profile/${user_id}`}>
        <UserAvatar src={avatar_url} alt={username} size={48} className="hk-av" />
        <div className="hk-nm">
          <b>{username}</b>
          <p className={note ? "" : "none"}>{note ? `“${note}”` : "No note set"}</p>
        </div>
      </Link>

      <div className="hk-rows">
        {smallC && <Row c={smallC} label="Small" kind="small" />}
        {largeC && <Row c={largeC} label="Large" kind="large" />}
      </div>

      <div className="hk-q">
        <span><Icon name={QUEST_ICON[quest] || "optional"} />{questName(quest)}{showUses ? ` · ${uses} left` : ""}</span>
        {hasHost && <span className="hk-on">On {hostName} {quest === "Field Survey Quests" ? "Field Survey" : "Investigation"}</span>}
      </div>

      {isOwn && !canDeploy ? (
        <div className="hk-c"><span className="hk-btn own">Your crown</span></div>
      ) : (uses > 0 || uses === null || uses === undefined) ? (
        <div className="hk-c">
          <ContactButton
            hostId={user_id}
            monsterId={monster_id}
            monsterName={monsterName}
            crownId={crownId}
            discordId={username}
            quest={quest}
            canDeploy={canDeploy}
            dmsOpen={dmsOpen}
          />
        </div>
      ) : (
        <div className="hk-c"><span className="hk-btn off">Out of uses</span></div>
      )}
    </div>
  );
}
