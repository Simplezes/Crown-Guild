import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  redirect(session ? `/profile/${session.user.id}?settings=true` : "/");
}
