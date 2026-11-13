"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/shared/ui";
import type { CompareResult, CompareSide } from "../types";
import { HunterAvatar } from "./HunterAvatar";
import { HunterPicker } from "./HunterPicker";
import { ResultsPanel } from "./ResultsPanel";

interface CompareViewProps {
  a: CompareSide | null;
  b: CompareSide | null;
  result: CompareResult | null;
}

type Side = "a" | "b";

function Selector({
  side,
  hunter,
  active,
  onOpen,
}: {
  side: Side;
  hunter: CompareSide | null;
  active: boolean;
  onOpen: () => void;
}) {
  const label = side.toUpperCase();
  const subtitle = hunter
    ? hunter.rank
      ? `${hunter.rank} · ${hunter.mp} MP`
      : "Selected"
    : "Search the guild registry";

  return (
    <div className="cmp-field">
      <label>Hunter {label}</label>
      <button
        type="button"
        className="cmp-pick"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={active}
        title={`Choose Hunter ${label}`}
      >
        <HunterAvatar hunter={hunter} />
        <span className="cmp-choice">
          <b>{hunter ? hunter.name : "Select hunter"}</b>
          <small>{subtitle}</small>
        </span>
        <Icon name="down" />
      </button>
    </div>
  );
}

export function CompareView({ a: initialA, b: initialB, result }: CompareViewProps) {
  const router = useRouter();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [picker, setPicker] = useState<Side | null>(null);

  const ready = !!a && !!b && a.id !== b.id;
  const run = () => {
    if (a && b && ready)
      router.push(`/compare?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`);
  };
  const showResults =
    !!result &&
    !!initialA?.stats &&
    !!initialB?.stats &&
    initialA.id === a?.id &&
    initialB.id === b?.id;

  return (
    <div className="pad cmp-page">
      <header className="cmp-head">
        <div>
          <h2>Compare hunters</h2>
          <p>Find shared targets and see where each hunter&apos;s goals diverge.</p>
        </div>
        <span className="cmp-tag">Guild registry</span>
      </header>
      <section className="cmp-pair">
        <div className="cmp-pair-head">
          <div>
            <h3>Hunter pairing</h3>
            <p>Choose any two hunters to compare their crowns and wishlists.</p>
          </div>
          <span className="cmp-pair-state">{a && b ? "Pair selected" : "Choose 2 hunters"}</span>
        </div>
        <div className="cmp-selectors">
          <Selector side="a" hunter={a} active={picker === "a"} onOpen={() => setPicker("a")} />
          <span className="cmp-vs">VS</span>
          <Selector side="b" hunter={b} active={picker === "b"} onOpen={() => setPicker("b")} />
          <button type="button" className="btn cmp-run" onClick={run} disabled={!ready}>
            <Icon name="compare" />
            Compare hunters
          </button>
        </div>
      </section>

      {showResults && initialA && initialB && result ? (
        <ResultsPanel a={initialA} b={initialB} result={result} />
      ) : (
        <section className="cmp-empty-state">
          <span className="cmp-empty-icon">
            <Icon name="compare" />
          </span>
          <div>
            <b>{a && b ? "Ready to compare" : "Your comparison starts here"}</b>
            <p>
              {a && b
                ? "Run the comparison to see shared targets, unique crowns, and wishlist differences."
                : "Select two hunters above to reveal shared targets, crown species, and exclusive goals."}
            </p>
          </div>
        </section>
      )}

      {picker && (
        <HunterPicker
          side={picker.toUpperCase()}
          exclude={picker === "a" ? b?.id : a?.id}
          onClose={() => setPicker(null)}
          onPick={(hunter) => {
            (picker === "a" ? setA : setB)(hunter);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}
