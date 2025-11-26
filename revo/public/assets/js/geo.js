// assets/js/geo.js
// City geofencing + selection (local only)
// cartographers with caffeine wrote this

// Haversine distance in km
function haversine(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

// Supported cities (extendable)
export const REVO_CITIES = [
  { key: "Vancouver", name: "Vancouver", lat: 49.2827, lng: -123.1207, tax: 0.12 },
  { key: "Edmonton",  name: "Edmonton",  lat: 53.5461, lng: -113.4938, tax: 0.05 },
  { key: "Toronto",   name: "Toronto",   lat: 43.6532, lng: -79.3832,  tax: 0.13 },
  { key: "Montreal",  name: "Montreal",  lat: 45.5019, lng: -73.5674,  tax: 0.14975 },
  { key: "Ottawa",    name: "Ottawa",    lat: 45.4215, lng: -75.6972,  tax: 0.13 }
];

export function nearestCity(lat, lng) {
  const here = { lat, lng };
  let best = REVO_CITIES[0], bestKm = Infinity;
  for (const c of REVO_CITIES) {
    const km = haversine(here, { lat: c.lat, lng: c.lng });
    if (km < bestKm) { best = c; bestKm = km; }
  }
  return best;
}

export function setCity(cityKey) {
  const city = REVO_CITIES.find(c => c.key === cityKey) || REVO_CITIES[0];
  localStorage.setItem("revo_city", city.key);
  localStorage.setItem("revo_city_tax", String(city.tax));
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent("revo:city-changed", { detail: city }));
  
  return city;
}

export function getCity() {
  const key = localStorage.getItem("revo_city");
  return REVO_CITIES.find(c => c.key === key) || null;
}

export function getCityTax(cityKey) {
  const city = REVO_CITIES.find(c => c.key === cityKey);
  return city ? city.tax : 0.12;
}

// Ask for geolocation; resolve with chosen city or null if needs manual selection
export function initCitySelection() {
  const saved = getCity();
  if (saved) {
    window.dispatchEvent(new CustomEvent("revo:city-changed", { detail: saved }));
    return Promise.resolve(saved);
  }
  
  if (!("geolocation" in navigator)) {
    console.log("Geolocation not available");
    return Promise.resolve(null); // show Choose City
  }
  
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const city = nearestCity(latitude, longitude);
        setCity(city.key);
        console.log(`Auto-detected city: ${city.name}`);
        resolve(city);
      },
      // Permission denied or error -> null
      (error) => {
        console.log("Geolocation error:", error.message);
        resolve(null);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  });
}
