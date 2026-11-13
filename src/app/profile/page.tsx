import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function ProfilePage() {
  const session = await auth();
  redirect(session?.user?.id ? `/profile/${session.user.id}` : "/");
}
