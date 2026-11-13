import Image from "next/image";
import { Icon } from "@/shared/ui";
import { HuntTile } from "../components/HuntTile";
import { MAX_CROWNS } from "./types";
import type { LogForm } from "./useLogForm";

type PreviewPanelProps = Pick<
  LogForm,
  | "masteryPreview"
  | "questMeta"
  | "isInvestigation"
  | "uses"
  | "entries"
  | "differentQuestMonster"
  | "primary"
  | "monsterOf"
  | "tiles"
>;

export function PreviewPanel(props: PreviewPanelProps) {
  const { questMeta, isInvestigation, uses, entries, differentQuestMonster, tiles } = props;
  const primaryMonster = props.monsterOf(props.primary);

  return (
    <div className="h3p">
      <div className="h3pl">
        <small>Preview</small>
        <span className="hmp">
          <b>+{props.masteryPreview}</b> MP
        </span>
      </div>
      <div className="aRec">
        <div className="aHead">
          <div className="aH1">
            <span className="aQ">
              <Icon name={questMeta.icon} />
              {questMeta.label}
              {isInvestigation ? ` · ${uses} left` : ""}
            </span>
          </div>
          <div className="aH2">
            <span className="aN">
              {entries.length} crown{entries.length === 1 ? "" : "s"}
            </span>
            {differentQuestMonster && primaryMonster.image_name && (
              <span className="aPm">
                <Image
                  src={`/monsters/${primaryMonster.image_name}`}
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                  className="px"
                />
                {primaryMonster.name}
              </span>
            )}
          </div>
        </div>
        <div className="aParty">
          {tiles.map((tile, index) => (
            <HuntTile key={index} tile={tile} />
          ))}
          {Array.from({ length: Math.max(0, MAX_CROWNS - tiles.length) }, (_, index) => (
            <div key={`ghost-${index}`} className="aM ghost" />
          ))}
        </div>
      </div>
    </div>
  );
}
