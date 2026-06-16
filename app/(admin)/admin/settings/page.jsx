"use client";

import dynamic from "next/dynamic";

// Rendered client-only: these pages read browser APIs (localStorage) during
// render, matching the original SPA. Auth/role/plan gating is handled by
// proxy.ts and the route-group server layouts.
export default dynamic(() => import("@/components/pages/AdminSettings"), { ssr: false });
