// Open-Meteo (free, no key). Only a city name or coordinates are sent, never anything about the closet.
const LOC_KEY = 'dc_location';

export const readLocation = () => {
  try { return JSON.parse(localStorage.getItem(LOC_KEY)); } catch { return null; }
};
// Only manually chosen cities are remembered, never GPS coordinates.
export const saveLocation = (loc) => {
  try { localStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch { /* private mode: not remembered */ }
};

export async function findCity(name) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&format=json`);
  if (!res.ok) throw new Error('City lookup failed');
  const hit = (await res.json()).results?.[0];
  if (!hit) return null;
  return { name: [hit.name, hit.country].filter(Boolean).join(', '), lat: hit.latitude, lon: hit.longitude };
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not available in this browser'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ name: 'Your location', lat: p.coords.latitude, lon: p.coords.longitude }),
      () => reject(new Error('Location was not shared')),
      { timeout: 10000, maximumAge: 600000 }
    );
  });
}

const isRainCode = (c) => (c >= 51 && c <= 67) || (c >= 71 && c <= 77) || (c >= 80 && c <= 86) || c >= 95;

/** Open-Meteo response -> { bucket, rainy, now, min, max, key }. key is a stable weather bucket for caching (step 8). */
export function summarize(json) {
  const max = json.daily?.temperature_2m_max?.[0];
  const min = json.daily?.temperature_2m_min?.[0];
  const now = json.current?.temperature_2m;
  if (![max, min, now].every(Number.isFinite)) throw new Error('Unexpected weather response');
  const avg = (max + min) / 2;
  const bucket = avg < 8 ? 'cold' : avg < 15 ? 'cool' : avg < 22 ? 'mild' : avg < 28 ? 'warm' : 'hot';
  const rainy =
    (json.daily.precipitation_probability_max?.[0] ?? 0) >= 50 ||
    (json.current.precipitation ?? 0) > 0.2 ||
    isRainCode(json.current.weather_code);
  return { bucket, rainy, now: Math.round(now), min: Math.round(min), max: Math.round(max), key: `${bucket}-${rainy ? 'wet' : 'dry'}` };
}

export async function fetchWeather({ lat, lon }) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,precipitation,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed');
  return summarize(await res.json());
}
