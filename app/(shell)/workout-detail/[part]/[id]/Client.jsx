"use client";

import dynamic from "next/dynamic";

const WorkoutDetail = dynamic(() => import("@/components/pages/WorkoutDetail"), { ssr: false });

export default function Client() {
  return <WorkoutDetail  />;
}
