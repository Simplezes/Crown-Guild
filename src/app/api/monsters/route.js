import { getAllMonsters } from "@/lib/monsters";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const monsters = await getAllMonsters();
    return NextResponse.json(monsters);
  } catch (error) {
    console.error("Failed to fetch monsters:", error);
    return NextResponse.json({ error: "Failed to fetch monsters" }, { status: 500 });
  }
}
