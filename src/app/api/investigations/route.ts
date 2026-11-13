import { NextResponse } from "next/server";
import { withUser } from "@/server/http";
import { listInvestigations } from "@/server/services/investigations";

export const GET = withUser(null, async ({ user }) =>
  NextResponse.json(await listInvestigations(user.id)),
);
