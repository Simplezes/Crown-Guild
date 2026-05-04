import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Nav from "@/components/Nav";
import ToastManager from "@/components/ToastManager";
import MissionControl from "@/components/MissionControl";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Crown Guild | Monster Hunter Wilds Registry",
  description: "The premium crown tracking and matchmaking hub for Monster Hunter Wilds. Track collections, find hosts, and hunt together.",
  keywords: ["Monster Hunter", "MHWilds", "Crown Tracking", "Matchmaking", "LFG", "Crown Guild"],
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
