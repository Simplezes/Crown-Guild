import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const res = await db.execute({
    sql: "SELECT lobby_id, quest_password, receive_dms FROM users WHERE id = ?",
    args: [session.user.id]
  });

  const row = res.rows[0] || { lobby_id: "", quest_password: "", receive_dms: 1 };
  const userData = {
    lobby_id: row.lobby_id || "",
    quest_password: row.quest_password || "",
    receive_dms: row.receive_dms !== 0 ? 1 : 0
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-8">
        <div className="mb-2 font-display text-sm uppercase tracking-[0.15em] text-mist">
          Hunter Configuration
        </div>
        <h1 className="font-display text-4xl uppercase tracking-wide text-ember">Settings</h1>
      </header>

      <SettingsForm initialData={userData} />
    </main>
  );
}
