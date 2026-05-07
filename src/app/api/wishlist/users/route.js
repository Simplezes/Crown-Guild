import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const exclude = (searchParams.get("exclude") || "").trim();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(30, Math.max(5, Number.parseInt(searchParams.get("limit") || "12", 10)));
  const offset = (page - 1) * limit;

  const likePattern = `%${q.toLowerCase()}%`;

  try {
    const [countRes, rowsRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT COUNT(*) AS total
          FROM users u
          WHERE (? = '' OR lower(COALESCE(u.username, '')) LIKE ?)
            AND (? = '' OR u.id <> ?)
        `,
        args: [q, likePattern, exclude, exclude],
      }),
      db.execute({
        sql: `
          SELECT
            u.id,
            COALESCE(NULLIF(u.username, ''), ('Hunter ' || substr(u.id, 1, 4))) AS username,
            u.avatar_url,
            (SELECT COUNT(*) FROM crowns c WHERE c.user_id = u.id) AS crown_count,
            (SELECT COUNT(DISTINCT w.monster_id) FROM wishlist w WHERE w.user_id = u.id) AS wishlist_count
          FROM users u
          WHERE (? = '' OR lower(COALESCE(u.username, '')) LIKE ?)
            AND (? = '' OR u.id <> ?)
          ORDER BY crown_count DESC, wishlist_count DESC, lower(COALESCE(u.username, '')) ASC
          LIMIT ? OFFSET ?
        `,
        args: [q, likePattern, exclude, exclude, limit, offset],
      }),
    ]);

    const total = Number(countRes.rows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      users: rowsRes.rows,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    logServerError("Failed to fetch users for compare picker", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
