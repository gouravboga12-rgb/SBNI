// ============================================================
// JustPaisa — Mapbox Location & Geocoding Service
// Powered by Mapbox Geocoding API v5 with Resilient OpenStreetMap /
// Photon & Built-in Indian Cities Failover (100% Availability)
// ============================================================

export interface LocationResult {
  place: string;       // e.g. "Kurnool" / "Dilsukhnagar" / "Chaitanyapuri"
  city: string;        // e.g. "Kurnool" / "Hyderabad"
  state: string;       // e.g. "Andhra Pradesh" / "Telangana"
  country: string;     // e.g. "India"
  pincode?: string;    // e.g. "518001"
  fullAddress: string; // Formatted full place string
  latitude: number;
  longitude: number;
}

const DEFAULT_MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';

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
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, pincode: '462001' },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, pincode: '452001' },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, pincode: '800001' },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, pincode: '641001' },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, pincode: '625001' },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, pincode: '682001' },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, pincode: '695001' },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, pincode: '751001' },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, pincode: '160017' },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', lat: 17.0005, lng: 81.8040, pincode: '533101' },
  { name: 'Kakinada', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475, pincode: '533001' },
  { name: 'Eluru', state: 'Andhra Pradesh', lat: 16.7107, lng: 81.0952, pincode: '534001' },
  { name: 'Ongole', state: 'Andhra Pradesh', lat: 15.5057, lng: 80.0499, pincode: '523001' },
  { name: 'Machilipatnam', state: 'Andhra Pradesh', lat: 16.1875, lng: 81.1389, pincode: '521001' },
  { name: 'Chittoor', state: 'Andhra Pradesh', lat: 13.2172, lng: 79.1003, pincode: '517001' },
  { name: 'Hindupur', state: 'Andhra Pradesh', lat: 13.8294, lng: 77.4930, pincode: '515201' },
  { name: 'Nandyal', state: 'Andhra Pradesh', lat: 15.4886, lng: 78.4836, pincode: '518501' },
  { name: 'Adoni', state: 'Andhra Pradesh', lat: 15.6322, lng: 77.2750, pincode: '518301' },
  { name: 'Tenali', state: 'Andhra Pradesh', lat: 16.2437, lng: 80.6400, pincode: '522201' },
  { name: 'Proddatur', state: 'Andhra Pradesh', lat: 14.7500, lng: 78.5500, pincode: '516360' },
  { name: 'Bhimavaram', state: 'Andhra Pradesh', lat: 16.5449, lng: 81.5212, pincode: '534201' },
  { name: 'Madanapalle', state: 'Andhra Pradesh', lat: 13.5560, lng: 78.5010, pincode: '517325' },
  { name: 'Guntakal', state: 'Andhra Pradesh', lat: 15.1667, lng: 77.3667, pincode: '515801' },
  { name: 'Srikakulam', state: 'Andhra Pradesh', lat: 18.2949, lng: 83.8938, pincode: '532001' },
  { name: 'Vizianagaram', state: 'Andhra Pradesh', lat: 18.1067, lng: 83.3956, pincode: '535001' },
  { name: 'Dharmavaram', state: 'Andhra Pradesh', lat: 14.4144, lng: 77.7126, pincode: '515671' },
  { name: 'Gudivada', state: 'Andhra Pradesh', lat: 16.4410, lng: 80.9926, pincode: '521301' },
  { name: 'Narasaraopet', state: 'Andhra Pradesh', lat: 16.2360, lng: 80.0540, pincode: '522601' },
  { name: 'Tadepalligudem', state: 'Andhra Pradesh', lat: 16.8143, lng: 81.5267, pincode: '534101' },
  { name: 'Suryapet', state: 'Telangana', lat: 17.1439, lng: 79.6239, pincode: '508213' },
  { name: 'Miryalaguda', state: 'Telangana', lat: 16.8711, lng: 79.5631, pincode: '508207' },
  { name: 'Nalgonda', state: 'Telangana', lat: 17.0577, lng: 79.2684, pincode: '508001' },
  { name: 'Adilabad', state: 'Telangana', lat: 19.6640, lng: 78.5320, pincode: '504001' },
  { name: 'Ramagundam', state: 'Telangana', lat: 18.8016, lng: 79.4533, pincode: '505208' },
  { name: 'Mancherial', state: 'Telangana', lat: 18.8679, lng: 79.4639, pincode: '504208' },
  { name: 'Mahbubnagar', state: 'Telangana', lat: 16.7488, lng: 77.9856, pincode: '509001' },
  { name: 'Siddipet', state: 'Telangana', lat: 18.1018, lng: 78.8520, pincode: '502103' },
  { name: 'Kamareddy', state: 'Telangana', lat: 18.3222, lng: 78.3392, pincode: '503111' },
  { name: 'Kothagudem', state: 'Telangana', lat: 17.5516, lng: 80.6186, pincode: '507101' },
  { name: 'Jagtial', state: 'Telangana', lat: 18.7958, lng: 78.9119, pincode: '505327' },
  { name: 'Sangareddy', state: 'Telangana', lat: 17.6193, lng: 78.0815, pincode: '502001' },
];

