const normalize = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = (previous[j - 1] ?? 0) + (left[i - 1] === right[j - 1] ? 0 : 1);
      current[j] = Math.min((current[j - 1] ?? 0) + 1, (previous[j] ?? 0) + 1, substitution);
    }
    previous = current;
  }
  return previous[right.length] ?? 0;
}

function fuzzyDistance(query: string, name: string, tolerance: number): number {
  let best = tolerance + 1;
  const minLength = Math.max(1, query.length - tolerance);
  const maxLength = Math.min(name.length, query.length + tolerance);
  for (let length = minLength; length <= maxLength && best > 0; length += 1) {
    for (let start = 0; start <= name.length - length && best > 0; start += 1) {
      best = Math.min(best, editDistance(query, name.slice(start, start + length)));
    }
  }
  return best;
}

export function monsterMatchScore(query: string, name: string): number | null {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(name);
  if (!normalizedQuery || !normalizedName) return null;
  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;

  const index = normalizedName.indexOf(normalizedQuery);
  if (index >= 0) return 2 + index / 100;
  if (normalizedQuery.length < 3 || normalizedQuery.length > normalizedName.length + 2) return null;

  const tolerance = Math.min(2, Math.max(1, Math.floor(normalizedQuery.length / 4)));
  const distance = fuzzyDistance(normalizedQuery, normalizedName, tolerance);
  return distance <= tolerance ? 3 + distance : null;
}

export function suggestMonsters<T extends { name: string }>(monsters: T[], query: string): T[] {
  if (!query.trim()) return [];
  return monsters
    .map((monster) => ({ monster, score: monsterMatchScore(query, monster.name) }))
    .filter((entry): entry is { monster: T; score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score || a.monster.name.localeCompare(b.monster.name))
    .slice(0, 5)
    .map((entry) => entry.monster);
}
