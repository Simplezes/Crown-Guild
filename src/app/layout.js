import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Nav from "@/components/ui/Nav";
import ToastManager from "@/components/ui/ToastManager";
import MissionControl from "@/components/missions/MissionControl";

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>
          <Nav />
          <ToastManager />
          <MissionControl />
          {children}
        </Providers>
      </body>
    </html>
  );
}
