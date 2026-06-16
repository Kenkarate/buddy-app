const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const Exercise = require("./models/Exercise");

const API_BASE = "https://oss.exercisedb.dev/api/v1";
const CACHE_FILE = path.join(__dirname, ".exercisedb-gif-cache.json");
const REQUEST_DELAY_MS = 1500;
const STOPWORDS = new Set([
  "with",
  "on",
  "the",
  "a",
  "an",
  "and",
  "for",
  "of",
  "to",
  "male",
  "female",
  "in",
  "at",
  "your",
]);
const MATCH_THRESHOLD = 0.6;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function singularize(token) {
  if (token.length >= 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenize(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(singularize)
    .filter((token) => !STOPWORDS.has(token));
}

function normalizeName(name) {
  return tokenize(name).sort().join(" ");
}

async function fetchGifCatalog() {
  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    console.log(`Using cached catalog (${cached.length} exercises) from ${CACHE_FILE}`);
    return new Map(cached.map((entry) => [entry.exerciseId, entry]));
  }

  const catalog = new Map();

  await delay(REQUEST_DELAY_MS);
  const bodyParts = await fetchJson(`${API_BASE}/bodyparts`);
  await delay(REQUEST_DELAY_MS);
  const equipments = await fetchJson(`${API_BASE}/equipments`);
  await delay(REQUEST_DELAY_MS);
  const muscles = await fetchJson(`${API_BASE}/muscles`);

  const filters = [
    ...bodyParts.data.map((entry) => ["bodyParts", entry.name]),
    ...equipments.data.map((entry) => ["equipments", entry.name]),
    ...muscles.data.map((entry) => ["targetMuscles", entry.name]),
  ];

  for (const [key, value] of filters) {
    await delay(REQUEST_DELAY_MS);
    try {
      const url = `${API_BASE}/exercises?${key}=${encodeURIComponent(value)}&limit=25`;
      const json = await fetchJson(url);
      for (const exercise of json.data || []) {
        if (!catalog.has(exercise.exerciseId)) {
          catalog.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            gifUrl: exercise.gifUrl,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${key}=${value}:`, error.message);
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify([...catalog.values()]));
  return catalog;
}

function buildLookup(catalog) {
  const exact = new Map();
  const entries = [];

  for (const { name, gifUrl } of catalog.values()) {
    const tokens = tokenize(name);
    const norm = tokens.slice().sort().join(" ");
    if (!exact.has(norm)) exact.set(norm, gifUrl);
    entries.push({ tokens: new Set(tokens), gifUrl, name });
  }

  return { exact, entries };
}

function findMatch(name, lookup) {
  const tokens = tokenize(name);
  const norm = tokens.slice().sort().join(" ");

  const exactGif = lookup.exact.get(norm);
  if (exactGif) return exactGif;

  const tokenSet = new Set(tokens.filter((token) => token.length >= 2));
  if (tokenSet.size < 2) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of lookup.entries) {
    const candidateTokens = [...entry.tokens].filter((token) => token.length >= 2);
    if (candidateTokens.length < 2) continue;

    const candidateSet = new Set(candidateTokens);
    let intersection = 0;
    for (const token of tokenSet) {
      if (candidateSet.has(token)) intersection += 1;
    }
    if (intersection < 2) continue;

    const union = new Set([...tokenSet, ...candidateSet]).size;
    const score = intersection / union;

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= MATCH_THRESHOLD) return best.gifUrl;
  return null;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  console.log("Fetching GIF catalog from oss.exercisedb.dev...");
  const catalog = await fetchGifCatalog();
  console.log(`Fetched ${catalog.size} unique exercises with real GIFs`);

  const lookup = buildLookup(catalog);
  const exercises = await Exercise.find().select("_id name gifUrl");

  let matched = 0;
  let unmatched = 0;
  const unmatchedSamples = [];

  for (const exercise of exercises) {
    const gifUrl = findMatch(exercise.name, lookup);

    if (gifUrl) {
      matched += 1;
      if (exercise.gifUrl !== gifUrl) {
        await Exercise.updateOne({ _id: exercise._id }, { $set: { gifUrl } });
      }
    } else {
      unmatched += 1;
      if (exercise.gifUrl) {
        await Exercise.updateOne({ _id: exercise._id }, { $set: { gifUrl: "" } });
      }
      if (unmatchedSamples.length < 15) unmatchedSamples.push(exercise.name);
    }
  }

  console.log(`\nProcessed ${exercises.length} exercises`);
  console.log(`Matched with a real GIF: ${matched}`);
  console.log(`No GIF match (falls back to static image): ${unmatched}`);
  console.log("\nSample unmatched names:");
  unmatchedSamples.forEach((name) => console.log(`  - ${name}`));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("SYNC EXERCISE GIFS ERROR:", error);
  process.exit(1);
});
