import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
  Alert,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  Users,
  Search,
  MapPin,
  Phone,
  MessageSquare,
  Info,
  CheckCircle2,
  AlertTriangle,
  Store,
  X,
  Navigation,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { fetchVendorProfilesForLenderApi } from '../../services/api';
import { DiscoveredBusiness } from '../../types';
import { resolveDocumentUrl } from '../../utils/documentGenerators';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BUSINESS_CATEGORIES = [
  'All',
  'Retail & Kirana',
  'Wholesale',
  'Manufacturing',
  'Food & Dining',
  'Services',
  'Garments',
  'Electronics',
];

export const LenderBusinessesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { lenderProfile } = useAuth();
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBusinessForInfo, setSelectedBusinessForInfo] = useState<DiscoveredBusiness | null>(null);

  const activeRadiusKm = lenderProfile?.lendingRadiusKm || 50;
  const lenderLat = lenderProfile?.latitude || 17.3688;
  const lenderLng = lenderProfile?.longitude || 78.5247;

  useEffect(() => {
    loadBusinesses();
  }, []);

  const calculateDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const data = await fetchVendorProfilesForLenderApi();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: DiscoveredBusiness[] = data.map((vp: any) => {
          const u = vp.user || {};
          const vLat = vp.latitude ? Number(vp.latitude) : 17.3688;
          const vLng = vp.longitude ? Number(vp.longitude) : 78.5247;
          const distKm = calculateDist(lenderLat, lenderLng, vLat, vLng);

          return {
            id: vp.id || vp.userId,
            vendorName: vp.ownerName || u.name || 'Business Owner',
            shopName: vp.businessName || 'Business Enterprise',
            shopAddress: vp.address || `${vp.place || 'Commercial Area'}, ${vp.city || 'Hyderabad'}`,
            city: vp.city || 'Hyderabad',
            state: vp.state || 'Telangana',
            place: vp.place || 'Commercial Area',
            category: vp.category || 'Retail Shop Business',
            annualTurnover: vp.annualTurnover || '10 - 25 Lakhs',
            monthlyIncome: '₹ 50,000 / month',
            mobileNumber: vp.mobileNumber || vp.phone || vp.user?.phone || u.phone || (vp.contactNumber || 'Not provided'),
            emailId: vp.emailId || vp.email || u.email || 'vendor@example.com',
            dateOfBirth: vp.dateOfBirth || 'Not specified',
            panNumber: vp.panNumber,
            aadhaarNumber: vp.aadhaarNumber,
            gstNumber: vp.gstNumber,
            isFraud: !!vp.isFraud,
            avatarUrl: vp.avatarUrl || null,
            liveSelfieUrl: vp.avatarUrl || null,
            panFileUrl: vp.panFileUrl || null,
            aadhaarFileUrl: vp.aadhaarFileUrl || null,
            shopLicensePdf: vp.businessLicenseUrl || null,
            gstCertificatePdf: vp.gstFileUrl || null,
            distanceKm: distKm,
            isWithinRadius: distKm <= activeRadiusKm,
            latitude: vLat,
            longitude: vLng,
          };
        });
        setBusinesses(mapped);
      } else {
        setBusinesses([]);
      }
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCall = (phone?: string) => {
    const raw = (phone || '').replace(/\D/g, '');
    if (raw.length >= 10) {
      Linking.openURL(`tel:${raw}`).catch(() => {
        Alert.alert('Call Error', 'Could not open device dialer.');
      });
    } else {
      Alert.alert('Notice', 'Mobile number not provided.');
    }
  };

  const handleWhatsApp = (phone?: string, shopName?: string) => {
    const raw = (phone || '').replace(/\D/g, '');
    if (raw.length >= 10) {
      const cleanPhone = raw.length === 10 ? `91${raw}` : raw;
      const msg = encodeURIComponent(
        `Hello! I saw your business "${shopName || 'Shop'}" on JustPaisa and would like to discuss business financing options.`
      );
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {
        Alert.alert('WhatsApp Error', 'Could not open WhatsApp.');
      });
    } else {
      Alert.alert('Notice', 'WhatsApp number not provided.');
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    // 1. Category filter
    if (selectedCategory !== 'All') {
      const catKeyword = selectedCategory.split(' ')[0].toLowerCase();
      if (!b.category || !b.category.toLowerCase().includes(catKeyword)) {
        return false;
      }
    }
    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.shopName.toLowerCase().includes(q) ||
      b.vendorName.toLowerCase().includes(q) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.place && b.place.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.topCard}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>Discovered Businesses</Text>
            <Text style={styles.mainSub}>Small shops and local startups near your service area</Text>
          </View>
          <View style={styles.radiusPill}>
            <MapPin size={12} color="#047857" />
            <Text style={styles.radiusPillText}>{activeRadiusKm} KM Radius</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by shop name, owner, category, city..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {BUSINESS_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Businesses List */}
      <FlatList
        key={isTablet ? 'tablet-2' : 'phone-1'}
        numColumns={isTablet ? 2 : 1}
        data={filteredBusinesses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadBusinesses();
            }}
            colors={['#007a33']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Store size={32} color="#007a33" />
            </View>
            <Text style={styles.emptyCardTitle}>No Businesses Found in Radius</Text>
            <Text style={styles.emptyCardDesc}>
              Currently there are no registered small shops or startups discovered matching your criteria within {activeRadiusKm} km of your office location. Try increasing your lending radius in the Profile tab.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isFraud = !!item.isFraud;
          const avatarUri = item.avatarUrl ? resolveDocumentUrl(item.avatarUrl) : null;

          return (
            <View style={[styles.card, isTablet && styles.cardTablet, isFraud && styles.cardFraud]}>
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarBox}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarInitial}>{item.shopName.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardShopName}>{item.shopName}</Text>
                  <Text style={styles.cardOwnerName}>Owner: {item.vendorName}</Text>
                </View>
                {isFraud ? (
                  <View style={styles.fraudPill}>
                    <AlertTriangle size={10} color="#dc2626" />
                    <Text style={styles.fraudPillText}>Fraud</Text>
                  </View>
                ) : (
                  <View style={styles.verifiedPill}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                )}
              </View>

              {/* Distance Box */}
              <View style={styles.distanceBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                  <MapPin size={12} color="#dc2626" />
                  <Text style={styles.distanceText} numberOfLines={1}>
                    {item.distanceKm || 0} KM away • {item.place || item.city}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.insideRadiusPill,
                    item.isWithinRadius ? styles.insideRadiusGreen : styles.outsideRadiusAmber,
                  ]}
                >
                  {item.isWithinRadius ? 'Inside Radius' : 'Outside Radius'}
                </Text>
              </View>

              {/* Details Rows */}
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name:</Text>
                  <Text style={styles.detailVal}>{item.shopName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Annual Income:</Text>
                  <Text style={styles.detailValIncome}>
                    {item.annualTurnover || 'Under 2 Lakhs'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Row 1 = Call & WhatsApp, Row 2 = Directions & Details */}
              <View style={styles.actionsContainer}>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(item.mobileNumber)}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#ffffff" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.whatsAppBtn}
                    onPress={() => handleWhatsApp(item.mobileNumber, item.shopName)}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color="#ffffff" />
                    <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => {
                      const lat = item.latitude || 17.3688;
                      const lng = item.longitude || 78.5247;
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
                    }}
                    activeOpacity={0.8}
                  >
                    <Navigation size={14} color="#007a33" />
                    <Text style={styles.mapBtnText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.moreInfoBtn}
                    onPress={() => setSelectedBusinessForInfo(item)}
                    activeOpacity={0.8}
                  >
                    <Info size={14} color="#003893" />
                    <Text style={styles.moreInfoBtnText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* More Info & Non-Sensitive Business Location Modal */}
      <Modal
        visible={!!selectedBusinessForInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBusinessForInfo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBusinessForInfo && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalShopHeaderRow}>
                    <View style={styles.modalAvatarBox}>
                      {selectedBusinessForInfo.avatarUrl ? (
                        <Image
                          source={{
                            uri:
                              resolveDocumentUrl(selectedBusinessForInfo.avatarUrl) ||
                              selectedBusinessForInfo.avatarUrl,
                          }}
                          style={styles.modalAvatarImg}
                        />
                      ) : (
                        <Text style={styles.modalAvatarInitial}>
                          {selectedBusinessForInfo.shopName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.modalShopTitle}>{selectedBusinessForInfo.shopName}</Text>
                        {selectedBusinessForInfo.isFraud ? (
                          <View style={styles.fraudPill}>
                            <AlertTriangle size={10} color="#dc2626" />
                            <Text style={styles.fraudPillText}>Fraud</Text>
                          </View>
                        ) : (
                          <View style={styles.verifiedPill}>
                            <CheckCircle2 size={12} color="#16a34a" />
                            <Text style={styles.verifiedPillText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.modalOwnerSub}>
                        Owner: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{selectedBusinessForInfo.vendorName}</Text>
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedBusinessForInfo(null)}
                  >
                    <X size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Fraud Alert Banner if flagged */}
                {selectedBusinessForInfo.isFraud && (
                  <View style={styles.modalFraudBanner}>
                    <AlertTriangle size={18} color="#dc2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalFraudTitle}>CONFIRMED FRAUD ACCOUNT</Text>
                      <Text style={styles.modalFraudDesc}>
                        This business has been flagged for fraud by administrators. Exercise extreme caution.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Location & Navigation Card */}
                <View style={styles.modalLocCard}>
                  <View style={styles.modalLocTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                      <MapPin size={15} color="#dc2626" />
                      <Text style={styles.modalLocCity} numberOfLines={1}>
                        {selectedBusinessForInfo.place || 'Commercial Area'}, {selectedBusinessForInfo.city}, {selectedBusinessForInfo.state}
                      </Text>
                    </View>
                    <Text style={styles.modalLocDistance}>
                      {selectedBusinessForInfo.distanceKm} KM away
                    </Text>
                  </View>

                  <Text style={styles.modalLocAddress}>
                    <Text style={{ fontWeight: '700', color: '#334155' }}>Shop Address: </Text>
                    {selectedBusinessForInfo.shopAddress}
                  </Text>

                  <TouchableOpacity
                    style={styles.directionsBtn}
                    onPress={() => {
                      const lat = selectedBusinessForInfo.latitude || 17.3688;
                      const lng = selectedBusinessForInfo.longitude || 78.5247;
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Navigation size={14} color="#003893" />
                    <Text style={styles.directionsBtnText}>Open Directions on Google Maps</Text>
                  </TouchableOpacity>
                </View>

                {/* Business Highlights */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>BUSINESS PROFILE HIGHLIGHTS</Text>
                  <View style={styles.modalGrid}>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Business / Shop Name</Text>
                      <Text style={styles.modalGridVal}>{selectedBusinessForInfo.shopName}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Annual Income</Text>
                      <Text style={[styles.modalGridVal, { color: '#047857' }]}>
                        {selectedBusinessForInfo.annualTurnover || 'Under 2 Lakhs'}
                      </Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Category</Text>
                      <Text style={styles.modalGridVal}>{selectedBusinessForInfo.category || 'Retail Shop'}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Location</Text>
                      <Text style={styles.modalGridVal}>{selectedBusinessForInfo.city}, {selectedBusinessForInfo.state}</Text>
                    </View>
                  </View>
                </View>

                {/* Direct Contact Actions */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>DIRECT BUSINESS CONTACT</Text>
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.modalCallBtn}
                      onPress={() => handleCall(selectedBusinessForInfo.mobileNumber)}
                      activeOpacity={0.8}
                    >
                      <Phone size={15} color="#ffffff" />
                      <Text style={styles.callBtnText}>Call Owner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalWhatsAppBtn}
                      onPress={() =>
                        handleWhatsApp(
                          selectedBusinessForInfo.mobileNumber,
                          selectedBusinessForInfo.shopName
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={15} color="#ffffff" />
                      <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setSelectedBusinessForInfo(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDismissBtnText}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  mainSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  radiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    padding: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: {
    backgroundColor: '#007a33',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
    marginBottom: 12,
  },
  cardTablet: {
    flex: 1,
    marginHorizontal: 6,
  },
  cardFraud: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#007a33',
  },
  cardShopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#007a33',
  },
  cardOwnerName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  fraudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fraudPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#dc2626',
  },
  distanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  insideRadiusPill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  insideRadiusGreen: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  outsideRadiusAmber: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  detailsBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailValIncome: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionsContainer: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00875a',
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 12,
  },
  whatsAppBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007a33',
  },
  moreInfoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moreInfoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyCardDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalScroll: {
    gap: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  modalShopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  modalAvatarInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: '#003893',
  },
  modalShopTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalOwnerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  modalFraudBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  modalFraudTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#dc2626',
  },
  modalFraudDesc: {
    fontSize: 11,
    color: '#b91c1c',
    marginTop: 2,
    lineHeight: 16,
  },
  modalLocCard: {
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  modalLocTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalLocCity: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
  },
  modalLocDistance: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalLocAddress: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  modalSection: {
    gap: 8,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalGridItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalGridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  modalGridVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00875a',
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalDismissBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  modalDismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
});
