import LegalLayout from "@/components/legal/LegalLayout";
import "../legal.css";

export const metadata = {
  title: "Privacy Policy | Crown Guild",
  description: "How Crown Guild handles Discord sign-in data and community hunting records.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-wrap">
      <LegalLayout
        title="Privacy Policy"
        intro="This policy explains what Crown Guild handles when you sign in and use the community crown registry and hunting tools."
      >
        <section>
          <h2>Information you provide</h2>
          <p>When you sign in with Discord, Crown Guild receives your Discord user ID, username, and avatar so it can create your profile and recognize your account. The sign-in flow requests the identify permission. Crown Guild does not receive your Discord password and does not request your email, server list, or messages.</p>
          <p>You may also add crown and hunt records, investigation details, collection and wishlist entries, a status message, lobby ID, quest passcode, and a preference about receiving contact requests through Discord.</p>
        </section>
        <section>
          <h2>Information visible to other visitors</h2>
          <p>Crown Guild is a community registry. Your username, avatar, profile, and submitted hunting records may be visible to other visitors. Lobby IDs and quest passcodes can appear on your profile when provided. Do not enter information you do not want shared with other hunters.</p>
        </section>
        <section>
          <h2>How information is used</h2>
          <p>Information is used to sign you in, maintain your profile, display crown and collection records, support hunt discovery and coordination, provide site features, and protect the service from abuse. Crown Guild does not sell personal information or use it for targeted advertising.</p>
        </section>
        <section>
          <h2>Cookies and technical information</h2>
          <p>Discord sign-in automatically uses essential first-party cookies to maintain your session and protect the sign-in flow. These are handled by the authentication software; Crown Guild does not intentionally use cookies for analytics or advertising. The hosting and security services used by a deployment may separately process technical information such as IP address, request details, and error logs to operate and protect the site, under their own policies.</p>
        </section>
        <section>
          <h2>Service providers</h2>
          <p>Discord provides sign-in. Crown Guild stores app records in its configured database service, currently Turso. Depending on the deployment configuration, hosting, rate-limiting, and realtime service providers may also process limited information to deliver and secure the site. Those providers handle information under their own terms and privacy policies.</p>
        </section>
        <section>
          <h2>Retention and deletion</h2>
          <p>Information is kept while your account is active or as needed to provide the service. You can delete your account from your profile settings; this removes your account and associated app records from the app&apos;s database. Service-provider backups, security logs, or records held independently by providers may remain for their respective retention periods.</p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>You can edit profile settings in Crown Guild, delete your account from profile settings, or revoke the app&apos;s authorization in Discord&apos;s Authorized Apps settings. Revoking authorization does not itself delete records already stored by Crown Guild; use account deletion for that.</p>
        </section>
        <section>
          <h2>Changes and contact</h2>
          <p>This policy may be updated as the site changes. The date above shows when it was last revised. For privacy questions or requests, email <a href="mailto:thehunterloki@gmail.com">thehunterloki@gmail.com</a> or contact <a href="https://discord.com/users/429539479850844160" target="_blank" rel="noopener noreferrer">Simplezes</a> on Discord (user ID: 429539479850844160).</p>
        </section>
      </LegalLayout>
    </div>
  );
}