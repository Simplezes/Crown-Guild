export type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export const success = <T>(data: T): Result<T> => ({ ok: true, data });

export const failure = (status: number, error: string): Result<never> => ({
  ok: false,
  status,
  error,
});
