import { Icon } from "@/shared/ui";

export interface Draft {
  lobby: string;
  pass: string;
  status: string;
  dms: boolean;
  shareUrl: boolean;
}

interface SettingsFieldsProps {
  draft: Draft;
  onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}

export function SettingsFields({ draft, onChange: set }: SettingsFieldsProps) {
  return (
    <>
      <section className="stsec">
        <div className="sth">
          <span className="sti">
            <Icon name="flag" />
          </span>
          <div>
            <b>Lobby</b>
            <small>Shown on your profile so hosts can join you.</small>
          </div>
        </div>
        <div className="fld2">
          <label htmlFor="sf1">Default session ID</label>
          <input
            id="sf1"
            value={draft.lobby}
            onChange={(event) => set("lobby", event.target.value)}
            placeholder="e.g. 999DT8L8"
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="fld2">
          <label htmlFor="sf2">Quest password</label>
          <input
            id="sf2"
            value={draft.pass}
            onChange={(event) => set("pass", event.target.value.replace(/\D/g, ""))}
            placeholder="4 digits, e.g. 1234"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
          />
        </div>
      </section>
      <section className="stsec">
        <div className="sth">
          <span className="sti">
            <Icon name="chat" />
          </span>
          <div>
            <b>Status</b>
            <small>A short note other hunters see under your name.</small>
          </div>
        </div>
        <div className="fld2">
          <label htmlFor="sf3">Status message</label>
          <input
            id="sf3"
            value={draft.status}
            onChange={(event) => set("status", event.target.value)}
            placeholder="Hunting Rathalos tonight..."
            maxLength={120}
            autoComplete="off"
          />
          <span className="cnt2">{draft.status.length}/120</span>
        </div>
      </section>
      <section className="stsec">
        <div className="strow">
          <div>
            <b>Discord DMs</b>
            <small>Let other hunters contact you through Discord.</small>
          </div>
          <button
            className="sw"
            role="switch"
            aria-checked={draft.dms}
            aria-label="Receive Discord DMs"
            onClick={() => set("dms", !draft.dms)}
          />
        </div>
      </section>
      <section className="stsec">
        <div className="strow">
          <div>
            <b>Crown Guild link</b>
            <small>Add your profile link when copying crowns. Shows an embed.</small>
          </div>
          <button
            className="sw"
            role="switch"
            aria-checked={draft.shareUrl}
            aria-label="Include Crown Guild link when copying crowns"
            onClick={() => set("shareUrl", !draft.shareUrl)}
          />
        </div>
      </section>
    </>
  );
}

interface DangerZoneProps {
  confirming: boolean;
  busy: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function DangerZone({
  confirming: confirmDelete,
  busy,
  onAsk,
  onCancel,
  onDelete,
}: DangerZoneProps) {
  return (
    <section className="stsec dz2">
      <div className="strow">
        <div>
          <b>Delete account</b>
          <small>Permanently remove your data from the Guild Registry.</small>
        </div>
        {!confirmDelete && (
          <button className="tbx danger" onClick={() => onAsk()}>
            Delete
          </button>
        )}
      </div>
      {confirmDelete && (
        <div className="dzc">
          <span>This deletes your account and all your crowns. Are you sure?</span>
          <div>
            <button className="tbx" onClick={() => onCancel()}>
              Keep account
            </button>
            <button className="tbx danger solid" disabled={busy} onClick={onDelete}>
              Yes, delete
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
