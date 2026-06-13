// Derives a 2-letter country code hint from the browser's locale
// (e.g. "en-US" -> "US"). Returns "" if it can't be determined.
// This is a weak signal (locale often doesn't match actual location), so
// it's only used as a last-resort fallback.
export function detectLocaleCountry() {
  try {
    const locale =
      navigator.language || (navigator.languages && navigator.languages[0]) || "";

    const parts = locale.split("-");
    const country = parts[parts.length - 1]?.toUpperCase() || "";

    return /^[A-Z]{2}$/.test(country) ? country : "";
  } catch {
    return "";
  }
}

// Looks up the browser's actual country via its public IP. Works even on
// localhost, since the lookup is based on the network's egress IP.
async function detectIpCountry() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch("https://ipapi.co/country/", {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return "";

    const code = (await response.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : "";
  } catch {
    return "";
  }
}

// Best-effort detection of the user's country: IP-based lookup first
// (accurate regardless of dev/prod), falling back to browser locale.
export async function detectClientCountry() {
  const ipCountry = await detectIpCountry();
  return ipCountry || detectLocaleCountry();
}

// Fetches detected country/currency and converted prices from the backend.
// Returns null if the request fails so callers can fall back to static INR pricing.
export async function fetchCurrencyPricing(api) {
  try {
    const country = await detectClientCountry();
    const { data } = await api.get("/payments/currency", {
      params: { country },
    });

    return data;
  } catch (error) {
    console.warn("Currency detection failed, using default pricing:", error.message);
    return null;
  }
}
