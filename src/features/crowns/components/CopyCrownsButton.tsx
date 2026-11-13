"use client";

import { useToast } from "@/shared/providers";
import { copyText } from "@/shared/lib/clipboard";
import { Icon } from "@/shared/ui";
import { formatCrownShare, type ShareCrown, type ShareMode } from "../lib/share";

const shareId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface CopyCrownsButtonProps {
  crowns: ShareCrown[];
  userId: string;
  includeUrl: boolean;
  className?: string;
  label?: string;
}

export function CopyCrownsButton({
  crowns,
  userId,
  includeUrl,
  className = "",
  label = "Copy crowns",
}: CopyCrownsButtonProps) {
  const toast = useToast();

  const copy = async (mode: ShareMode, menu?: HTMLDetailsElement | null) => {
    if (menu) menu.open = false;
    if (!crowns || !userId) {
      toast.error("No crowns available to copy.");
      return;
    }
    const url = includeUrl
      ? `${window.location.origin}/profile/${encodeURIComponent(userId)}?share=${shareId()}`
      : null;
    const copied = await copyText(formatCrownShare(crowns, url, mode));
    if (copied) toast.success("All crowns copied to your clipboard.");
    else toast.error("Could not copy crowns. Check clipboard permissions and try again.");
  };

  return (
    <div className={`pf-copy ${className}`.trim()}>
      <button
        className="btn o sm"
        onClick={() => copy("emoji")}
        title="Copy all crowns with MH Wilds emotes"
      >
        <Icon name="copy" />
        <span className="pf-copy-lbl">
          <span className="pf-copy-lbl-long">{label}</span>
          <span className="pf-copy-lbl-short">Copy</span>
        </span>
      </button>
      <details
        className="pf-copy-more"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        }}
      >
        <summary
          className="btn o sm pf-copy-trigger"
          aria-label="More copy formats"
          title="More copy formats"
        >
          <Icon name="down" />
        </summary>
        <div className="pf-copy-menu" role="group" aria-label="Copy format">
          <button
            className="pf-copy-option"
            type="button"
            onClick={(event) => copy("emojiSimple", event.currentTarget.closest("details"))}
          >
            Compact emojis
          </button>
          <button
            className="pf-copy-option"
            type="button"
            onClick={(event) => copy("plain", event.currentTarget.closest("details"))}
          >
            Plain text
          </button>
        </div>
      </details>
    </div>
  );
}
