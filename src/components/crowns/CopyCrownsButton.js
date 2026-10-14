"use client";

import { useToast } from "@/app/UIProvider";
import { Icon } from "@/components/shell/Icon";
import { formatCrownShare } from "@/lib/crownShare";

const nonce = () => Date.now().toString(36);

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

export default function CopyCrownsButton({ crowns, userId, className = "", label = "Copy crowns" }) {
  const toast = useToast();

  const copyCrowns = async (mode = "emoji") => {
    if (!crowns || !userId) {
      toast.error("No crowns available to copy.");
      return;
    }
    const shareId = `${nonce()}-${Math.random().toString(36).slice(2, 8)}`;
    const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(userId)}?share=${shareId}`;
    const copied = await copyText(formatCrownShare(crowns, profileUrl, mode));
    if (copied) toast.success("All crowns copied to your clipboard.");
    else toast.error("Could not copy crowns. Check clipboard permissions and try again.");
  };

  return (
    <div className={`pf-copy ${className}`.trim()}>
      <button className="btn o sm" onClick={() => copyCrowns("emoji")} title="Copy all crowns with MH Wilds emotes">
        <Icon name="copy" />
        <span className="pf-copy-lbl">
          <span className="pf-copy-lbl-long">{label}</span>
          <span className="pf-copy-lbl-short">Copy</span>
        </span>
      </button>
      <details
        className="pf-copy-more"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false;
        }}
      >
        <summary className="btn o sm pf-copy-trigger" aria-label="More copy formats" title="More copy formats">
          <Icon name="down" />
        </summary>
        <div className="pf-copy-menu" role="group" aria-label="Copy format">
          <button
            className="pf-copy-option"
            type="button"
            onClick={(e) => {
              copyCrowns("emojiSimple");
              e.currentTarget.closest("details").open = false;
            }}
          >
            Compact emojis
          </button>
          <button
            className="pf-copy-option"
            type="button"
            onClick={(e) => {
              copyCrowns("plain");
              e.currentTarget.closest("details").open = false;
            }}
          >
            Plain text
          </button>
        </div>
      </details>
    </div>
  );
}
