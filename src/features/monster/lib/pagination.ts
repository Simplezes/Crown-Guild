export type SearchParams = Record<string, string | string[] | undefined>;

export const MONSTER_LIST_PAGE_SIZE = 5;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePageParam(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(String(firstParam(value) || "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateItems<T>(items: T[], page: number, pageSize = MONSTER_LIST_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, totalPages };
}

export function buildPageHref(
  search: SearchParams,
  updates: Record<string, string | number | false | null | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value == null) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
      if (entry !== "") params.append(key, entry);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "" || value === false) params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "?";
}
