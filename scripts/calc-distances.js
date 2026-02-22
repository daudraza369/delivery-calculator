/**
 * Calculate distances from District Flowers hub to all Riyadh districts.
 * Uses Nominatim for geocoding (1 req/sec). Outputs district -> km, fee.
 * Run: node scripts/calc-distances.js
 */

const fs = require("fs");
const path = require("path");

const HUB = { lat: 24.695074, lng: 46.792129 };
const ROAD_FACTOR = 1.3;
const VIEWBOX = "46.4,24.4,47.2,25.4";
const NOMINATIM_DELAY_MS = 1100;

// Load districts from config.js
const { DELIVERY_CONFIG } = require("../config.js");

const allDistricts = DELIVERY_CONFIG.zones.flatMap((z) =>
  z.neighborhoods.map((n) => ({ name: n, fee: z.fee }))
);

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToZone(km) {
  if (km <= 5) return 15;
  if (km <= 10) return 20;
  if (km <= 15) return 30;
  if (km <= 20) return 35;
  if (km <= 25) return 40;
  if (km <= 40) return 45;
  return null;
}

// Manual coordinate overrides for districts where Nominatim returns wrong/different location
const MANUAL_COORDS = {
  "Al Malqa": { lat: 24.8008, lng: 46.5978 }, // Al Malqa district, N Riyadh (~31 km road)
  "Al Rimal": { lat: 24.698, lng: 46.805 },   // Al Rimal near Al Rawabi
};

// Fallback queries for districts that may not geocode directly
const FALLBACK_QUERIES = {
  "Al Naseem East": "Al Naseem Riyadh Saudi Arabia",
  "Al Naseem West": "Al Naseem Riyadh Saudi Arabia",
  KAFD: "King Abdullah Financial District Riyadh Saudi Arabia",
  "Al Dar Al Baida": "Al Dar Al Baida Riyadh Saudi Arabia",
  "Ad Dirah": "Ad Dirah Riyadh Saudi Arabia",
  "As Saadah": "As Saadah Riyadh Saudi Arabia",
  "As Salhiyah": "As Salhiyah Riyadh Saudi Arabia",
  "Al Sinaiyah": "Al Sinaiyah Riyadh Saudi Arabia",
  "An Nada": "An Nada Riyadh Saudi Arabia",
  "An Nafal": "An Nafal Riyadh Saudi Arabia",
  "An Namudhajiyah": "An Namudhajiyah Riyadh Saudi Arabia",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(district) {
  if (MANUAL_COORDS[district]) return MANUAL_COORDS[district];
  const query =
    FALLBACK_QUERIES[district] || `${district} Riyadh Saudi Arabia`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=1&viewbox=${VIEWBOX}&bounded=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DistrictFlowers-DeliveryCalc/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}

async function main() {
  const results = {};
  const failed = [];
  let i = 0;
  for (const { name, fee } of allDistricts) {
    i++;
    process.stdout.write(`[${i}/${allDistricts.length}] ${name}... `);
    const coords = await geocode(name);
    if (!coords) {
      console.log("FAILED");
      failed.push(name);
      results[name] = { km: null, fee };
      await sleep(NOMINATIM_DELAY_MS);
      continue;
    }
    const straightKm = haversine(HUB.lat, HUB.lng, coords.lat, coords.lng);
    const km = Math.round(straightKm * ROAD_FACTOR * 10) / 10;
    const zoneFee = distanceToZone(km);
    results[name] = { km, fee: zoneFee !== null ? zoneFee : fee };
    console.log(`${km} km`);
    await sleep(NOMINATIM_DELAY_MS);
  }
  if (failed.length) {
    console.log("\nFailed to geocode:", failed.join(", "));
  }
  const outPath = path.join(__dirname, "..", "distances-output.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log("\nWritten to distances-output.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
