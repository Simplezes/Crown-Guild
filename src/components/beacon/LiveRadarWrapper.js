"use client";

import dynamic from "next/dynamic";

const LiveRadar = dynamic(() => import("./LiveRadar"), { ssr: false });

export default function LiveRadarWrapper() {
  return <LiveRadar />;
}
