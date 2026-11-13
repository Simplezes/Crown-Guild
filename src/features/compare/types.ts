export type { CompareSide } from "@/server/services/compare-page";

export interface CompareItem {
  id: number;
  name: string;
  image: string | null;
  type: string;
}

export interface CompareResult {
  shared: CompareItem[];
  onlyA: CompareItem[];
  onlyB: CompareItem[];
  sharedSpecies: number;
  onlyOwnedA: number;
  onlyOwnedB: number;
}
