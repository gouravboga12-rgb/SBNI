import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  X,
  Compass,
  Building2,
  Globe2,
  Radio,
  Sliders,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  LocationResult,
  searchPlacesMapbox,
  reverseGeocodeMapbox,
  getBrowserLocation,
} from '../services/mapboxService';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: {
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    lendingRadiusKm?: number;
  }) => void;
  initialLocation?: {
    place?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    lendingRadiusKm?: number;
  };
  mode?: 'LENDER_RADIUS' | 'VENDOR_SEARCH' | 'GENERAL_LOCATION';
  title?: string;
  subtitle?: string;
}

const RADIUS_OPTIONS = [10, 25, 50, 70, 100];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  mode = 'GENERAL_LOCATION',
  title,
  subtitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Structured form state
  const [place, setPlace] = useState(initialLocation?.place || 'Dilsukhnagar');
  const [city, setCity] = useState(initialLocation?.city || 'Hyderabad');
  const [stateName, setStateName] = useState(initialLocation?.state || 'Telangana');
  const [country, setCountry] = useState(initialLocation?.country || 'India');
  const [latitude, setLatitude] = useState<number>(initialLocation?.latitude || 17.3688);
  const [longitude, setLongitude] = useState<number>(initialLocation?.longitude || 78.5247);
  const [radiusKm, setRadiusKm] = useState<number>(initialLocation?.lendingRadiusKm || 50);

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (initialLocation) {
      if (initialLocation.place) setPlace(initialLocation.place);
      if (initialLocation.city) setCity(initialLocation.city);
      if (initialLocation.state) setStateName(initialLocation.state);
      if (initialLocation.country) setCountry(initialLocation.country);
      if (initialLocation.latitude) setLatitude(initialLocation.latitude);
      if (initialLocation.longitude) setLongitude(initialLocation.longitude);
      if (initialLocation.lendingRadiusKm) setRadiusKm(initialLocation.lendingRadiusKm);
    }
  }, [initialLocation, isOpen]);

  if (!isOpen) return null;

  // Handle Search Input Debounced Autocomplete via Mapbox
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setErrorMessage(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlacesMapbox(val, 'in');
      setSuggestions(results);
      setIsSearching(false);
    }, 300);
  };

  // Select a suggestion from autocomplete
  const handleSelectSuggestion = (loc: LocationResult) => {
    setPlace(loc.place);
    setCity(loc.city);
    setStateName(loc.state);
    setCountry(loc.country);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setSearchQuery('');
    setSuggestions([]);
    setStatusMessage(`Selected: ${loc.fullAddress}`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // GPS "Use My Location" (Triggers only on explicit button click)
  const handleUseMyLocation = async () => {
    setIsLocatingGPS(true);
    setErrorMessage(null);
    setStatusMessage('Accessing GPS coordinates...');

    try {
      const coords = await getBrowserLocation();
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      setStatusMessage('Finding address with Mapbox...');
      const reverse = await reverseGeocodeMapbox(coords.latitude, coords.longitude);

      if (reverse) {
        setPlace(reverse.place);
        setCity(reverse.city);
        setStateName(reverse.state);
        setCountry(reverse.country);
        setStatusMessage(`✅ Located: ${reverse.place}, ${reverse.city}`);
      } else {
        setStatusMessage('✅ Coordinates captured via GPS.');
      }
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not retrieve GPS location.');
      setStatusMessage(null);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const handleSave = () => {
    onSave({
      place: place.trim() || 'Central District',
      city: city.trim() || 'Hyderabad',
      state: stateName.trim() || 'Telangana',
      country: country.trim() || 'India',
      latitude: parseFloat(Number(latitude).toFixed(6)),
      longitude: parseFloat(Number(longitude).toFixed(6)),
      lendingRadiusKm: mode === 'LENDER_RADIUS' ? radiusKm : undefined,
    });
    onClose();
  };

  const isLenderMode = mode === 'LENDER_RADIUS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-heading">
                {title || (isLenderMode ? 'Set Lending Service Area & Radius' : 'Select Search Location')}
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                {subtitle || (isLenderMode ? 'Powered by Mapbox Location Services' : 'Discover nearby business financers')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Action: Use My Location Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocatingGPS}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#007a33] font-extrabold text-xs border border-emerald-300 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-70"
            >
              {isLocatingGPS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Locating via GPS & Mapbox...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>Use My Location (Mapbox GPS)</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback & Error Messages */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#003893] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mapbox Live Autocomplete Search Bar */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-extrabold text-slate-700">
              Search Place / City / Area (India)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Type place or city (e.g. Dilsukhnagar, Hyderabad, Vijayawada...)"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#003893] focus:bg-white transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors flex items-start gap-2.5 text-xs group"
                  >
                    <MapPin className="w-4 h-4 text-[#003893] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-[#003893]">
                        {item.place}, {item.city}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{item.fullAddress}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Structured Location Breakdown (Editable) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Selected Location Details</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Mapbox Coordinates Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Place / Area *</label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#003893]"
                  placeholder="e.g. Dilsukhnagar / Chaitanyapuri"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#003893]"
                  placeholder="e.g. Hyderabad / Vijayawada"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">State *</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#003893]"
                  placeholder="e.g. Telangana / Andhra Pradesh"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                />
              </div>
            </div>

            {/* Coordinates Badge */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> GPS Coordinates:
              </span>
              <span>
                Lat: <strong className="text-slate-900">{Number(latitude).toFixed(4)}</strong>, Lng:{' '}
                <strong className="text-slate-900">{Number(longitude).toFixed(4)}</strong>
              </span>
            </div>
          </div>

          {/* LENDER ONLY: Lending Service Radius Picker */}
          {isLenderMode && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#003893] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span>Configured Lending Service Radius</span>
                </label>
                <span className="bg-[#003893] text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {radiusKm} KM
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Small shop businesses within <strong className="text-slate-900">{radiusKm} KM</strong> of{' '}
                <strong className="text-slate-900">{place || city}</strong> will discover your financer profile.
              </p>

              {/* Radius Quick Selector Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRadiusKm(opt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      radiusKm === opt
                        ? 'bg-[#003893] text-white border-[#003893] shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-100/60'
                    }`}
                  >
                    {opt} KM
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Save Location</span>
          </button>
        </div>

      </div>
    </div>
  );
};
