"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLog } from "@/features/crowns";
import { TrackPin } from "@/features/wishlist";
import type { MonsterSummary } from "@/server/services/monster-summary";
import { Icon } from "@/shared/ui";
import { CrownCount, HostsSection } from "./DrawerParts";

const cache = new Map<string, MonsterSummary>();

interface DrawerProps {
  name: string;
  onClose: () => void;
}

export function Drawer({ name, onClose }: DrawerProps) {
  const { openLog } = useLog();
  const pathname = usePathname() || "/";
  const [data, setData] = useState<MonsterSummary | null>(() => cache.get(name) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/monster-summary?name=${encodeURIComponent(name)}`)
      .then((response) =>
        response.ok ? (response.json() as Promise<MonsterSummary>) : Promise.reject(new Error()),
      )
      .then((summary) => {
        cache.set(name, summary);
        if (alive) setData(summary);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [name]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const href = `/monster/${encodeURIComponent(name)}`;
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <div className="ovl">
      <div
        className="dback enter"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <aside className="drawer d2" role="dialog" aria-label={name}>
          <header className="d2h">
            <span>Monster</span>
            <div className="d2hb">
              <Link className="d2op" href={href} onClick={onClose}>
                Open full page
                <Icon name="open" />
              </Link>
              <button className="x" onClick={onClose} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
          </header>
          <div className="d2b">
            <section className="d2hero">
              <div className="d2art">
                {data?.image_name && (
                  <Image
                    src={`/monsters/${data.image_name}`}
                    alt=""
                    width={120}
                    height={120}
                    unoptimized
                    className="px"
                  />
                )}
              </div>
              <div className="d2id">
                <h2>{name}</h2>
                <span className="d2ty">{data?.type || (failed ? "Unavailable" : "Loading")}</span>
              </div>
            </section>
            {data && (
              <>
                <section className="d2st">
                  <div>
                    <b className="dm">{data.demand}</b>
                    <span>Seeking</span>
                  </div>
                  <div>
                    <b>{data.hostCount.small}</b>
                    <span>Small hosts</span>
                  </div>
                  <div>
                    <b>{data.hostCount.large}</b>
                    <span>Large hosts</span>
                  </div>
                </section>
                {data.signedIn && (
                  <section className="d2s">
                    <h3>Your crowns</h3>
                    <div className="d2cs">
                      <CrownCount kind="small" label="Small crown" count={data.mine.s} />
                      <CrownCount kind="large" label="Large crown" count={data.mine.l} />
                    </div>
                  </section>
                )}
                <section className="d2s">
                  <h3>Physiology</h3>
                  <div className="d2p">
                    <div>
                      <small>Element</small>
                      <span className="pl">
                        {data.elements.length ? data.elements.join(", ") : "None"}
                      </span>
                    </div>
                    <div>
                      <small>Weak to</small>
                      <div className="pills2">
                        {data.weakness.length ? (
                          data.weakness.map((weakness) => (
                            <span key={weakness} className="pl w">
                              {weakness}
                            </span>
                          ))
                        ) : (
                          <span className="pl">Unknown</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                <HostsSection summary={data} href={href} onClose={onClose} />
              </>
            )}
          </div>
          <footer className="d2f">
            {data?.signedIn ? (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    onClose();
                    openLog({ monsterId: data.id });
                  }}
                >
                  <Icon name="plus" />
                  Log {name} crown
                </button>
                <TrackPin
                  trigger="d2pin"
                  up
                  monsterId={data.id}
                  name={name}
                  initialType={data.wishlistType}
                />
              </>
            ) : data ? (
              <Link className="btn" href={signInHref} onClick={onClose}>
                Sign in to log
              </Link>
            ) : null}
          </footer>
        </aside>
      </div>
    </div>
  );
}
