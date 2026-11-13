import Image from "next/image";
import type { ReactNode } from "react";
import type { RegistryMonster } from "@/server/services/registry";
import type { BoardSort } from "../lib/board";

function Pips({ mine }: { mine: { s: number; l: number } }) {
  return (
    <div className="m2y" title="Your crowns">
      <span className={mine.s ? "on" : ""}>
        <Image src="/icons/smallcrown.png" alt="Small" width={18} height={18} className="px" />
        {mine.s}
      </span>
      <span className={mine.l ? "on" : ""}>
        <Image src="/icons/largecrown.png" alt="Large" width={18} height={18} className="px" />
        {mine.l}
      </span>
    </div>
  );
}

interface ItemProps {
  monster: RegistryMonster;
  signedIn: boolean;
  onOpen: () => void;
  pin: ReactNode;
  log: ReactNode;
}

export function MonsterCard({ monster, signedIn, onOpen, pin, log }: ItemProps) {
  return (
    <div className={`m2 ${signedIn && monster.isCompleted ? "done" : ""}`} onClick={onOpen}>
      <div className="m2t">
        <div className="m2a">
          <Image
            src={`/monsters/${monster.image_name}`}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="px"
          />
        </div>
        <div className="m2n">
          <b>{monster.name}</b>
          <span>{monster.type}</span>
        </div>
        {pin}
      </div>
      <div className="m2s">
        <div>
          <b className="dm">{monster.demand}</b>
          <span>Seeking</span>
        </div>
        <div>
          <b>{monster.hostCount.small}</b>
          <span>S. hosts</span>
        </div>
        <div>
          <b>{monster.hostCount.large}</b>
          <span>L. hosts</span>
        </div>
      </div>
      <div className="m2f">
        {signedIn ? <Pips mine={monster.mine} /> : <span />}
        {log}
      </div>
    </div>
  );
}

interface TableProps {
  monsters: RegistryMonster[];
  signedIn: boolean;
  sort: BoardSort;
  onSort: (sort: BoardSort) => void;
  onOpen: (name: string) => void;
  pin: (monster: RegistryMonster) => ReactNode;
  log: (monster: RegistryMonster) => ReactNode;
}

export function MonsterTable({ monsters, signedIn, sort, onSort, onOpen, pin, log }: TableProps) {
  const header = (key: BoardSort, label: string) => (
    <button className={sort === key ? "on" : ""} onClick={() => onSort(key)}>
      {label}
    </button>
  );

  return (
    <div className="tbl">
      <div className="th">
        {header("Name", "Monster")}
        {header("Demand", "Seeking")}
        {header("S. Hosts", "S. hosts")}
        {header("L. Hosts", "L. hosts")}
        <span>You</span>
        <span />
      </div>
      {monsters.map((monster) => (
        <div key={monster.id} className="tr" onClick={() => onOpen(monster.name)}>
          <div className="m">
            <div className="mi">
              <Image
                src={`/monsters/${monster.image_name}`}
                alt=""
                width={30}
                height={30}
                unoptimized
                className="px"
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <b>{monster.name}</b>
              <span>
                {monster.type}
                <em className="mdm">{monster.demand} seeking</em>
              </span>
            </div>
          </div>
          <div className="c dm">{monster.demand}</div>
          <div className="c sh">{monster.hostCount.small}</div>
          <div className="c sh">{monster.hostCount.large}</div>
          {signedIn ? <Pips mine={monster.mine} /> : <div />}
          <div className="ract">
            {log(monster)}
            {pin(monster)}
          </div>
        </div>
      ))}
    </div>
  );
}
