const axios = require("axios");

const BASE_CURRENCY = "INR";

// Display/formatting metadata for currencies we can present to users.
const SUPPORTED_CURRENCIES = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "en-IE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AUD: { symbol: "A$", locale: "en-AU" },
  CAD: { symbol: "C$", locale: "en-CA" },
  SGD: { symbol: "S$", locale: "en-SG" },
  AED: { symbol: "AED", locale: "ar-AE" },
};

// ISO 3166-1 alpha-2 country code -> currency code. Countries not listed
// here fall back to the base currency (INR).
const COUNTRY_CURRENCY_MAP = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  SG: "SGD",
  AE: "AED",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  PT: "EUR",
  BE: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
};

// Approximate INR -> currency rates, used only when the live rate lookup
// fails. Periodically refreshed values are fetched via getExchangeRates().
const FALLBACK_RATES_FROM_INR = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AUD: 0.018,
  CAD: 0.016,
  SGD: 0.016,
  AED: 0.044,
};

const RATES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let ratesCache = { data: null, fetchedAt: 0 };

async function getExchangeRates() {
  const now = Date.now();

  if (ratesCache.data && now - ratesCache.fetchedAt < RATES_CACHE_TTL_MS) {
    return ratesCache.data;
  }

  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/INR", {
      timeout: 3000,
    });

    if (response.data?.result === "success" && response.data.rates) {
      ratesCache = { data: response.data.rates, fetchedAt: now };
      return ratesCache.data;
    }

    throw new Error("Unexpected exchange rate response");
  } catch (error) {
    console.warn("Falling back to static exchange rates:", error.message);
    return FALLBACK_RATES_FROM_INR;
  }
}

function getCurrencyForCountry(countryCode) {
  return COUNTRY_CURRENCY_MAP[String(countryCode || "").toUpperCase()] || BASE_CURRENCY;
}

// Converts a base price given in INR paise into the smallest unit of the
// target currency (e.g. cents), using the supplied exchange rates.
function convertFromInrPaise(amountInPaise, currency, rates) {
  if (currency === BASE_CURRENCY) {
    return { amount: amountInPaise, displayAmount: amountInPaise / 100 };
  }

  const rate = rates?.[currency] || FALLBACK_RATES_FROM_INR[currency] || 1;
  const amountInInr = amountInPaise / 100;
  const displayAmount = Math.round(amountInInr * rate * 100) / 100;
  const amount = Math.round(displayAmount * 100);

  return { amount, displayAmount };
}

function formatCurrency(amount, currency) {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toFixed(2)}`;
  }
}

module.exports = {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  getCurrencyForCountry,
  convertFromInrPaise,
  formatCurrency,
};
