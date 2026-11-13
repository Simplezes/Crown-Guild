import type { Metadata } from "next";
import { HomePage } from "@/features/home";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home | Crown Guild",
  description: "The central command for Monster Hunter Wilds crown hunting.",
};

export default HomePage;
