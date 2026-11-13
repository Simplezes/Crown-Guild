import Image from "next/image";
import { Icon } from "@/shared/ui";
import { QUESTS } from "./types";
import type { LogForm } from "./useLogForm";

type QuestPanelProps = Pick<
  LogForm,
  | "quest"
  | "setQuest"
  | "uses"
  | "setUses"
  | "isInvestigation"
  | "differentQuestMonster"
  | "setDifferent"
  | "primary"
  | "monsterOf"
  | "setPick"
  | "setPickQuery"
>;

export function QuestPanel(props: QuestPanelProps) {
  const { quest, setQuest, uses, setUses, isInvestigation, differentQuestMonster, setDifferent } =
    props;
  const primaryMonster = props.monsterOf(props.primary);

  return (
    <div className="h3q">
      <small>Quest</small>
      {QUESTS.map((q) => (
        <button key={q.value} aria-pressed={quest === q.value} onClick={() => setQuest(q.value)}>
          <Icon name={q.icon} />
          <span>{q.label}</span>
        </button>
      ))}
      <div className={`hqu ${isInvestigation ? "" : "off"}`}>
        <span>Uses left</span>
        {[1, 2, 3].map((count) => (
          <button
            key={count}
            aria-pressed={uses === count}
            tabIndex={isInvestigation ? 0 : -1}
            onClick={() => setUses(count)}
          >
            {count}
          </button>
        ))}
      </div>
      <div className="pq">
        <div className="pqh">
          <small>Quest monster</small>
          <div className="pqs" role="group" aria-label="Quest monster">
            <button aria-pressed={!differentQuestMonster} onClick={() => setDifferent(false)}>
              Same
            </button>
            <button aria-pressed={differentQuestMonster} onClick={() => setDifferent(true)}>
              Other
            </button>
          </div>
        </div>
        <div className={`pqm ${differentQuestMonster ? "" : "off"}`}>
          {differentQuestMonster ? (
            <button
              className="pqb"
              onClick={() => {
                props.setPick("primary");
                props.setPickQuery("");
              }}
              aria-label="Choose the monster this quest is about"
            >
              <span className="pqa">
                {primaryMonster.image_name && (
                  <Image
                    src={`/monsters/${primaryMonster.image_name}`}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="px"
                  />
                )}
              </span>
              <span className="pqn">
                <b>{primaryMonster.name}</b>
                <small>Quest is about this monster</small>
              </span>
              <span className="h3c" style={{ display: "block" }}>
                Change
              </span>
            </button>
          ) : (
            <p className="pqt">
              The quest is about the monster you crowned. Pick Other if you found the crown inside a
              different monster&apos;s quest.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
