import { NextResponse } from "next/server";

// Disabled legacy endpoint — kept for backward compatibility. Real payments go
// through /api/payments/create-order and /api/payments/verify.
export async function POST() {
  return NextResponse.json(
    {
      message:
        "Mock payment is disabled. Use /api/payments/create-order and /api/payments/verify.",
    },
    { status: 410 }
  );
}
