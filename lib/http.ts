import type { NextRequest } from "next/server";

// Safely parse a JSON request body. Next parses bodies natively (no serverless
// Buffer quirk like the old Express app), but some clients may send an empty or
// malformed body — return {} rather than throwing, matching the old defensive
// parseRequestBody behavior.
export async function readJson<T = Record<string, unknown>>(
  req: NextRequest
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
