import "server-only";
import { createClient } from "@libsql/client";
import { env } from "@/env";

export const db = createClient({ url: env.TURSO_DB_URL, authToken: env.TURSO_AUTH_TOKEN });
