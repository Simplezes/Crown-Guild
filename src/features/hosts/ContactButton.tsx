"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRankUp, type RankUpInfo } from "@/shared/providers";
import { Icon } from "@/shared/ui";
import { ContactDialog, DeployDialog } from "./ContactDialogs";

type Status = "idle" | "loading" | "copied" | "shared" | "deployed" | "error";

const nonce = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface ContactButtonProps {
  hostId: string;
  monsterId: number;
  monsterName: string;
  crownId: number;
  discordId: string | null;
  quest: string;
  canDeploy?: boolean;
  dmsOpen?: boolean;
}

interface DeployResponse {
  error?: string;
  rankUp?: RankUpInfo | null;
}

export function ContactButton({
  hostId,
  monsterName,
  crownId,
  discordId,
  quest,
  canDeploy = false,
  dmsOpen = true,
}: ContactButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const celebrateRankUp = useRankUp();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isOwn = session?.user?.id === hostId;
  const showDeploy = isOwn && canDeploy;
  const busy = status === "loading";

  useEffect(() => {
    if (!menu && !confirm) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(false);
      setConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu, confirm]);

  const flash = (next: Status, then?: () => void) => {
    setStatus(next);
    setTimeout(() => {
      setStatus("idle");
      then?.();
    }, 1400);
  };

  const copyTag = () => {
    navigator.clipboard?.writeText(discordId || hostId);
    flash("copied", () => setMenu(false));
  };

  const shareLink = () => {
    const url = `${window.location.origin}/monster/${encodeURIComponent(monsterName)}?crownId=${crownId}&user=${hostId}&share=${nonce()}`;
    navigator.clipboard?.writeText(url);
    flash("shared", () => setMenu(false));
  };

  const deploy = async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/crowns/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crownId }),
      });
      const data = (await response.json()) as DeployResponse;
      if (response.ok) {
        flash("deployed", () => {
          setConfirm(false);
          router.refresh();
          if (data.rankUp) celebrateRankUp(data.rankUp);
        });
      } else {
        setError(data.error || "Failed to deploy crown");
        flash("error");
      }
    } catch {
      setError("Network error");
      flash("error");
    }
  };

  if (isOwn && !showDeploy) return null;

  if (showDeploy) {
    return (
      <>
        <button
          className="hk-btn dep"
          onClick={() => setConfirm(true)}
          disabled={busy}
          title={
            quest === "Investigation Quests"
              ? "Spend one investigation use and mark as deployed"
              : "Deploy crown"
          }
        >
          <Icon name="flag" />
          {status === "deployed" ? "Deployed!" : "Deploy crown"}
        </button>
        {confirm && (
          <DeployDialog
            busy={busy}
            error={error}
            onCancel={() => setConfirm(false)}
            onConfirm={deploy}
          />
        )}
      </>
    );
  }

  if (!dmsOpen) {
    return (
      <button
        className="hk-btn off"
        disabled
        title="This hunter has Discord DMs turned off, so they can't be contacted."
      >
        <Icon name="chat" />
        DMs closed
      </button>
    );
  }

  return (
    <>
      <button className="hk-btn" onClick={() => setMenu(true)} disabled={busy}>
        <Icon name="chat" />
        Contact hunter
      </button>
      {menu && (
        <ContactDialog
          hostId={hostId}
          discordId={discordId}
          copied={status === "copied"}
          shared={status === "shared"}
          onCopy={copyTag}
          onShare={shareLink}
          onClose={() => setMenu(false)}
        />
      )}
    </>
  );
}
