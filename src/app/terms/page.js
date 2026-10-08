import LegalLayout from "@/components/legal/LegalLayout";
import "../legal.css";

export const metadata = {
  title: "Terms of Service | Crown Guild",
  description: "Terms for using Crown Guild, a community crown-tracking and hunting website.",
};

export default function TermsPage() {
  return (
    <div className="legal-wrap">
      <LegalLayout
        title="Terms of Service"
        intro="These terms apply when you use Crown Guild, a community website for Monster Hunter Wilds players to record crowns and coordinate hunts. By using the site, you agree to these terms."
      >
        <section>
          <h2>About Crown Guild</h2>
          <p>Crown Guild is an independent community project. It is not affiliated with, sponsored by, or endorsed by Capcom or Discord. Monster Hunter, Monster Hunter Wilds, and Discord are names and marks belonging to their respective owners.</p>
        </section>
        <section>
          <h2>Your account</h2>
          <p>You sign in through Discord. Keep your Discord account secure and use only an account you are authorized to use. You can revoke Crown Guild&apos;s access in Discord&apos;s Authorized Apps settings. If you do, you will need to authorize the app again to sign in.</p>
        </section>
        <section>
          <h2>Community rules</h2>
          <p>Use Crown Guild lawfully and respectfully. Do not submit content that is abusive, deceptive, infringing, or unlawful; impersonate another person; interfere with the site or its users; attempt to access accounts or systems without permission; or use the service to spam or harass other hunters.</p>
        </section>
        <section>
          <h2>Your content and public information</h2>
          <p>You are responsible for the information you add, including crown records, hunt details, status messages, collection and wishlist entries, lobby IDs, and quest passcodes. Crown Guild displays community records and profile information to help hunters find and coordinate with one another. Some profile and hunt information is visible to other visitors.</p>
          <p>Only post information you are comfortable sharing. In particular, lobby IDs and quest passcodes may be shown on your profile. Do not use a quest passcode that protects anything other than an in-game lobby.</p>
        </section>
        <section>
          <h2>Using the service</h2>
          <p>Crown Guild is provided as a community resource. Features may change, be interrupted, or become unavailable. Records are user-submitted and are not guaranteed to be complete or accurate. Use your own judgment when arranging hunts or relying on information posted by other users.</p>
        </section>
        <section>
          <h2>Account deletion</h2>
          <p>You can delete your Crown Guild account from your profile settings. Deletion removes your account and associated records from the app&apos;s database. Copies held temporarily in service-provider backups or operational logs may take longer to expire.</p>
        </section>
        <section>
          <h2>Changes to these terms</h2>
          <p>These terms may be updated as Crown Guild changes. The date above shows when this page was last revised. Continued use after an update means you accept the revised terms.</p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>Questions about these terms can be sent to <a href="mailto:thehunterloki@gmail.com">thehunterloki@gmail.com</a> or sent to <a href="https://discord.com/users/429539479850844160" target="_blank" rel="noopener noreferrer">Simplezes</a> on Discord (user ID: 429539479850844160).</p>
        </section>
      </LegalLayout>
    </div>
  );
}