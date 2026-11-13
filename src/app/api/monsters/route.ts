import { NextResponse } from "next/server";
import { jsonError } from "@/server/http";
import { logServerError } from "@/server/logger";
import { getAllMonstersEnriched } from "@/server/services/monsters";

export async function GET() {
  try {
    const monsters = await getAllMonstersEnriched();
    return NextResponse.json(
      monsters.map((m) => ({
        id: m.id,
        name: m.name,
        image_name: m.image_name,
        emoji: m.emoji,
        type: m.type || "Monster",
      })),
    );
  } catch (error) {
    logServerError("Failed to fetch monsters", error);
    return jsonError("Failed to fetch monsters", 500);
  }
}
