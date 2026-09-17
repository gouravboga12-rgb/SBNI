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
  CheckCircle2,
  X,
  Building2,
  Check,
  Search,
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

  const currentCity = currentLocation.city || 'Hyderabad';
  const currentRadius = currentLocation.lendingRadiusKm || 25;

  const handleUseGps = async () => {
    setIsDetectingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions to detect office coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const geocoded = await reverseGeocodeMapbox(lat, lng);
      const updatedLoc = {
        place: geocoded?.place || 'Financing Office',
        city: geocoded?.city || currentCity,
        state: geocoded?.state || 'Telangana',
        latitude: lat,
        longitude: lng,
        lendingRadiusKm: currentRadius,
      };

      await onSaveLocation(updatedLoc);
      Alert.alert('Location Updated', `Office set to ${updatedLoc.place}, ${updatedLoc.city}`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not fetch GPS coordinates.');
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
        latitude: lat,
        longitude: lng,
        lendingRadiusKm: radius,
      });
      Alert.alert('Location Updated', `Office set to ${city}`);
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
            {/* Header */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Compass size={14} color="#059669" />
                <Text style={styles.badgeText}>Financer Location Check</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Confirm Your Operating Location</Text>
            <Text style={styles.subtitle}>
              Nearby shop owners discover you based on your office location and radius. Please ensure your location is up to date.
            </Text>

            {/* Current Location Pill */}
            <View style={styles.currentLocPill}>
              <Building2 size={16} color="#003893" />
              <Text style={styles.currentLocText} numberOfLines={1}>
                Current: <Text style={{ fontWeight: '800', color: '#0f172a' }}>{currentCity}</Text> ({currentRadius} KM Radius)
              </Text>
            </View>

            {/* Option 1: Use Current GPS */}
            <TouchableOpacity
              style={styles.optionBtnPrimary}
              onPress={handleUseGps}
              disabled={isDetectingGps}
              activeOpacity={0.85}
            >
              {isDetectingGps ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Compass size={18} color="#ffffff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionBtnPrimaryTitle}>Use Current GPS Location</Text>
                    <Text style={styles.optionBtnPrimarySub}>Auto-detect office coordinates (Mapbox)</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Option 2: Search Mapbox Location */}
            <TouchableOpacity
              style={styles.optionBtnSecondary}
              onPress={() => setIsMapPickerOpen(true)}
              activeOpacity={0.85}
            >
              <Search size={18} color="#003893" />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionBtnSecondaryTitle}>Search & Pick Location</Text>
                <Text style={styles.optionBtnSecondarySub}>Select area & radius on Mapbox</Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: Keep Existing */}
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.keepBtnText}>Keep Existing ({currentCity})</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  currentLocPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  currentLocText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  optionBtnPrimary: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  optionBtnPrimaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  optionBtnPrimarySub: {
    fontSize: 10,
    color: '#d1fae5',
    marginTop: 1,
  },
  optionBtnSecondary: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  optionBtnSecondaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  optionBtnSecondarySub: {
    fontSize: 10,
    color: '#3b82f6',
    marginTop: 1,
  },
  keepBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  keepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
});
