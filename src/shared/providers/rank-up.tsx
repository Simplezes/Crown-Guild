"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Emblem } from "@/shared/ui";

export interface RankUpInfo {
  rank: number;
  title: string;
}

type CelebrateRankUp = (rankUp: RankUpInfo | null | undefined) => void;

const RankUpContext = createContext<CelebrateRankUp | null>(null);

export function useRankUp(): CelebrateRankUp {
  const context = useContext(RankUpContext);
  if (!context) throw new Error("useRankUp must be used inside RankUpProvider");
  return context;
}

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: Math.round((i * 137.5) % 100),
  delay: (i % 7) * 0.09,
  drift: ((i % 5) - 2) * 18,
  hue: (i * 47) % 360,
}));

function RankUpOverlay({ rankUp, onClose }: { rankUp: RankUpInfo; onClose: () => void }) {
  return (
    <div className="rupwrap" onClick={onClose}>
      <div className="rupfx" aria-hidden="true">
        {CONFETTI.map((piece, index) => (
          <i
            key={index}
            style={
              {
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                "--drift": `${piece.drift}px`,
                background: `hsl(${piece.hue} 80% 60%)`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div
        className="rupcard"
        role="alertdialog"
        aria-label="Rank up"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="rupeyebrow">Rank up</span>
        <div className="rupbadge">
          <Emblem rank={rankUp.rank} />
        </div>
        <h2>{rankUp.title}</h2>
        <p>You&apos;ve earned a new Hunter rank.</p>
        <button className="tbx pri" onClick={onClose}>
          Nice!
        </button>
      </div>
    </div>
  );
}

export function RankUpProvider({ children }: { children: ReactNode }) {
  const [rankUp, setRankUp] = useState<RankUpInfo | null>(null);
  const celebrate = useCallback<CelebrateRankUp>((next) => {
    if (next) setRankUp(next);
  }, []);

  return (
    <RankUpContext.Provider value={celebrate}>
      {children}
      {rankUp && <RankUpOverlay rankUp={rankUp} onClose={() => setRankUp(null)} />}
    </RankUpContext.Provider>
  );
}
