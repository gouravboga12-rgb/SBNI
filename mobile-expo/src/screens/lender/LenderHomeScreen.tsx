import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Store,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Compass,
  Eye,
  Gift,
  ArrowRight,
  TrendingUp,
  Crown,
  Headphones,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import {
  fetchLenderLeadsApi,
  updateLeadStatusApi,
  updateLenderProfileApi,
  fetchReferEarnStatusApi,
} from '../../services/api';
import { VendorLead } from '../../types';
import { VendorReviewModal } from '../../components/VendorReviewModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { LenderLocationPromptModal } from '../../components/LenderLocationPromptModal';
import { BannerCarousel, BannerSlide } from '../../components/BannerCarousel';

const LENDER_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'lb-1',
    image: require('../../../assets/banners/lender_banner_1.png'),
    title: 'Direct Business Marketplace for Commercial Partners',
    badge: '⚡ Verified Businesses',
  },
  {
    id: 'lb-2',
    image: require('../../../assets/banners/lender_banner_2.png'),
    title: '100% Pre-Verified KYC Small Business Directory',
    badge: '✓ Zero Bad Debts',
  },
  {
    id: 'lb-3',
    image: require('../../../assets/banners/lender_banner_3.png'),
    title: 'Expand Your Financing Portfolio in Your Radius',
    badge: '📍 Radius Matching',
  },
  {
    id: 'lb-4',
    image: require('../../../assets/banners/lender_banner_4.png'),
    title: 'Transparent Capital Network • 0% Broker Commission',
    badge: '⭐ Direct Contact',
  },
];

const RADIUS_OPTIONS = [10, 25, 50, 70, 100];

