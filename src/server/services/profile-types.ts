export interface ProfileUser {
  id: string;
  username: string;
  avatar_url: string | null;
  lobby_id: string | null;
  quest_password: string | null;
  status_message: string | null;
  receive_dms: number | null;
}

export interface ProfileCrown {
  id: number;
  monster_id: number;
  name: string;
  emoji: string | null;
  image_name: string | null;
  type: "small" | "large";
  tempered: number;
  strength_rating: number;
  quest: string;
  investigation_id: number | null;
  pair_id: string | null;
  size_cm: number | null;
  size_label: string | null;
  remaining_uses: number | null;
  inv_monster_id: number | null;
  inv_monster_name: string | null;
  inv_monster_image: string | null;
  inv_monster_emoji: string | null;
}

export interface MonsterListing {
  monster_id: number;
  monster_name: string;
  emoji: string | null;
  image_name: string | null;
  type: "small" | "large" | "both";
  tempered?: number;
}

export interface ProfileData {
  user: ProfileUser;
  crowns: ProfileCrown[];
  wishlist: MonsterListing[];
  collection: MonsterListing[];
  stats: { total: number; small: number; large: number; tempered: number };
  completion: string;
  masteryPoints: number;
}

export interface CrownDetail {
  id: number;
  user_id: string;
  type: "small" | "large";
  tempered: number;
  strength_rating: number;
  quest: string;
  monster_name: string;
  monster_image: string | null;
  username: string | null;
  avatar_url: string | null;
  status_message: string | null;
  remaining_uses: number | null;
  inv_monster_name: string | null;
  inv_monster_image: string | null;
  inv_monster_emoji: string | null;
}
