import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { X, MapPin, Compass, Check, Search } from 'lucide-react-native';
import * as Location from 'expo-location';
import {
  searchPlacesMapbox,
  reverseGeocodeMapbox,
  LocationResult,
} from '../services/mapboxService';

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
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedRadius(currentRadius || 50);
      setCityInput(currentCity || '');
      setSuggestions([]);
    }
  }, [visible, currentRadius, currentCity]);

  const handleSearchQuery = async (text: string) => {
    setCityInput(text);
    if (text.trim().length >= 2) {
      setSearching(true);
      try {
        const results = await searchPlacesMapbox(text);
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: LocationResult) => {
    setCityInput(item.city || item.place);
    setCoords({ lat: item.latitude, lng: item.longitude });
    setSuggestions([]);
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions in device settings.');
        setIsDetecting(false);
        return;
      }

      // 1. Check last known position first for instantaneous result
      let loc = await Location.getLastKnownPositionAsync();

      // 2. If no cached position, query with a strict 6-second timeout race
      if (!loc) {
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout')), 6000)
        );
        loc = (await Promise.race([locationPromise, timeoutPromise])) as any;
      }

      if (!loc || !loc.coords) {
        throw new Error('Coordinates unavailable');
      }

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoords({ lat, lng });

      const mapboxResult = await reverseGeocodeMapbox(lat, lng);
      if (mapboxResult && (mapboxResult.city || mapboxResult.place)) {
        setCityInput(mapboxResult.city || mapboxResult.place);
      } else {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const detectedName = item.city || item.subregion || item.district || item.region || item.name || '';
          if (detectedName) setCityInput(detectedName);
        }
      }
    } catch (e: any) {
      Alert.alert(
        'GPS Detection Notice',
        'Could not acquire immediate GPS fix. Please type your area or landmark in the search box below.'
      );
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
                Automatically find financers closest to your shop (Mapbox Verified)
              </Text>
            </View>
          </TouchableOpacity>

          {/* City / Place Input with Mapbox Autocomplete */}
          <Text style={styles.sectionLabel}>Search City / Area (Mapbox)</Text>
          <View style={styles.inputBox}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="Search place, city or area (e.g. Hyderabad)"
              placeholderTextColor="#94a3b8"
              value={cityInput}
              onChangeText={handleSearchQuery}
            />
            {searching && <ActivityIndicator size="small" color="#003893" />}
          </View>

          {/* Mapbox Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <MapPin size={14} color="#003893" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{item.place}</Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {item.fullAddress}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Radius Selector */}
          <Text style={styles.sectionLabel}>
            Financer Distance Radius:{' '}
            <Text style={{ color: '#003893', fontWeight: '900' }}>{selectedRadius} km</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#003893',
  },
  gpsSubtitle: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    marginTop: 4,
  },
  radiusHelp: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  suggestionsContainer: {
    maxHeight: 160,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  suggestionSub: {
    fontSize: 10,
    color: '#64748b',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  radiusBtnActive: {
    backgroundColor: '#003893',
    borderColor: '#003893',
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
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
