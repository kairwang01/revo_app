import { API } from './config.js';
import { cityStore } from './storage.js';
import { toast } from './ui.js';

const allowedBrandSet = new Set(API.ALLOWED_BRANDS);

export function enforceAllowedBrands(items = []) {
  const filtered = items.filter((item) => allowedBrandSet.has(item.brand));
  if (filtered.length !== items.length) {
    toast('Revo currently trades Apple & Samsung only');
  }
  return filtered;
}

export function ensureCityOrDefault() {
  const city = cityStore.get();
  if (!API.ALLOWED_CITIES.includes(city)) {
    cityStore.set('Vancouver');
    return 'Vancouver';
  }
  return city;
}

export function ensureAllowedCity(city) {
  if (!API.ALLOWED_CITIES.includes(city)) {
    toast('Service available in Vancouver, Edmonton, and Ottawa');
    return ensureCityOrDefault();
  }
  return city;
}
