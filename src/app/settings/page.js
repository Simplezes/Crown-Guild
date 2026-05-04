import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import styles from "./settings.module.css";
import SettingsForm from "./SettingsForm";
import Image from "next/image";

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
    <main className={styles.main}>
      <div className="premium-container">
        <header className={styles.header + " animate-mh"}>
          <div className={styles.titleGroup}>
            <div className={styles.indicator}>
              <Image src="/icons/MHWilds-Notes_Checkmark_Icon.png" width={18} height={18} alt="" className="pixel-art" />
              <span>Hunter Configuration</span>
            </div>
            <h1 className="gold-text">Settings</h1>
          </div>
        </header>

        <div className={"animate-mh-slide-down " + styles.formContainer}>
          <SettingsForm initialData={userData} />
        </div>
      </div>
    </main>
  );
}
