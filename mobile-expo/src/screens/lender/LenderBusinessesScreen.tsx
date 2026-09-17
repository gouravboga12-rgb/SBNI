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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { fetchVendorProfilesForLenderApi } from '../../services/api';
import { DiscoveredBusiness, VendorLead } from '../../types';
import { VendorReviewModal } from '../../components/VendorReviewModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LenderBusinessesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { lenderProfile } = useAuth();
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorLead | null>(null);

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
            mobileNumber: vp.phone || u.phone || 'Not provided',
            emailId: vp.email || u.email || 'vendor@example.com',
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
    if (phone && phone !== 'Not provided') {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    } else {
      Alert.alert('Notice', 'Mobile number not provided.');
    }
  };

  const handleWhatsApp = (phone?: string, shopName?: string) => {
    if (phone && phone !== 'Not provided') {
      const cleanPhone = phone.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `Hello! I saw your business "${shopName || 'Shop'}" on JustPaisa and would like to discuss business financing options.`
      );
      Linking.openURL(`https://wa.me/91${cleanPhone}?text=${msg}`).catch(() => {});
    } else {
      Alert.alert('Notice', 'WhatsApp number not provided.');
    }
  };

  const openVendorReview = (biz: DiscoveredBusiness) => {
    const leadObj: VendorLead = {
      id: biz.id,
      vendorName: biz.vendorName,
      shopName: biz.shopName,
      shopAddress: biz.shopAddress,
      city: biz.city,
      state: biz.state,
      requestedDate: new Date().toLocaleDateString('en-IN'),
      status: 'Verified',
      mobileNumber: biz.mobileNumber || 'Not provided',
      emailId: biz.emailId,
      panNumber: biz.panNumber,
      aadhaarNumber: biz.aadhaarNumber,
      gstNumber: biz.gstNumber,
      annualIncome: biz.annualTurnover,
      annualTurnover: biz.annualTurnover,
      shopType: biz.category,
      isFraud: biz.isFraud,
      avatarUrl: biz.avatarUrl || undefined,
      panFileUrl: biz.panFileUrl,
      aadhaarFileUrl: biz.aadhaarFileUrl,
      shopLicensePdf: biz.shopLicensePdf,
      gstCertificatePdf: biz.gstCertificatePdf,
      latitude: biz.latitude,
      longitude: biz.longitude,
    };
    setSelectedVendorForReview(leadObj);
  };

  const filteredBusinesses = businesses.filter((b) => {
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
        </View>
      </View>

      {/* Businesses List */}
      <FlatList
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
              Currently there are no registered small shops or startups discovered within {activeRadiusKm} km of your office location. Try increasing your lending radius in the Profile tab.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isFraud = !!item.isFraud;

          return (
            <View style={[styles.card, isFraud && styles.cardFraud]}>
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarBox}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
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
                    <CheckCircle2 size={10} color="#16a34a" />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                )}
              </View>

              {/* Distance Pill */}
              <View style={styles.distanceBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                  <MapPin size={12} color="#dc2626" />
                  <Text style={styles.distanceText} numberOfLines={1}>
                    {item.distanceKm || 5} KM away • {item.place || item.city}
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
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailVal}>{item.category || 'Retail Shop'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Annual Turnover:</Text>
                  <Text style={[styles.detailVal, { color: '#007a33', fontWeight: '800' }]}>
                    {item.annualTurnover || 'Under 2 Lakhs'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(item.mobileNumber)}
                >
                  <Phone size={14} color="#ffffff" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsAppBtn}
                  onPress={() => handleWhatsApp(item.mobileNumber, item.shopName)}
                >
                  <MessageSquare size={14} color="#ffffff" />
                  <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moreInfoBtn}
                  onPress={() => openVendorReview(item)}
                >
                  <Info size={14} color="#003893" />
                  <Text style={styles.moreInfoBtnText}>Inspect KYC</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Vendor Review & KYC Modal */}
      <VendorReviewModal
        visible={!!selectedVendorForReview}
        onClose={() => setSelectedVendorForReview(null)}
        vendor={selectedVendorForReview}
      />
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
  listContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 30,
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
    gap: 10,
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
    width: 44,
    height: 44,
    borderRadius: 14,
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
    color: '#0f172a',
  },
  cardOwnerName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    paddingTop: 8,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  whatsAppBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 10,
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  moreInfoBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moreInfoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
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
  emptyBox: {
    alignItems: 'center',
    padding: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
