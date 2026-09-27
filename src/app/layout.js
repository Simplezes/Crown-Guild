import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "./template.css";
import "./port.css";
import { Providers } from "./providers";
import TopBar from "@/components/shell/TopBar";
import { auth } from "@/auth";
import { getUserSummary } from "@/lib/summary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Crown Guild | Monster Hunter Wilds Registry",
  description: "Track Monster Hunter Wilds collections, find hosts, and hunt together.",
  keywords: ["Monster Hunter", "MHWilds", "Crown", "Guild", "LFG", "Crown Guild"],
  openGraph: {
    title: "Crown Guild | Monster Hunter Wilds Registry",
    description: "Track Monster Hunter Wilds collections, find hosts, and hunt together.",
    images: [{ url: "/og" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: "/og" }],
  },
};

export default async function RootLayout({ children }) {
  const session = await auth();
  const user = session?.user?.id
    ? { id: session.user.id, name: session.user.name || "Hunter", image: session.user.image || null }
    : null;
  const summary = user ? await getUserSummary(user.id) : null;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-body`}>
        <Providers>
          <div className="ghost-monster" aria-hidden="true" />
          <div className="app">
            <TopBar user={user} summary={summary} />
            <div className="main">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
