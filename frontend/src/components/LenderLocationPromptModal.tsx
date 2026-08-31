import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  X,
  Compass,
  Building2,
  Sliders,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getBrowserLocation,
  reverseGeocodeMapbox,
} from '../services/mapboxService';
import { LocationPickerModal } from './LocationPickerModal';

interface LenderLocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: {
    place?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    lendingRadiusKm?: number;
  };
  onSaveLocation: (loc: {
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    address?: string;
    lendingRadiusKm?: number;
  }) => Promise<void> | void;
}

export const LenderLocationPromptModal: React.FC<LenderLocationPromptModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlace = currentLocation.place || currentLocation.city || 'Office Location';
  const currentCity = currentLocation.city || 'Hyderabad';
  const currentState = currentLocation.state || 'Telangana';
  const currentLat = currentLocation.latitude || 17.385;
  const currentLng = currentLocation.longitude || 78.4867;
  const currentRadius = currentLocation.lendingRadiusKm || 25;

  const handleUseGps = async () => {
    setIsDetectingGps(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const coords = await getBrowserLocation();
      const geocoded = await reverseGeocodeMapbox(coords.latitude, coords.longitude);

      const updatedLoc = {
        place: geocoded?.place || 'Lending Office Location',
        city: geocoded?.city || currentCity,
        state: geocoded?.state || currentState,
        country: geocoded?.country || 'India',
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: geocoded?.fullAddress || `${geocoded?.city || currentCity}, ${geocoded?.state || currentState}`,
        lendingRadiusKm: currentRadius,
      };

      await onSaveLocation(updatedLoc);
      setSuccessMessage(`✅ Office location updated to ${updatedLoc.place}, ${updatedLoc.city}`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Could not fetch device GPS. Please grant permission or search manually on the map.'
      );
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleKeepExisting = () => {
    try {
      sessionStorage.setItem('sbni_lender_loc_prompted', 'true');
    } catch (e) {}
    onClose();
  };

  const handleSaveFromMapPicker = async (loc: any) => {
    setIsMapPickerOpen(false);
    await onSaveLocation({
      ...loc,
      address: loc.place ? `${loc.place}, ${loc.city}` : `${loc.city}, ${loc.state}`,
      lendingRadiusKm: loc.lendingRadiusKm || currentRadius,
    });
    setSuccessMessage(`✅ Office location updated to ${loc.place || loc.city}`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-lg bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-2xl my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
          
          {/* Top-Right Close Button */}
          <button
            onClick={handleKeepExisting}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Dismiss and keep existing location"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold shadow-xs">
              <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Financer Office & Lending Service Area</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              Confirm Your Lending Office Location
            </h2>

            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              JustPaisa connects you with local shop owners and startups looking for business funding within your service radius. Ensure your office location is accurate.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── CARD 1: LAST RECORDED MAPBOX LOCATION ── */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Current Recorded Office Location
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> On File
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">{currentPlace}, {currentCity}</span>
              </div>
              <div className="text-xs text-slate-500 font-medium pl-5.5">
                {currentState}, India • <span className="font-bold text-slate-700">{currentRadius} km Service Radius</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono pl-5.5">
                Coordinates: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
              </div>
            </div>
          </div>

          {/* ── ACTION BUTTONS: 3 CHOICES ── */}
          <div className="space-y-2.5 pt-1">
            
            {/* Action 1: Use Current Device GPS */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isDetectingGps}
              className="w-full p-3.5 rounded-2xl bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-emerald-700/20 transition-all cursor-pointer active:scale-98 disabled:opacity-75"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  {isDetectingGps ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-extrabold leading-tight">
                    {isDetectingGps ? 'Detecting Office GPS...' : 'Use Current Device GPS'}
                  </div>
                  <div className="text-[10px] text-emerald-100 font-normal">
                    Auto-capture exact coordinates of your current office
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white shrink-0 ml-2" />
            </button>

            {/* Action 2: Pick on Map / Search Landmark */}
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(true)}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-[#003893] text-[#003893] font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-[#003893]">
                  <Search className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-extrabold leading-tight">
                    Search Landmark or Pin on Map
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Search metro station, business center, or adjust radius
                  </div>
                </div>
              </div>
              <Sliders className="w-4 h-4 text-[#003893] shrink-0 ml-2" />
            </button>

            {/* Action 3: Keep Existing Location */}
            <button
              type="button"
              onClick={handleKeepExisting}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Keep Existing Location ({currentCity}, {currentState})</span>
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-slate-400 text-center font-medium pt-1">
            You can also adjust your lending location and service radius anytime from your homepage.
          </div>

        </div>
      </div>

      {/* Mapbox Interactive Location Picker Modal */}
      {isMapPickerOpen && (
        <LocationPickerModal
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          onSave={handleSaveFromMapPicker}
          initialLocation={{
            place: currentPlace,
            city: currentCity,
            state: currentState,
            country: currentLocation.country || 'India',
            latitude: currentLat,
            longitude: currentLng,
            lendingRadiusKm: currentRadius,
          }}
          mode="LENDER_RADIUS"
          title="Set Office & Lending Radius"
          subtitle="Choose your branch location and lending coverage radius (5 km – 100 km) to receive matching vendor loan applications."
        />
      )}
    </>
  );
};
