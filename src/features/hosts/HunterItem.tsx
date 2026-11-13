import Image from "next/image";
import Link from "next/link";
import type { HostCrown } from "@/server/services/monster-page";
import { Icon, UserAvatar } from "@/shared/ui";
import { ContactButton } from "./ContactButton";

const QUEST_ICON: Record<string, string> = {
  "Event Quests": "event",
  "Optional Quests": "optional",
  "Field Survey Quests": "survey",
  "Investigation Quests": "investigation",
};

const questName = (quest: string | null | undefined) =>
  (quest || "Hunt").replace(/ Quests$/, " Quest").replace("Field Survey Quest", "Field Survey");

const titleCase = (value: string | null) =>
  value
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") ?? null;

function Row({
  crown,
  label,
  kind,
}: {
  crown: HostCrown | null;
  label: string;
  kind: "small" | "large";
}) {
  return (
    <div className="hk-row">
      <Image src={`/icons/${kind}crown.png`} alt="" width={18} height={18} className="px" />
      <span>{label}</span>
      <b>{crown?.strength_rating ?? "-"}★</b>
      {crown?.size_cm ? (
        <em>
          <Icon name="ruler" />
          {Number(crown.size_cm)} cm
        </em>
      ) : crown?.size_label ? (
        <em>{crown.size_label}</em>
      ) : null}
    </div>
  );
}

interface HunterItemProps {
  crown: HostCrown;
  linkedCrown?: HostCrown | null;
  monsterName: string;
  isHighlighted: boolean;
  viewerId?: string | null;
}

export function HunterItem({
  crown,
  linkedCrown = null,
  monsterName,
  isHighlighted,
  viewerId = null,
}: HunterItemProps) {
  const { user_id, avatar_url, username, status_message, quest, tempered, id, monster_id } = crown;
  const uses = crown.inv_remaining_uses;
  const hasHost = !!crown.inv_monster_id && String(crown.inv_monster_id) !== String(monster_id);

  const small = linkedCrown
    ? crown.type === "small"
      ? crown
      : linkedCrown
    : crown.type === "small"
      ? crown
      : null;
  const large = linkedCrown
    ? crown.type === "large"
      ? crown
      : linkedCrown
    : crown.type === "large"
      ? crown
      : null;
  const hasTempered = linkedCrown ? Boolean(small?.tempered || large?.tempered) : Boolean(tempered);
  const isInvestigation = quest === "Investigation Quests";
  const showUses = isInvestigation && uses != null;
  const typeLabel = linkedCrown
    ? "Crown pair"
    : crown.type === "small"
      ? "Small crown"
      : "Large crown";
  const note = status_message?.trim();
  const isOwn = viewerId != null && String(viewerId) === String(user_id);
  const canDeploy = isInvestigation && uses != null && uses > 0;
  const hasUsesLeft = uses == null || uses > 0;

  let action;
  if (isOwn && !canDeploy) {
    action = <span className="hk-btn own">Your crown</span>;
  } else if (hasUsesLeft) {
    action = (
      <ContactButton
        hostId={user_id}
        monsterId={monster_id}
        monsterName={monsterName}
        crownId={id}
        discordId={username}
        quest={quest}
        canDeploy={canDeploy}
        dmsOpen={Number(crown.receive_dms ?? 1) !== 0}
      />
    );
  } else {
    action = <span className="hk-btn off">Out of uses</span>;
  }

  return (
    <div
      id={`crown-${id}`}
      className={`hk ${hasTempered ? "t" : ""} ${isHighlighted ? "feat" : ""}`}
    >
      <div className="hk-top">
        <span className={`hk-ty ${linkedCrown || crown.type === "large" ? "l" : ""}`}>
          <Image
            src={
              crown.type === "small" && !linkedCrown
                ? "/icons/smallcrown.png"
                : "/icons/largecrown.png"
            }
            alt=""
            width={15}
            height={15}
            className="px"
          />
          {typeLabel}
        </span>
        {hasTempered && (
          <span className="hk-tp">
            <Icon name="tempered" />
            Tempered
          </span>
        )}
        {isHighlighted && <span className="hk-ft">Featured</span>}
      </div>

      <Link className="hk-id" href={`/profile/${user_id}`}>
        <UserAvatar src={avatar_url} alt={username ?? ""} size={48} className="hk-av" />
        <div className="hk-nm">
          <b>{username}</b>
          <p className={note ? "" : "none"}>{note ? `“${note}”` : "No note set"}</p>
        </div>
      </Link>

      <div className="hk-rows">
        {small && <Row crown={small} label="Small" kind="small" />}
        {large && <Row crown={large} label="Large" kind="large" />}
      </div>

      <div className="hk-q">
        <span>
          <Icon name={QUEST_ICON[quest] || "optional"} />
          {questName(quest)}
          {showUses ? ` · ${uses} left` : ""}
        </span>
        {hasHost && (
          <span className="hk-on">
            On {titleCase(crown.inv_monster_name)}{" "}
            {quest === "Field Survey Quests" ? "Field Survey" : "Investigation"}
          </span>
        )}
      </div>

      <div className="hk-c">{action}</div>
    </div>
  );
}
