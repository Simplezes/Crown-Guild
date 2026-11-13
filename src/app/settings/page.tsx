import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function SettingsPage() {
  const session = await auth();
  redirect(session ? `/profile/${session.user.id}?settings=true` : "/");
}
