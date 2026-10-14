import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  redirect(session?.user?.id ? `/profile/${session.user.id}` : "/");
}
