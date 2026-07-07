"use client";

import dynamic from "next/dynamic";

const WorkoutList = dynamic(() => import("@/components/pages/WorkoutList"), { ssr: false });

export default function Client() {
  return <WorkoutList  />;
}
