"use client";

import type { RankView } from "@/config/mastery";
import { useToast } from "@/shared/providers";
import { Emblem, Icon } from "@/shared/ui";

interface ProfileSidebarProps {
  rank: RankView;
  mp: number;
  stats: { total: number; small: number; large: number; tempered: number };
  user: { lobby_id: string; quest_password: string };
  isOwner: boolean;
  onEdit: () => void;
}

function CopyRow({ label, value, copyLabel }: { label: string; value: string; copyLabel: string }) {
  const toast = useToast();
  return (
    <div className="lrow2">
      <div>
        <small>{label}</small>
        <code>{value}</code>
      </div>
      <button
        className="cp"
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => undefined);
          toast.info("Copied to your clipboard.");
        }}
        aria-label={copyLabel}
        title="Copy"
      >
        <Icon name="copy" />
      </button>
    </div>
  );
}

export function ProfileSidebar({ rank, mp, stats, user, isOwner, onEdit }: ProfileSidebarProps) {
  return (
    <aside className="pf-side">
      <section className="wd pf-rank">
        <div className="pf-rt">
          <div className="pf-re">
            <Emblem rank={rank.rank} />
          </div>
          <div>
            <small>Mastery</small>
            <b>{rank.title}</b>
            <span>{mp} MP</span>
          </div>
        </div>
        <div className="ladder mini" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => {
            const state = index + 1 < rank.rank ? "done" : index + 1 === rank.rank ? "cur" : "lock";
            return (
              <div key={index} className={`rg ${state}`}>
                <div className="rge">
                  <Emblem rank={index + 1} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="pf-next">
          {rank.nextTitle ? (
            <>
              <b>{rank.toNext} MP</b> to reach {rank.nextTitle}
            </>
          ) : (
            "Highest rank reached"
          )}
        </p>
        <div className="pf-tiles">
          <div>
            <b>{stats.total}</b>
            <span>Crowns</span>
          </div>
          <div>
            <b>{stats.small}</b>
            <span>Small</span>
          </div>
          <div>
            <b>{stats.large}</b>
            <span>Large</span>
          </div>
          <div>
            <b>{stats.tempered}</b>
            <span>Tempered</span>
          </div>
        </div>
      </section>
      {(user.lobby_id || isOwner) && (
        <section className="wd pf-lobby">
          <div className="wh">
            <h3>Lobby info</h3>
            {isOwner && (
              <button className="lnk" onClick={onEdit}>
                Edit
              </button>
            )}
          </div>
          {user.lobby_id ? (
            <>
              <CopyRow label="Lobby ID" value={user.lobby_id} copyLabel="Copy lobby ID" />
              {user.quest_password && (
                <CopyRow label="Passcode" value={user.quest_password} copyLabel="Copy passcode" />
              )}
            </>
          ) : (
            <p className="ptip" style={{ margin: 0 }}>
              No active lobby. Standing by.
            </p>
          )}
        </section>
      )}
    </aside>
  );
}
