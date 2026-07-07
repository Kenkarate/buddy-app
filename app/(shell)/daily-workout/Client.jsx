"use client";

import dynamic from "next/dynamic";

const DailyWorkout = dynamic(() => import("@/components/pages/DailyWorkout"), { ssr: false });

export default function Client() {
  return <DailyWorkout  />;
}
