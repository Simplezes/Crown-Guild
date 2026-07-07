import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusherServer, userChannel } from "@/lib/pusher";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = new URLSearchParams(await request.text());
  const socketId = body.get("socket_id");
  const channelName = body.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  if (channelName !== userChannel(session.user.id)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
