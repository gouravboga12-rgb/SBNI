// ============================================================
// JustPaisa — Mobile Mapbox Location & Geocoding Service
// Pure JavaScript fetch with Resilient OpenStreetMap /
// Photon & Built-in Indian Cities Failover (100% Availability)
// ============================================================

export interface LocationResult {
  place: string;       // e.g. "Kurnool" / "Dilsukhnagar" / "Banjara Hills"
  city: string;        // e.g. "Kurnool" / "Hyderabad"
  state: string;       // e.g. "Andhra Pradesh" / "Telangana"
  country: string;     // e.g. "India"
  pincode?: string;    // e.g. "518001"
  fullAddress: string; // Formatted full place string
  latitude: number;
  longitude: number;
}

export const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  '';

// Curated Top Indian Cities & Business Hubs for Instant Zero-Latency Fallback
const CURATED_INDIAN_CITIES: Array<{
  name: string;
  state: string;
  lat: number;
  lng: number;
  pincode: string;
}> = [
  { name: 'Kurnool', state: 'Andhra Pradesh', lat: 15.8281, lng: 78.0373, pincode: '518001' },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, pincode: '500001' },
  { name: 'Secunderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983, pincode: '500003' },
  { name: 'Dilsukhnagar', state: 'Telangana', lat: 17.3688, lng: 78.5247, pincode: '500060' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, pincode: '520001' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, pincode: '530001' },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365, pincode: '522002' },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192, pincode: '517501' },
  { name: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lng: 79.9865, pincode: '524001' },
  { name: 'Kadapa', state: 'Andhra Pradesh', lat: 14.4673, lng: 78.8242, pincode: '516001' },
  { name: 'Anantapur', state: 'Andhra Pradesh', lat: 14.6819, lng: 77.6006, pincode: '515001' },
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941, pincode: '506002' },
  { name: 'Karimnagar', state: 'Telangana', lat: 18.4386, lng: 79.1288, pincode: '505001' },
  { name: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941, pincode: '503001' },
  { name: 'Khammam', state: 'Telangana', lat: 17.2473, lng: 80.1514, pincode: '507001' },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, pincode: '560001' },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, pincode: '600001' },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, pincode: '400001' },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, pincode: '411001' },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, pincode: '110001' },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, pincode: '201301' },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266, pincode: '122001' },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, pincode: '700001' },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, pincode: '380001' },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, pincode: '395003' },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, pincode: '302001' },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, pincode: '226001' },
  { name: 'Nandyal', state: 'Andhra Pradesh', lat: 15.4886, lng: 78.4836, pincode: '518501' },
  { name: 'Adoni', state: 'Andhra Pradesh', lat: 15.6322, lng: 77.2750, pincode: '518301' },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', lat: 17.0005, lng: 81.8040, pincode: '533101' },
  { name: 'Kakinada', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475, pincode: '533001' },
  { name: 'Eluru', state: 'Andhra Pradesh', lat: 16.7107, lng: 81.0952, pincode: '534001' },
  { name: 'Ongole', state: 'Andhra Pradesh', lat: 15.5057, lng: 80.0499, pincode: '523001' },
];

/**
 * 1. Forward Geocode Search (Place / City / Address autocomplete)
 * Multi-Tier Failover: Mapbox -> Photon -> Nominatim -> Offline Cities Index
 */
