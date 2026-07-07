"use client";

import dynamic from "next/dynamic";

const UserWorkout = dynamic(() => import("@/components/pages/UserWorkout"), { ssr: false });

export default function Client() {
  return <UserWorkout  />;
}