export const LenderHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, isSubscribed, daysRemaining, formattedEndDate, lenderProfile, updateLenderProfileState } = useAuth();
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRadius, setActiveRadius] = useState<number>(
    lenderProfile?.lendingRadiusKm || 50
  );
  const [updatingRadius, setUpdatingRadius] = useState(false);
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorLead | null>(null);

  // Refer & Earn conditionally shown only if enabled by admin
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [locationPromptVisible, setLocationPromptVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Auto-prompt office location on login (matches website sessionStorage behavior)
    const checkLocationPrompt = async () => {
      try {
        const prompted = await AsyncStorage.getItem('sbni_lender_loc_prompted');
        if (!prompted) {
          // Short delay so screen loads first
          setTimeout(() => {
            setLocationPromptVisible(true);
          }, 600);
        }
      } catch (e) {
        console.warn('Error reading location prompt status:', e);
      }
    };
    checkLocationPrompt();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Check admin refer & earn setting
      fetchReferEarnStatusApi()
        .then((enabled) => setIsReferEarnEnabled(enabled))
        .catch(() => {});

      const data = await fetchLenderLeadsApi();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
      }
    } catch (e) {
      console.warn('Error loading lender dashboard:', e);
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateRadius = async (km: number) => {
    setActiveRadius(km);
    setUpdatingRadius(true);
    try {
      const res = await updateLenderProfileApi({ lendingRadiusKm: km });
      if (res.success) {
        updateLenderProfileState({ lendingRadiusKm: km });
        Alert.alert(
          'Service Radius Updated! 📍',
          `Your active service radius is now ${km} km. All registered local shops and startups within ${km} km can discover your business profile.`
        );
      }
    } catch (e) {
      Alert.alert('Notice', 'Could not update service radius.');
    } finally {
      setUpdatingRadius(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    // 1. Immediately update local state so button response is instant
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedVendorForReview?.id === leadId) {
      setSelectedVendorForReview((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // 2. Persist to AWS RDS backend
    await updateLeadStatusApi(leadId, newStatus);
    Alert.alert('Status Updated', `Enquiry marked as ${newStatus}.`);
  };

  const totalEnquiries = leads.length;
  const pendingCount = leads.filter((l) => (l.status || '').toLowerCase().includes('pend')).length;
  const acceptedCount = leads.filter((l) => (l.status || '').toLowerCase().includes('accept') || l.status === 'Verified').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 90 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboardData();
          }}
          colors={['#007a33']}
        />
      }
    >
      {/* Top Auto-Scrolling Visual Banner Carousel */}
      <BannerCarousel slides={LENDER_BANNER_SLIDES} autoScrollIntervalMs={4000} />

      {/* Hero Cards Container (Mirrors Website LenderDashboard) */}
      <View style={[styles.heroCardsContainer, isTablet && styles.heroCardsTablet]}>
        {/* Commercial Partner Welcome Header */}
        <View style={[styles.headerCard, isTablet && styles.heroCardTabletItem]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.institutionTitle} numberOfLines={1}>
              {lenderProfile?.institutionName?.replace(/money financer/gi, 'Commercial Partner') || user?.name || 'Commercial Partner'}
            </Text>
            <TouchableOpacity
              onPress={() => setLocationPromptVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}
            >
              <Compass size={13} color="#007a33" />
              <Text style={styles.institutionSub}>
                {lenderProfile?.city || 'Hyderabad'} • {activeRadius} KM Radius (Tap to Change)
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activeStatusBadge}>
            <Text style={styles.activeStatusText}>Active Partner</Text>
          </View>
        </View>

        {/* Membership Status Card */}
        <View style={[styles.membershipCard, isTablet && styles.heroCardTabletItem]}>
          <View style={styles.membershipTop}>
            <View style={styles.membershipBadge}>
              <Crown size={12} color={isSubscribed ? '#16a34a' : '#d97706'} />
              <Text style={styles.membershipBadgeText}>
                {isSubscribed ? `VIP Partner Active (${daysRemaining} Days)` : 'Standard Account'}
              </Text>
            </View>
            <Headphones size={20} color="#007a33" />
          </View>
          <Text style={styles.membershipTitle}>
            {isSubscribed ? `VIP Partner (${daysRemaining} Days Remaining)` : 'Partner Network Membership'}
          </Text>
          <Text style={styles.membershipDesc}>
            {isSubscribed
              ? `Valid until ${formattedEndDate || 'Active'}. Full unlimited verified shop leads and direct applicant contacts.`
              : 'Upgrade to VIP for unlimited leads across your full service radius.'}
          </Text>
          <TouchableOpacity
            style={styles.membershipBtn}
            onPress={() => setSubModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.membershipBtnText}>
              {isSubscribed ? 'Extend Validity / Upgrade' : 'Upgrade to VIP Partner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Stats Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{totalEnquiries}</Text>
          <Text style={styles.kpiLabel}>Total Enquiries</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#fef08a' }]}>
          <Text style={[styles.kpiNum, { color: '#ca8a04' }]}>{pendingCount}</Text>
          <Text style={styles.kpiLabel}>Pending Review</Text>
        </View>
        <View style={[styles.kpiCard, { borderColor: '#bbf7d0' }]}>
          <Text style={[styles.kpiNum, { color: '#16a34a' }]}>{acceptedCount}</Text>
          <Text style={styles.kpiLabel}>Approved</Text>
        </View>
      </View>

      {/* Conditional Refer & Earn Banner (Only if enabled by admin on admin panel) */}
      {isReferEarnEnabled && (
        <TouchableOpacity
          style={styles.referCard}
          activeOpacity={0.85}
          onPress={() => setReferModalVisible(true)}
        >
          <View style={styles.referIconBox}>
            <Gift size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.referTitle}>Refer & Earn Rewards 🎁</Text>
              <Text style={styles.referBadge}>Cashback</Text>
            </View>
            <Text style={styles.referSub}>
              Earn instant cashback for every business or partner you invite!
            </Text>
          </View>
          <ArrowRight size={18} color="#9333ea" />
        </TouchableOpacity>
      )}

      {/* Core Requirement: Active Service Radius Area Selector */}
      <View style={styles.radiusSection}>
        <View style={styles.radiusHeader}>
          <View style={styles.radiusTitleRow}>
            <Compass size={18} color="#007a33" />
            <Text style={styles.radiusSectionTitle}>Active Service Radius Area</Text>
          </View>
          <Text style={styles.radiusCurrentValue}>{activeRadius} km</Text>
        </View>
        <Text style={styles.radiusSectionDesc}>
          Select your active service distance. Businesses within this radius will be notified of your presence and can submit commercial inquiries.
        </Text>
        <View style={styles.radiusPillsRow}>
          {RADIUS_OPTIONS.map((km) => {
            const active = activeRadius === km;
            return (
              <TouchableOpacity
                key={km}
                style={[styles.radiusChip, active && styles.radiusChipActive]}
                onPress={() => handleUpdateRadius(km)}
                disabled={updatingRadius}
              >
                <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Recent Shop Applications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Inbound Shop Enquiries</Text>
        <Text style={styles.sectionCount}>({leads.length})</Text>
      </View>

      {leads.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Store size={32} color="#007a33" />
          </View>
          <Text style={styles.emptyCardTitle}>No Inbound Enquiries Yet</Text>
          <Text style={styles.emptyCardDesc}>
            You haven't received any commercial inquiries yet. Explore Discovered Businesses to review nearby shops within your {activeRadius} km service radius.
          </Text>
          <TouchableOpacity
            style={styles.emptyExploreBtn}
            onPress={() => navigation.navigate('Businesses')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyExploreBtnText}>Browse Discovered Businesses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        leads.map((item) => {
        const isPending = item.status.toLowerCase().includes('pend');
        const isAccepted = item.status.toLowerCase().includes('accept') || item.status === 'Verified';

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.leadCard}
            activeOpacity={0.9}
            onPress={() => setSelectedVendorForReview(item)}
          >
            <View style={styles.leadTop}>
              <View style={styles.shopIcon}>
                <Store size={22} color="#007a33" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <Text style={styles.vendorName}>
                  {item.vendorName} • {item.city}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isAccepted && styles.statusBadgeAccepted,
                  isPending && styles.statusBadgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isAccepted && { color: '#16a34a' },
                    isPending && { color: '#d97706' },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            {/* Purpose & Amount */}
            <View style={styles.leadDetailsBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leadDetailLabel}>Requested Capital</Text>
                <Text style={styles.leadAmount}>
                  ₹{Number(item.requiredAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.leadDetailLabel}>Business Purpose</Text>
                <Text style={styles.leadPurpose} numberOfLines={2}>
                  {item.inquiryMessage || 'Working Capital & Inventory'}
                </Text>
              </View>
            </View>

            {/* Inspect KYC Action */}
            <TouchableOpacity
              style={styles.inspectQuickBtn}
              onPress={() => setSelectedVendorForReview(item)}
            >
              <Eye size={13} color="#003893" />
              <Text style={styles.inspectQuickBtnText}>Open Shop Profile & Inspect KYC Details</Text>
            </TouchableOpacity>

            {/* Actions: Approve / Reject / Call / WhatsApp */}
            <View style={styles.leadActions}>
              {isPending && (
                <>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleUpdateStatus(item.id, 'Accepted')}
                  >
                    <CheckCircle size={14} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleUpdateStatus(item.id, 'Rejected')}
                  >
                    <XCircle size={14} color="#dc2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.mobileNumber && (
                <>
                  <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => Linking.openURL(`tel:${item.mobileNumber}`)}
                  >
                    <Phone size={16} color="#007a33" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => {
                      const clean = item.mobileNumber.replace(/\D/g, '');
                      const cleanPhone = clean.length === 10 ? `91${clean}` : clean;
                      Linking.openURL(
                        `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
                          item.shopName
                        )},%20regarding%20your%20business%20enquiry%20on%20JustPaisa...`
                      );
                    }}
                  >
                    <MessageSquare size={16} color="#16a34a" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        );
      }))}

      {/* Vendor Review & KYC Modal */}
      <VendorReviewModal
        visible={!!selectedVendorForReview}
        onClose={() => setSelectedVendorForReview(null)}
        vendor={selectedVendorForReview}
        onStatusChange={(id, newStatus) => {
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
          );
        }}
        onDeleteRequest={(id) => {
          setLeads((prev) => prev.filter((l) => l.id !== id));
        }}
      />

      {/* Refer & Earn Modal */}
      <ReferAndEarnModal
        visible={referModalVisible}
        onClose={() => setReferModalVisible(false)}
        userRole="LENDER"
        userName={lenderProfile?.institutionName?.replace(/money financer/gi, 'Commercial Partner') || user?.name || 'Commercial Partner'}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
      />

      {/* Lender Location Prompt Modal */}
      <LenderLocationPromptModal
        visible={locationPromptVisible}
        onClose={async () => {
          try {
            await AsyncStorage.setItem('sbni_lender_loc_prompted', 'true');
          } catch (e) {}
          setLocationPromptVisible(false);
        }}
        currentLocation={{
          city: lenderProfile?.city || 'Hyderabad',
          state: (lenderProfile as any)?.state || 'Telangana',
          latitude: lenderProfile?.latitude,
          longitude: lenderProfile?.longitude,
          lendingRadiusKm: activeRadius,
        }}
        onSaveLocation={async (loc) => {
          try {
            await AsyncStorage.setItem('sbni_lender_loc_prompted', 'true');
            await updateLenderProfileApi({
              city: loc.city,
              latitude: loc.latitude,
              longitude: loc.longitude,
              lendingRadiusKm: loc.lendingRadiusKm || activeRadius,
            });
            updateLenderProfileState({
              city: loc.city,
              latitude: loc.latitude,
              longitude: loc.longitude,
              lendingRadiusKm: loc.lendingRadiusKm || activeRadius,
            });
            setLocationPromptVisible(false);
            Alert.alert('Office Location Updated! 📍', `Your business office location has been set to ${loc.city}.`);
          } catch (err) {
            console.warn('Error saving location:', err);
          }
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  heroCardsContainer: {
    marginBottom: 6,
  },
  heroCardsTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroCardTabletItem: {
    width: '48%',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  membershipCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  membershipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  membershipBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
  },
  membershipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  membershipDesc: {
    fontSize: 11,
    color: '#065f46',
    marginTop: 2,
    lineHeight: 16,
  },
  membershipBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  membershipBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
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
  emptyExploreBtn: {
    backgroundColor: '#007a33',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 14,
  },
  emptyExploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  institutionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  institutionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activeStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#d8b4fe',
    gap: 12,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  referIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#581c87',
  },
  referBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7e22ce',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  referSub: {
    fontSize: 11,
    color: '#7e22ce',
    marginTop: 2,
  },
  radiusSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  radiusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  radiusCurrentValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#007a33',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radiusSectionDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  radiusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  radiusChipActive: {
    borderColor: '#007a33',
    backgroundColor: '#007a33',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  radiusChipTextActive: {
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  vendorName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  statusBadgeAccepted: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  leadDetailsBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  leadDetailLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  leadAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#007a33',
  },
  leadPurpose: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  inspectQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 10,
  },
  inspectQuickBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
  },
  leadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#007a33',
    paddingVertical: 9,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 9,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
