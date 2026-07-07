import axios from "axios";
import type { NextRequest } from "next/server";

export function isValidCountryCode(code: unknown): code is string {
  return typeof code === "string" && /^[A-Za-z]{2}$/.test(code.trim());
}

function getHeader(req: NextRequest, name: string): string | null {
  return req.headers.get(name);
}

function getClientIp(req: NextRequest): string {
  const forwarded = getHeader(req, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return getHeader(req, "x-real-ip") || "";
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  const normalized = ip.replace("::ffff:", "");

  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost" ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/country/`, {
      timeout: 2000,
    });

    const code = String(response.data || "").trim();
    return isValidCountryCode(code) ? code.toUpperCase() : null;
  } catch (error) {
    console.warn("IP geolocation lookup failed:", (error as Error).message);
    return null;
  }
}

// Determines the user's country using, in order of preference:
// 1. A country code set by a CDN/proxy (Cloudflare, Vercel, Netlify, etc.)
// 2. IP-based geolocation lookup (skipped for local/private IPs)
// 3. A locale-derived hint supplied by the frontend
// 4. Default to India ("IN")
export async function detectCountryCode(
  req: NextRequest,
  hintCountry?: string
): Promise<string> {
  const cdnCountry =
    getHeader(req, "cf-ipcountry") ||
    getHeader(req, "x-vercel-ip-country") ||
    getHeader(req, "x-nf-geo-country");

  if (isValidCountryCode(cdnCountry)) {
    return cdnCountry.toUpperCase();
  }

  const ip = getClientIp(req);

  if (ip && !isPrivateIp(ip)) {
    const geoCountry = await lookupCountryByIp(ip);
    if (geoCountry) return geoCountry;
  }

  if (isValidCountryCode(hintCountry)) {
    return hintCountry.toUpperCase();
  }

  return "IN";
}
