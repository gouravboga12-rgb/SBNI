// ============================================================
// JustPaisa — Mapbox Location & Geocoding Service
// Powered by Mapbox Geocoding API v5 & Google Maps Directions
// ============================================================

export interface LocationResult {
  place: string;       // e.g. "Dilsukhnagar" / "Chaitanyapuri"
  city: string;        // e.g. "Hyderabad"
  state: string;       // e.g. "Telangana"
  country: string;     // e.g. "India"
  pincode?: string;    // e.g. "500060"
  fullAddress: string; // Formatted full place string
  latitude: number;
  longitude: number;
}

const DEFAULT_MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

/**
 * 1. Forward Geocode Search (Place/City/Area Autocomplete)
 * Restricts / prioritizes searches to India by default
 */
export async function searchPlacesMapbox(
  query: string,
  country = 'in'
): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) return [];

  const token = DEFAULT_MAPBOX_TOKEN;
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query.trim()
  )}.json?country=${country}&types=poi,address,neighborhood,locality,place,district,region,postcode&autocomplete=true&limit=8&access_token=${token}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.warn(`Mapbox Geocoding API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((feature: any) => parseMapboxFeature(feature));
  } catch (err) {
    console.error('searchPlacesMapbox error:', err);
    return [];
  }
}

/**
 * 2. Reverse Geocode (Coordinates -> Structured Address)
 */
export async function reverseGeocodeMapbox(
  latitude: number,
  longitude: number
): Promise<LocationResult | null> {
  const token = DEFAULT_MAPBOX_TOKEN;
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address,neighborhood,locality,place,district,region,postcode&access_token=${token}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    return parseMapboxFeature(data.features[0], latitude, longitude);
  } catch (err) {
    console.error('reverseGeocodeMapbox error:', err);
    return null;
  }
}

/**
 * Helper to parse Mapbox GeoJSON feature into our unified LocationResult
 */
function parseMapboxFeature(
  feature: any,
  forcedLat?: number,
  forcedLng?: number
): LocationResult {
  const [lng, lat] = feature.center || [feature.geometry?.coordinates[0], feature.geometry?.coordinates[1]];
  const latitude = forcedLat ?? lat;
  const longitude = forcedLng ?? lng;
  const placeName = feature.text || feature.place_name?.split(',')[0] || 'Area';

  let city = '';
  let state = '';
  let country = 'India';
  let pincode = '';

  if (feature.context && Array.isArray(feature.context)) {
    for (const ctx of feature.context) {
      if (ctx.id?.startsWith('place')) {
        city = ctx.text;
      } else if (ctx.id?.startsWith('district') && !city) {
        city = ctx.text;
      } else if (ctx.id?.startsWith('region')) {
        state = ctx.text;
      } else if (ctx.id?.startsWith('country')) {
        country = ctx.text;
      } else if (ctx.id?.startsWith('postcode')) {
        pincode = ctx.text;
      }
    }
  }

  // Fallbacks if context hierarchy was top-level
  if (!city && feature.place_type?.includes('place')) {
    city = feature.text;
  }
  if (!state && feature.place_type?.includes('region')) {
    state = feature.text;
  }

  return {
    place: placeName,
    city: city || placeName || 'Hyderabad',
    state: state || 'Telangana',
    country: country || 'India',
    pincode: pincode || '',
    fullAddress: feature.place_name || `${placeName}, ${city || 'Hyderabad'}, ${state || 'Telangana'}, India`,
    latitude,
    longitude,
  };
}

/**
 * 3. Browser GPS Geolocation Request (Executed ONLY on explicit user click)
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location access permission was denied. You can still enter your place/city manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again or type manually.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * 4. Google Maps Direction & Navigation URL
 * Directs navigation to exact destination coordinates
 */
export function getGoogleMapsNavigationUrl(destLat: number, destLng: number, label?: string): string {
  if (!destLat || !destLng) return 'https://www.google.com/maps';
  const query = label ? encodeURIComponent(label) : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=${query}`;
}
