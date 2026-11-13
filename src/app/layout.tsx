import type { Metadata } from "next";
import { Inter, Marcellus, Montserrat, Outfit } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { env } from "@/env";
import { TopBar, type ShellUser } from "@/features/shell";
import { auth } from "@/server/auth";
import { getUserSummary } from "@/server/services/summary";
import { Providers } from "./providers";
import "@/styles/index.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const TITLE = "Crown Guild | Monster Hunter Wilds Registry";
const DESCRIPTION = "Track Monster Hunter Wilds collections, find hosts, and hunt together.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXTAUTH_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Monster Hunter", "MHWilds", "Crown", "Guild", "LFG", "Crown Guild"],
  openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: "/og" }] },
  twitter: { card: "summary_large_image", images: [{ url: "/og" }] },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user: ShellUser | null = session?.user?.id
    ? {
        id: session.user.id,
        name: session.user.name || "Hunter",
        image: session.user.image || null,
      }
    : null;
  const summary = user ? await getUserSummary(user.id) : null;

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} ${marcellus.variable} ${montserrat.variable} font-body`}
      >
        <Providers>
          <div className="ghost-monster" aria-hidden="true" />
          <div className="app">
            <TopBar user={user} summary={summary} />
            <div className="main">
              {children}
              <footer className="site-legal">
                <p>Fan-made. Not affiliated with or endorsed by Capcom. Monster Hunter is a Capcom trademark.</p>
                <nav aria-label="Legal links">
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                </nav>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
