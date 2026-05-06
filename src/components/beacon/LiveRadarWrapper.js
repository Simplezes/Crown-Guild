"use client";

import dynamic from "next/dynamic";
import { SOS_FEATURE_ENABLED } from '@/lib/sos';

const LiveRadar = dynamic(() => import("./LiveRadar"), { ssr: false });

export default function LiveRadarWrapper() {
  if (!SOS_FEATURE_ENABLED) {
    return null;
  }

  return <LiveRadar />;
}
