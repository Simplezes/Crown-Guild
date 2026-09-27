import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import SignInButton from "@/components/home/SignInButton";

export const metadata = { title: "Sign in | Crown Guild" };

export default async function SignIn({ searchParams }) {
  const session = await auth();
  if (session) redirect("/");
  const { callbackUrl } = await searchParams;
  const to = typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  return (
    <div className="pad">
      <section className="signin">
        <Image src="/icon.png" alt="" width={56} height={56} />
        <h1>Sign in to Crown Guild</h1>
        <p>Use your Discord account to log crowns and track monsters.</p>
        <SignInButton callbackUrl={to} className="btn">Continue with Discord</SignInButton>
        <ul>
          <li>Crown Guild only asks Discord for your username and avatar.</li>
          <li>We never see your password, email, servers or messages, and we can&apos;t post for you.</li>
          <li>You sign in on discord.com. You can revoke access any time in Discord under Authorized Apps.</li>
        </ul>
      </section>
    </div>
  );
}
