import type { ResultSet } from "@libsql/client";

export function rowsOf<T>(result: ResultSet): T[] {
  return result.rows.map((row) => ({ ...row }) as unknown as T);
}

export function firstRow<T>(result: ResultSet): T | null {
  const row = result.rows[0];
  return row ? ({ ...row } as unknown as T) : null;
}

export function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}