export async function searchPlacesMapbox(
  query: string,
  country = 'in'
): Promise<LocationResult[]> {
  const cleanQ = query?.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  // Tier 1: Try Mapbox if token is configured
  if (MAPBOX_TOKEN) {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        cleanQ
      )}.json?country=${country}&types=poi,address,neighborhood,locality,place,district,region,postcode&autocomplete=true&limit=8&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          return data.features.map((feature: any) => parseMapboxFeature(feature));
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // Tier 2: Photon Geocoding API (OpenStreetMap, CORS-enabled, ultra-fast)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&limit=8`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features) && data.features.length > 0) {
        const indianFeatures = data.features.filter((f: any) => {
          const cCode = f.properties?.countrycode?.toUpperCase();
          const countryName = f.properties?.country?.toLowerCase();
          return cCode === 'IN' || countryName === 'india' || !cCode;
        });

        const targetList = indianFeatures.length > 0 ? indianFeatures : data.features;
        const parsed = targetList.slice(0, 6).map((f: any) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [78.4867, 17.3850];
          const name = props.name || props.street || props.city || cleanQ;
          const city = props.city || props.district || props.county || name;
          const state = props.state || 'Andhra Pradesh';
          const fullAddress = [name, city !== name ? city : '', state, 'India'].filter(Boolean).join(', ');

          return {
            place: name,
            city,
            state,
            country: 'India',
            pincode: props.postcode || '',
            fullAddress,
            latitude: Number(coords[1]),
            longitude: Number(coords[0]),
          };
        });

        if (parsed.length > 0) return parsed;
      }
    }
  } catch (photonErr) {
    // Fallback
  }

  // Tier 3: Nominatim (OpenStreetMap India)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQ
    )}&countrycodes=in&format=json&addressdetails=1&limit=6`;
    const res = await fetch(nominatimUrl, {
      headers: { 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item: any) => {
          const addr = item.address || {};
          const placeName = item.name || addr.suburb || addr.neighbourhood || addr.city || cleanQ;
          const city = addr.city || addr.town || addr.village || addr.county || placeName;
          const state = addr.state || 'Telangana';
          return {
            place: placeName,
            city,
            state,
            country: 'India',
            pincode: addr.postcode || '',
            fullAddress: item.display_name || `${placeName}, ${city}, ${state}, India`,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        });
      }
    }
  } catch (nominatimErr) {
    // Fallback
  }

  // Tier 4: Instant Curated Offline Indian Cities Match
  const lowerQ = cleanQ.toLowerCase();
  const matched = CURATED_INDIAN_CITIES.filter((c) =>
    c.name.toLowerCase().includes(lowerQ) || lowerQ.includes(c.name.toLowerCase())
  );

  return matched.slice(0, 6).map((c) => ({
    place: c.name,
    city: c.name,
    state: c.state,
    country: 'India',
    pincode: c.pincode,
    fullAddress: `${c.name}, ${c.state}, India`,
    latitude: c.lat,
    longitude: c.lng,
  }));
}

/**
 * 2. Reverse Geocode (Coordinates -> Location Details)
 */
export async function reverseGeocodeMapbox(
  latitude: number,
  longitude: number
): Promise<LocationResult | null> {
  if (MAPBOX_TOKEN) {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address,neighborhood,locality,place,district,region,postcode&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return parseMapboxFeature(data.features[0], latitude, longitude);
        }
      }
    } catch (err) {
      // Fallback
    }
  }

  // Reverse geocode via Nominatim
  try {
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const res = await fetch(reverseUrl, {
      headers: { 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const placeName = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.city || 'Commercial Area';
      const city = addr.city || addr.town || addr.county || addr.district || 'Hyderabad';
      const state = addr.state || 'Telangana';
      return {
        place: placeName,
        city,
        state,
        country: 'India',
        pincode: addr.postcode || '',
        fullAddress: data.display_name || `${placeName}, ${city}, ${state}, India`,
        latitude,
        longitude,
      };
    }
  } catch (err) {
    // Fallback
  }

  return {
    place: 'Selected Location',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    fullAddress: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
  };
}

/**
 * 3. Helper to parse Mapbox GeoJSON feature into our unified LocationResult
 */
function parseMapboxFeature(
  feature: any,
  forcedLat?: number,
  forcedLng?: number
): LocationResult {
  const [lng, lat] = feature.center || [
    feature.geometry?.coordinates?.[0] || 78.4867,
    feature.geometry?.coordinates?.[1] || 17.385,
  ];
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
