import React, { useState, useEffect, useRef } from 'react';
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
import { X, MapPin, Compass, Check, Search, CheckCircle2, Navigation } from 'lucide-react-native';
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
  currentPlace?: string;
  onClose: () => void;
  onApply: (radiusKm: number, city?: string, lat?: number, lng?: number, place?: string) => void;
}

const RADIUS_PRESETS = [10, 25, 50, 70, 100];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentRadius,
  currentCity = '',
  currentPlace = '',
  onClose,
  onApply,
}) => {
  const [selectedRadius, setSelectedRadius] = useState(currentRadius || 50);
  const [searchQuery, setSearchQuery] = useState('');
  const [place, setPlace] = useState(currentPlace || 'Dilsukhnagar');
  const [city, setCity] = useState(currentCity || 'Hyderabad');
  const [stateName, setStateName] = useState('Telangana');
  const [isDetecting, setIsDetecting] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({ lat: 17.3688, lng: 78.5247 });
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setSelectedRadius(currentRadius || 50);
      if (currentCity) setCity(currentCity);
      if (currentPlace) setPlace(currentPlace);
      setSearchQuery('');
      setSuggestions([]);
      setStatusMsg(null);
    }
  }, [visible, currentRadius, currentCity, currentPlace]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlacesMapbox(text, 'in');
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item: LocationResult) => {
    const p = item.place || '';
    const c = item.city || item.place || '';
    setPlace(p);
    setCity(c);
    if (item.state) setStateName(item.state);
    setCoords({ lat: item.latitude, lng: item.longitude });
    setSearchQuery('');
    setSuggestions([]);
    setStatusMsg(`Selected: ${p}, ${c}`);
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setStatusMsg('Accessing GPS coordinates...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions in device settings.');
        setIsDetecting(false);
        setStatusMsg(null);
        return;
      }

      // 1. Check last known position first for quick detection
      let loc = await Location.getLastKnownPositionAsync();

      // 2. If no cached position, query with 6s timeout race
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
      if (mapboxResult) {
        const rPlace = mapboxResult.place || 'Commercial Area';
        const rCity = mapboxResult.city || 'Hyderabad';
        const rState = mapboxResult.state || 'Telangana';
        setPlace(rPlace);
        setCity(rCity);
        setStateName(rState);
        setStatusMsg(`✅ Located: ${rPlace}, ${rCity}`);
      } else {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const detectedCity = item.city || item.subregion || item.district || 'Hyderabad';
          const detectedPlace = item.name || item.street || item.district || 'Area';
          setPlace(detectedPlace);
          setCity(detectedCity);
          if (item.region) setStateName(item.region);
          setStatusMsg(`✅ Located: ${detectedPlace}, ${detectedCity}`);
        }
      }
    } catch (e: any) {
      Alert.alert(
        'GPS Notice',
        'Could not acquire exact GPS location. Please search and select your area in the search bar.'
      );
      setStatusMsg(null);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = () => {
    onApply(
      selectedRadius,
      city.trim() || undefined,
      coords.lat,
      coords.lng,
      place.trim() || undefined
    );
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

          <ScrollView showsVerticalScrollIndicator={false}>
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
                  Automatically find commercial partners closest to your shop (Mapbox Verified)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Status Message */}
            {statusMsg && (
              <View style={styles.statusBox}>
                <CheckCircle2 size={14} color="#047857" />
                <Text style={styles.statusText}>{statusMsg}</Text>
              </View>
            )}

            {/* City / Place Input with Mapbox Autocomplete */}
            <Text style={styles.sectionLabel}>Search City / Area (Mapbox Autocomplete)</Text>
            <View style={styles.inputBox}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="Type place or city (e.g. Dilsukhnagar, Banjara Hills...)"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searching && <ActivityIndicator size="small" color="#003893" />}
            </View>

            {/* Mapbox Suggestions dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <MapPin size={14} color="#003893" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTitle}>{item.place}, {item.city}</Text>
                      <Text style={styles.suggestionSub} numberOfLines={1}>
                        {item.fullAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Location Details Breakdown (Mirrors Website) */}
            <View style={styles.detailsCard}>
              <View style={styles.detailsCardHeader}>
                <Text style={styles.detailsCardTitle}>SELECTED LOCATION DETAILS</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Mapbox Verified</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Place / Area *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={place}
                    onChangeText={setPlace}
                    placeholder="e.g. Dilsukhnagar"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Hyderabad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 8 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>State *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={stateName}
                    onChangeText={setStateName}
                    placeholder="Telangana"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Country</Text>
                  <View style={[styles.fieldInput, { backgroundColor: '#f1f5f9', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>India</Text>
                  </View>
                </View>
              </View>

              {coords.lat && coords.lng && (
                <View style={styles.coordsRow}>
                  <MapPin size={12} color="#dc2626" />
                  <Text style={styles.coordsText}>
                    GPS: Lat {Number(coords.lat).toFixed(4)}, Lng {Number(coords.lng).toFixed(4)}
                  </Text>
                </View>
              )}
            </View>

            {/* Radius Selector */}
            <Text style={styles.sectionLabel}>
              Partner Discovery Radius:{' '}
              <Text style={{ color: '#003893', fontWeight: '900' }}>{selectedRadius} km</Text>
            </Text>
            <Text style={styles.radiusHelp}>
              Only display commercial partners operating within this radius
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
          </ScrollView>
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '700',
    flex: 1,
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailsCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  gridRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    height: 38,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  coordsText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: 'monospace',
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
