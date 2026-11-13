import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { auth } from "@/server/auth";
import { checkRateLimit, type LimitKey } from "@/server/ratelimit";
import { logServerError } from "@/server/logger";
import type { Result } from "@/server/result";

export interface SessionUser {
  id: string;
  name: string | null;
  image: string | null;
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export const ok = <T extends object>(body?: T) => NextResponse.json({ success: true, ...body });

export const fromResult = <T extends object>(result: Result<T>) =>
  result.ok ? ok(result.data) : jsonError(result.error, result.status);

export function parseQuery<T>(
  req: Request,
  schema: ZodType<T>,
): { data: T } | { response: Response } {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    return { response: jsonError(result.error.issues[0]?.message ?? "Invalid request", 400) };
  }
  return { data: result.data };
}

interface RouteContext<P> {
  params: Promise<P>;
}

interface HandlerArgs<P> {
  req: Request;
  user: SessionUser;
  params: P;
}

export function withUser<P extends Record<string, string> = Record<string, string>>(
  limit: LimitKey | null,
  handler: (args: HandlerArgs<P>) => Promise<Response>,
) {
  return async (req: Request, context: RouteContext<P>): Promise<Response> => {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    if (limit) {
      const limited = await checkRateLimit(limit, session.user.id);
      if (limited) return limited;
    }

    const user: SessionUser = {
      id: session.user.id,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    };

    try {
      return await handler({ req, user, params: await context.params });
    } catch (error) {
      logServerError(`${req.method} ${new URL(req.url).pathname} failed`, error);
      return jsonError("Internal Server Error", 500);
    }
  };
}

export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: jsonError("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { response: jsonError(result.error.issues[0]?.message ?? "Invalid request", 400) };
  }
  return { data: result.data };
}
