import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/features/auth";
import { auth } from "@/server/auth";

export const metadata: Metadata = { title: "Sign in | Crown Guild" };

const safeCallback = (value: string | string[] | undefined): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session) redirect("/");
  const { callbackUrl } = await searchParams;

  return (
    <div className="pad">
      <section className="signin">
        <Image src="/icon.png" alt="" width={56} height={56} />
        <h1>Sign in to Crown Guild</h1>
        <p>Use your Discord account to log crowns and track monsters.</p>
        <SignInButton callbackUrl={safeCallback(callbackUrl)} className="btn" direct>
          Continue with Discord
        </SignInButton>
        <ul>
          <li>Crown Guild only asks Discord for your username and avatar.</li>
          <li>
            We never see your password, email, servers or messages, and we can&apos;t post for you.
          </li>
          <li>
            You sign in on discord.com. You can revoke access any time in Discord under Authorized
            Apps.
          </li>
        </ul>
        <nav className="signin-legal" aria-label="Legal pages">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </section>
    </div>
  );
}