/**
 * 1. Forward Geocode Search (Place/City/Area Autocomplete)
 * Multi-Tier Resilient Geocoding:
 * Tier 1: Mapbox (if token is valid)
 * Tier 2: Photon (OpenStreetMap global elasticsearch - fast, high-coverage)
 * Tier 3: Nominatim (OpenStreetMap India)
 * Tier 4: Instant Curated Offline India Database
 */
export async function searchPlacesMapbox(
  query: string,
  country = 'in'
): Promise<LocationResult[]> {
  const cleanQ = query?.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  // Tier 1: Try Mapbox if token is configured
  const token = DEFAULT_MAPBOX_TOKEN;
  if (token) {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        cleanQ
      )}.json?country=${country}&types=poi,address,neighborhood,locality,place,district,region,postcode&autocomplete=true&limit=8&access_token=${token}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          const parsed = data.features.map((feature: any) => parseMapboxFeature(feature));
          const strictlyIndia = parsed.filter((p: LocationResult) => {
            const isLon = p.longitude >= 68.0 && p.longitude <= 97.5;
            const isLat = p.latitude >= 6.5 && p.latitude <= 37.5;
            return isLon && isLat;
          });
          if (strictlyIndia.length > 0) return strictlyIndia;
        }
      } else {
        console.warn(`Mapbox Geocoding returned ${res.status}. Falling back to OpenStreetMap / Photon geocoding.`);
      }
    } catch (mapboxErr) {
      console.warn('Mapbox request failed, falling back:', mapboxErr);
    }
  }

  // Tier 2: Photon Geocoding API (OpenStreetMap, CORS-enabled, ultra-fast)
  // Strictly bounded to India geographic box: bbox=minLon,minLat,maxLon,maxLat
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&bbox=68.1,6.5,97.4,37.5&limit=10`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features) && data.features.length > 0) {
        const indianFeatures = data.features.filter((f: any) => {
          const cCode = (f.properties?.countrycode || '').toUpperCase();
          const countryName = (f.properties?.country || '').toLowerCase();
          const [lon, lat] = f.geometry?.coordinates || [0, 0];
          const isWithinIndiaBox = lon >= 68.0 && lon <= 97.5 && lat >= 6.5 && lat <= 37.5;
          const isIndiaNameOrCode = cCode === 'IN' || countryName === 'india';
          return (isIndiaNameOrCode || !cCode) && isWithinIndiaBox;
        });

        if (indianFeatures.length > 0) {
          const parsed = indianFeatures.slice(0, 6).map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [78.4867, 17.3850];
            const name = props.name || props.street || props.city || cleanQ;
            const city = props.city || props.district || props.county || name;
            const state = props.state || 'Telangana';
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
    }
  } catch (photonErr) {
    console.warn('Photon geocoding fallback failed:', photonErr);
  }

  // Tier 3: Nominatim (OpenStreetMap India)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQ
    )}&countrycodes=in&format=json&addressdetails=1&limit=8`;
    const res = await fetch(nominatimUrl, {
      headers: { 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const filtered = items.filter((item: any) => {
          const code = (item.address?.country_code || '').toLowerCase();
          const cName = (item.address?.country || '').toLowerCase();
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const isWithinIndiaBox = lon >= 68.0 && lon <= 97.5 && lat >= 6.5 && lat <= 37.5;
          return code === 'in' || cName === 'india' || isWithinIndiaBox;
        });

        if (filtered.length > 0) {
          return filtered.slice(0, 6).map((item: any) => {
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
    }
  } catch (nominatimErr) {
    console.warn('Nominatim geocoding fallback failed:', nominatimErr);
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
 * 2. Reverse Geocode (Coordinates -> Structured Address)
 * Multi-Tier: Mapbox -> OpenStreetMap Nominatim -> Default Center
 */
export async function reverseGeocodeMapbox(
  latitude: number,
  longitude: number
): Promise<LocationResult | null> {
  const token = DEFAULT_MAPBOX_TOKEN;
  if (token) {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=address,neighborhood,locality,place,district,region,postcode&access_token=${token}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return parseMapboxFeature(data.features[0], latitude, longitude);
        }
      }
    } catch (mapboxErr) {
      console.warn('Mapbox reverse geocode failed, using Nominatim:', mapboxErr);
    }
  }

  // Reverse Geocoding via Nominatim OpenStreetMap
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
    console.error('reverseGeocode fallback error:', err);
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
