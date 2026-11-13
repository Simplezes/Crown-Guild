import "server-only";
import { db, rowsOf } from "@/server/db";

interface CompareUser {
  id: string;
  username: string;
  avatar_url?: string | null;
}

interface CompareEntry {
  monster_id: number;
  type: string;
  tempered: number;
  monster_name: string;
  image_name: string | null;
}

export interface WishlistComparison {
  userA: CompareUser;
  userB: CompareUser;
  both: CompareEntry[];
  onlyA: CompareEntry[];
  onlyB: CompareEntry[];
}

export interface UserListing {
  id: string;
  username: string;
  avatar_url: string | null;
  crown_count: number;
  wishlist_count: number;
}

export interface UserPage {
  users: UserListing[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const WISHLIST_SQL = `
  SELECT w.monster_id, w.type, w.tempered, m.name AS monster_name, m.image_name
  FROM wishlist w JOIN monsters m ON w.monster_id = m.id
  WHERE w.user_id = ? ORDER BY m.name ASC
`;

export async function compareWishlists(a: string, b: string): Promise<WishlistComparison> {
  const [users, listA, listB] = await Promise.all([
    db.execute({
      sql: "SELECT id, username, avatar_url FROM users WHERE id IN (?, ?)",
      args: [a, b],
    }),
    db.execute({ sql: WISHLIST_SQL, args: [a] }),
    db.execute({ sql: WISHLIST_SQL, args: [b] }),
  ]);

  const known = rowsOf<CompareUser>(users);
  const entriesA = rowsOf<CompareEntry>(listA);
  const entriesB = rowsOf<CompareEntry>(listB);
  const idsA = new Set(entriesA.map((entry) => entry.monster_id));
  const idsB = new Set(entriesB.map((entry) => entry.monster_id));

  const fallback = (id: string): CompareUser =>
    known.find((user) => user.id === id) ?? { id, username: "Unknown Hunter" };

  return {
    userA: fallback(a),
    userB: fallback(b),
    both: entriesA.filter((entry) => idsB.has(entry.monster_id)),
    onlyA: entriesA.filter((entry) => !idsB.has(entry.monster_id)),
    onlyB: entriesB.filter((entry) => !idsA.has(entry.monster_id)),
  };
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

export async function searchUsers(
  q: string,
  exclude: string,
  page: number,
  limit: number,
): Promise<UserPage> {
  const pattern = `%${escapeLike(q.toLowerCase())}%`;
  const where = `
    (? = '' OR lower(COALESCE(u.username, '')) LIKE ? ESCAPE '\\')
    AND (? = '' OR u.id <> ?)
  `;
  const filterArgs = [q, pattern, exclude, exclude];

  const [count, rows] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) AS total FROM users u WHERE ${where}`, args: filterArgs }),
    db.execute({
      sql: `
        SELECT u.id,
               COALESCE(NULLIF(u.username, ''), ('Hunter ' || substr(u.id, 1, 4))) AS username,
               u.avatar_url,
               (SELECT COUNT(*) FROM crowns c WHERE c.user_id = u.id) AS crown_count,
               (SELECT COUNT(DISTINCT w.monster_id) FROM wishlist w WHERE w.user_id = u.id) AS wishlist_count
        FROM users u
        WHERE ${where}
        ORDER BY crown_count DESC, wishlist_count DESC, lower(COALESCE(u.username, '')) ASC
        LIMIT ? OFFSET ?
      `,
      args: [...filterArgs, limit, (page - 1) * limit],
    }),
  ]);

  const total = Number(count.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    users: rowsOf<UserListing>(rows),
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
