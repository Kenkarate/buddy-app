"use client";

import dynamic from "next/dynamic";

const ComingSoon = dynamic(() => import("@/components/pages/ComingSoon"), { ssr: false });

export default function Client() {
  return <ComingSoon  />;
}
