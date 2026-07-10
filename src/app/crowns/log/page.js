import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCrownsByIds } from "@/lib/profile";
import HuntRecordForm from "@/components/crowns/HuntRecordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log a Crown | Crown Guild",
};

export default async function LogCrownPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/");

  const search = await searchParams;
  const editIds = search?.edit
    ? String(search.edit).split(",").map(s => Number.parseInt(s.trim(), 10)).filter(Number.isFinite)
    : [];

  let initialGroup = null;
  if (editIds.length > 0) {
    const crowns = await getCrownsByIds(editIds);
    const owned = crowns.filter(c => String(c.user_id) === String(session.user.id));
    if (owned.length > 0) initialGroup = owned;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <HuntRecordForm initialGroup={initialGroup} />
    </main>
  );
}
