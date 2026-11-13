import type { ProfileCrown } from "@/server/services/profile";

export type CrownGroup = ProfileCrown[];

export function groupCrowns(crowns: ProfileCrown[]): CrownGroup[] {
  const groups: CrownGroup[] = [];
  const seenPairs = new Set<string>();
  const seenInvestigations = new Set<number>();

  for (const crown of crowns) {
    if (crown.pair_id) {
      if (seenPairs.has(crown.pair_id)) continue;
      seenPairs.add(crown.pair_id);
      const group = crowns.filter((other) => other.pair_id === crown.pair_id);
      for (const member of group) {
        if (member.investigation_id) seenInvestigations.add(member.investigation_id);
      }
      groups.push(group);
    } else if (crown.investigation_id) {
      if (seenInvestigations.has(crown.investigation_id)) continue;
      seenInvestigations.add(crown.investigation_id);
      groups.push(
        crowns.filter(
          (other) => other.investigation_id === crown.investigation_id && !other.pair_id,
        ),
      );
    } else {
      groups.push([crown]);
    }
  }
  return groups;
}

export function groupKey(group: CrownGroup): string {
  const first = group[0];
  if (!first) return "empty";
  if (first.pair_id) return `p${first.pair_id}`;
  if (first.investigation_id) return `i${first.investigation_id}`;
  return `s${first.id}`;
}
