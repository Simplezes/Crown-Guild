"use client";

import { useRouter } from "next/navigation";
import { useConfirm, useToast } from "@/shared/providers";
import type { CrownGroup } from "../lib/crown-groups";

const shareNonce = () => Date.now().toString(36);

interface HuntActionsOptions {
  profileUserId: string;
  onDeleted: () => void;
}

interface InvestigationResponse {
  removed: boolean;
  remaining_uses?: number;
}

export function useHuntActions({ profileUserId, onDeleted }: HuntActionsOptions) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const remove = async (groups: CrownGroup[]) => {
    const records = groups.length;
    const crowns = groups.reduce((sum, group) => sum + group.length, 0);
    const accepted = await confirm(
      `This removes ${crowns} crown${crowns === 1 ? "" : "s"} and the Mastery Points they earned. It cannot be undone.`,
      {
        title: `Delete ${records === 1 ? "this hunt record" : `these ${records} hunt records`}?`,
        danger: true,
        confirmLabel: "Delete",
      },
    );
    if (!accepted) return;

    try {
      const results = await Promise.all(
        groups.flat().map((crown) => fetch(`/api/crowns/${crown.id}`, { method: "DELETE" })),
      );
      if (results.some((result) => !result.ok)) throw new Error();
      toast.success(`Deleted ${records} hunt record${records === 1 ? "" : "s"}.`);
      onDeleted();
      router.refresh();
    } catch {
      toast.error("Could not delete every crown.");
    }
  };

  const share = (group: CrownGroup) => {
    const first = group[0];
    if (!first) return;
    const url = `${window.location.origin}/monster/${encodeURIComponent(first.name)}?crownId=${first.id}&user=${profileUserId}&share=${shareNonce()}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    toast.info("Link copied to your clipboard.");
  };

  const spendCharge = async (group: CrownGroup) => {
    const investigationId = group[0]?.investigation_id;
    if (!investigationId) return;
    try {
      const response = await fetch(`/api/investigations/${investigationId}`, { method: "PATCH" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as InvestigationResponse;
      if (data.removed) toast.success("Investigation used up — record removed.");
      else toast.info(`${data.remaining_uses} use${data.remaining_uses === 1 ? "" : "s"} left.`);
      router.refresh();
    } catch {
      toast.error("Could not update the investigation.");
    }
  };

  return { remove, share, spendCharge };
}
