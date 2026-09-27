import { getAllMonsters } from "@/lib/monsters";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";

export async function GET() {
  try {
    const monsters = await getAllMonsters(true);
    return NextResponse.json(monsters.map((m) => ({ id: m.id, name: m.name, image_name: m.image_name, emoji: m.emoji, type: m.type || "Monster" })));
  } catch (error) {
    logServerError("Failed to fetch monsters:", error);
    return NextResponse.json({ error: "Failed to fetch monsters" }, { status: 500 });
  }
}
