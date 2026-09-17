import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { X, MapPin, Compass, Check } from 'lucide-react-native';
import * as Location from 'expo-location';

interface LocationPickerModalProps {
  visible: boolean;
  currentRadius: number;
  currentCity?: string;
  onClose: () => void;
  onApply: (radiusKm: number, city?: string, lat?: number, lng?: number) => void;
}

const RADIUS_PRESETS = [10, 25, 50, 70, 100];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentRadius,
  currentCity = '',
  onClose,
  onApply,
}) => {
  const [selectedRadius, setSelectedRadius] = useState(currentRadius || 50);
  const [cityInput, setCityInput] = useState(currentCity);
  const [isDetecting, setIsDetecting] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in device settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoords({ lat, lng });

      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const detectedName = item.city || item.subregion || item.district || item.region || '';
        if (detectedName) setCityInput(detectedName);
      }
    } catch (e: any) {
      Alert.alert('Notice', 'Could not detect location automatically. Please enter your city name.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = () => {
    onApply(selectedRadius, cityInput.trim() || undefined, coords.lat, coords.lng);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MapPin size={20} color="#003893" />
              <Text style={styles.headerTitle}>Discovery Radius & Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* GPS Auto Detect Banner */}
          <TouchableOpacity
            style={styles.gpsBanner}
            onPress={handleAutoDetect}
            disabled={isDetecting}
            activeOpacity={0.8}
          >
            <View style={styles.gpsIconCircle}>
              {isDetecting ? (
                <ActivityIndicator size="small" color="#003893" />
              ) : (
                <Compass size={20} color="#003893" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
              <Text style={styles.gpsSubtitle}>
                Automatically find financers closest to your shop
              </Text>
            </View>
          </TouchableOpacity>

          {/* City / Place Input */}
          <Text style={styles.sectionLabel}>City / Area</Text>
          <View style={styles.inputBox}>
            <MapPin size={18} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Hyderabad, Mumbai, Bangalore"
              placeholderTextColor="#94a3b8"
              value={cityInput}
              onChangeText={setCityInput}
            />
          </View>

          {/* Radius Selector */}
          <Text style={styles.sectionLabel}>
            Financer Distance Radius: <Text style={{ color: '#003893', fontWeight: '900' }}>{selectedRadius} km</Text>
          </Text>
          <Text style={styles.radiusHelp}>
            Only display business financers operating within this radius
          </Text>
          <View style={styles.radiusRow}>
            {RADIUS_PRESETS.map((km) => {
              const active = selectedRadius === km;
              return (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusBtn, active && styles.radiusBtnActive]}
                  onPress={() => setSelectedRadius(km)}
                >
                  <Text style={[styles.radiusBtnText, active && styles.radiusBtnTextActive]}>
                    {km} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Check size={18} color="#ffffff" />
            <Text style={styles.applyBtnText}>Apply Location & Radius</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  gpsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e40af',
  },
  gpsSubtitle: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  radiusHelp: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  radiusBtnActive: {
    borderColor: '#003893',
    backgroundColor: '#003893',
  },
  radiusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  radiusBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 15,
    borderRadius: 14,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
