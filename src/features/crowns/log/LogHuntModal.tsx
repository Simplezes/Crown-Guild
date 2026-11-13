"use client";

import { useMonsterOptions } from "@/shared/hooks/useMonsterOptions";
import { Icon } from "@/shared/ui";
import { CrownEntry } from "./CrownEntry";
import { MonsterPicker } from "./MonsterPicker";
import { PreviewPanel } from "./PreviewPanel";
import { QuestPanel } from "./QuestPanel";
import { MAX_CROWNS, type GroupCrown } from "./types";
import { useLogForm } from "./useLogForm";

interface LogHuntModalProps {
  monsterId: number | null;
  initialGroup: GroupCrown[] | null;
  onClose: () => void;
}

export function LogHuntModal({ monsterId, initialGroup, onClose }: LogHuntModalProps) {
  const monsters = useMonsterOptions();
  const form = useLogForm({ monsterId, initialGroup, monsters, onClose });
  const { editing, entries, pick } = form;

  const selectMonster = (id: number) => {
    if (pick === "primary") form.setPrimaryId(id);
    else if (typeof pick === "number") form.updateEntry(pick, { monster_id: id });
    form.setPick(null);
  };

  return (
    <div
      className="lmodal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="mform h3"
        role="dialog"
        aria-label={editing ? "Edit hunt record" : "Log a crown"}
      >
        <aside className="h3l">
          <div>
            <span className="eyebrow">Crown Ledger</span>
            <h2>{editing ? "Edit hunt record" : "Log a crown"}</h2>
          </div>
          <QuestPanel {...form} />
          <PreviewPanel {...form} />
        </aside>

        <section className="h3r">
          <div className="h3rh">
            <span>Crowns</span>
            <em>
              {entries.length} of {MAX_CROWNS}
            </em>
            <button className="x2" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="h3es">
            {entries.map((entry, index) => (
              <CrownEntry
                key={index}
                entry={entry}
                index={index}
                monster={form.monsterOf(entry.monster_id)}
                canRemove={entries.length > 1}
                onChange={(patch) => form.updateEntry(index, patch)}
                onRemove={() => form.removeEntry(index)}
                onPickMonster={() => {
                  form.setPick(index);
                  form.setPickQuery("");
                }}
              />
            ))}
            {Array.from({ length: form.freeSlots }, (_, slot) => (
              <button key={`add-${slot}`} className="hadd h3add" onClick={form.addEntry}>
                <Icon name="plus" />
                <b>Add monster</b>
                <span>slot free</span>
              </button>
            ))}
          </div>
          <div className="h3ft">
            <span className="hsm">
              {editing ? "Saving updates this record" : "MP is earned when you log"}
            </span>
            <button className="tbx" onClick={onClose}>
              Cancel
            </button>
            <button className="tbx pri wide" onClick={form.submit} disabled={form.loading}>
              {form.loading ? "Saving…" : editing ? "Save changes" : "Log crown"}
            </button>
          </div>
        </section>

        {pick !== null && (
          <MonsterPicker
            monsters={monsters}
            query={form.pickQuery}
            current={form.pickCurrent}
            onQuery={form.setPickQuery}
            onSelect={(monster) => selectMonster(monster.id)}
            onClose={() => form.setPick(null)}
          />
        )}
      </div>
    </div>
  );
}
