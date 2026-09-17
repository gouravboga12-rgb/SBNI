import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Compass,
  MapPin,
  X,
  Building2,
  Search,
  Navigation,
  SlidersHorizontal,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { reverseGeocodeMapbox } from '../services/mapboxService';
import { LocationPickerModal } from './LocationPickerModal';

interface LenderLocationPromptModalProps {
  visible: boolean;
  onClose: () => void;
  currentLocation: {
    place?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    lendingRadiusKm?: number;
  };
  onSaveLocation: (loc: {
    place?: string;
    city: string;
    state?: string;
    latitude: number;
    longitude: number;
    lendingRadiusKm?: number;
  }) => Promise<void> | void;
}

export const LenderLocationPromptModal: React.FC<LenderLocationPromptModalProps> = ({
  visible,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  if (!visible) return null;

  const currentPlace = currentLocation.place || 'Chaitanya Puri Main Road';
  const currentCity = currentLocation.city || 'Hyderabad';
  const currentState = currentLocation.state || 'Telangana';
  const currentLat = currentLocation.latitude ? Number(currentLocation.latitude) : 17.3736;
  const currentLng = currentLocation.longitude ? Number(currentLocation.longitude) : 78.5388;
  const currentRadius = currentLocation.lendingRadiusKm || 100;

  const handleUseGps = async () => {
    setIsDetectingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions to detect office coordinates.');
        setIsDetectingGps(false);
        return;
      }

      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        const fetchPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('GPS timeout')), 6000)
        );
        loc = (await Promise.race([fetchPromise, timeoutPromise])) as any;
      }

      if (!loc || !loc.coords) {
        throw new Error('Coordinates unavailable');
      }

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const geocoded = await reverseGeocodeMapbox(lat, lng);
      const updatedLoc = {
        place: geocoded?.place || 'Financing Office',
        city: geocoded?.city || currentCity,
        state: geocoded?.state || currentState,
        latitude: lat,
        longitude: lng,
        lendingRadiusKm: currentRadius,
      };

      await onSaveLocation(updatedLoc);
      Alert.alert('Office Location Updated 🎉', `Office set to ${updatedLoc.place}, ${updatedLoc.city}`);
      onClose();
    } catch (err: any) {
      Alert.alert('Notice', 'Could not detect exact GPS coordinates. Please search on the map below.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSaveFromMapPicker = async (radius: number, city?: string, lat?: number, lng?: number) => {
    setIsMapPickerOpen(false);
    if (city && lat && lng) {
      await onSaveLocation({
        place: city,
        city,
        state: currentState,
        latitude: lat,
        longitude: lng,
        lendingRadiusKm: radius,
      });
      Alert.alert('Office Location Updated 🎉', `Office set to ${city} (${radius} km radius)`);
      onClose();
    }
  };

  return (
    <>
      <Modal
        visible={visible && !isMapPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Top Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>

            {/* Header Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Compass size={13} color="#059669" />
                <Text style={styles.badgeText}>Financer Office & Lending Service Area</Text>
              </View>
            </View>

            {/* Header Title & Subtitle */}
            <Text style={styles.title}>Confirm Your Lending Office Location</Text>
            <Text style={styles.subtitle}>
              JustPaisa connects you with local shop owners and startups looking for business funding within your service radius. Ensure your office location is accurate.
            </Text>

            {/* Current Recorded Office Location Box */}
            <View style={styles.currentBox}>
              <View style={styles.currentBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Building2 size={13} color="#003893" />
                  <Text style={styles.currentBoxLabel}>CURRENT RECORDED OFFICE LOCATION</Text>
                </View>
                <View style={styles.onFileBadge}>
                  <ShieldCheck size={11} color="#003893" />
                  <Text style={styles.onFileText}>On File</Text>
                </View>
              </View>

              <View style={styles.currentAddressRow}>
                <MapPin size={16} color="#ef4444" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentAddressText}>
                    {currentPlace ? `${currentPlace}, ` : ''}{currentCity}
                  </Text>
                  <Text style={styles.currentRadiusSub}>
                    {currentState}, India • {currentRadius} km Service Radius
                  </Text>
                  <Text style={styles.currentCoordsSub}>
                    Coordinates: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
                  </Text>
                </View>
              </View>
            </View>

            {/* Button 1: Green GPS Button */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleUseGps}
              disabled={isDetectingGps}
              activeOpacity={0.88}
            >
              <View style={styles.gpsIconCircle}>
                {isDetectingGps ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Navigation size={18} color="#ffffff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsBtnTitle}>Use Current Device GPS</Text>
                <Text style={styles.gpsBtnSub}>
                  Auto-capture exact coordinates of your current office
                </Text>
              </View>
              <ArrowRight size={18} color="#ffffff" />
            </TouchableOpacity>

            {/* Button 2: White with Blue Border - Map Search */}
            <TouchableOpacity
              style={styles.mapSearchBtn}
              onPress={() => setIsMapPickerOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.mapSearchIconCircle}>
                <Search size={16} color="#003893" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapSearchTitle}>Search Landmark or Pin on Map</Text>
                <Text style={styles.mapSearchSub}>
                  Search metro station, business center, or adjust radius
                </Text>
              </View>
              <SlidersHorizontal size={16} color="#003893" />
            </TouchableOpacity>

            {/* Button 3: Keep Existing Location */}
            <TouchableOpacity
              style={styles.keepExistingBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.keepExistingText}>
                Keep Existing Location ({currentCity}, {currentState})
              </Text>
            </TouchableOpacity>

            {/* Footer Notice */}
            <Text style={styles.footerNote}>
              You can also adjust your lending location and service radius anytime from your homepage.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Mapbox Location Picker */}
      <LocationPickerModal
        visible={isMapPickerOpen}
        currentRadius={currentRadius}
        currentCity={currentCity}
        onClose={() => setIsMapPickerOpen(false)}
        onApply={handleSaveFromMapPicker}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  currentBox: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  currentBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentBoxLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#003893',
    letterSpacing: 0.5,
  },
  onFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dbeafe',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  onFileText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#003893',
  },
  currentAddressRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  currentAddressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 18,
  },
  currentRadiusSub: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  currentCoordsSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94a3b8',
    marginTop: 2,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#007a33',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#007a33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  gpsBtnSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  mapSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#003893',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  mapSearchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSearchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  mapSearchSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  keepExistingBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  keepExistingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  footerNote: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
});
