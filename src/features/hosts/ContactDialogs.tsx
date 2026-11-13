import { createPortal } from "react-dom";
import { Icon } from "@/shared/ui";

interface DeployDialogProps {
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeployDialog({ busy, error, onCancel, onConfirm }: DeployDialogProps) {
  return createPortal(
    <div className="cfmwrap" onClick={() => !busy && onCancel()}>
      <div
        className="cfm"
        role="alertdialog"
        aria-label="Confirm deploy"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="cfi ok">
          <Icon name="flag" />
        </span>
        <h3>Spend an investigation use?</h3>
        <p>This lowers the remaining uses for this crown by 1.</p>
        {error && <p className="cfe">{error}</p>}
        <div className="cfb">
          <button className="tbx" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="tbx pri" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : "Yes, deploy"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ContactDialogProps {
  hostId: string;
  discordId: string | null;
  copied: boolean;
  shared: boolean;
  onCopy: () => void;
  onShare: () => void;
  onClose: () => void;
}

export function ContactDialog({
  hostId,
  discordId,
  copied,
  shared,
  onCopy,
  onShare,
  onClose,
}: ContactDialogProps) {
  return createPortal(
    <div className="cfmwrap" onClick={onClose}>
      <div
        className="cfm ctm"
        role="dialog"
        aria-label="Contact options"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tm-h">
          <b>Contact {discordId || "hunter"}</b>
          <button className="x2" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <a
          className="tm-o"
          href={`https://discord.com/users/${hostId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
        >
          <span className="tm-i">
            <Icon name="chat" />
          </span>
          <span className="tm-t">
            <b>Discord profile</b>
            <small>Opens Discord</small>
          </span>
          <span className="tm-c">
            <Icon name="open" />
          </span>
        </a>
        <button className="tm-o" onClick={onCopy}>
          <span className="tm-i">
            <Icon name="copy" />
          </span>
          <span className="tm-t">
            <b>{copied ? "Copied!" : "Copy Discord ID"}</b>
            <small>To add them manually</small>
          </span>
        </button>
        <button className="tm-o" onClick={onShare}>
          <span className="tm-i">
            <Icon name="link" />
          </span>
          <span className="tm-t">
            <b>{shared ? "Link copied!" : "Share this crown"}</b>
            <small>Copy a link to it</small>
          </span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
