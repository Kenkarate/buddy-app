const axios = require("axios");

function isValidCountryCode(code) {
  return typeof code === "string" && /^[A-Za-z]{2}$/.test(code.trim());
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || "";
}

function isPrivateIp(ip) {
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

async function lookupCountryByIp(ip) {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/country/`, {
      timeout: 2000,
    });

    const code = String(response.data || "").trim();
    return isValidCountryCode(code) ? code.toUpperCase() : null;
  } catch (error) {
    console.warn("IP geolocation lookup failed:", error.message);
    return null;
  }
}

// Determines the user's country using, in order of preference:
// 1. A country code set by a CDN/proxy (Cloudflare, Vercel, etc.)
// 2. IP-based geolocation lookup (skipped for local/private IPs)
// 3. A locale-derived hint supplied by the frontend
// 4. Default to India ("IN")
async function detectCountryCode(req, hintCountry) {
  const cdnCountry = req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"];

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

module.exports = {
  detectCountryCode,
  isValidCountryCode,
};
