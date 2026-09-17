import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Linking,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Building2,
  Phone,
  MessageSquare,
  Search,
  Sparkles,
  MapPin,
  CheckCircle2,
  Percent,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  ChevronRight,
  Lock,
  Gift,
  Store,
  FileText,
  AlertCircle,
  Users,
  Headphones,
  User,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchLenders, unlockLenderContact, fetchReferEarnStatusApi } from '../../services/api';
import { Lender } from '../../types';
import { ConsentModal } from '../../components/ConsentModal';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { LoanRequestModal } from '../../components/LoanRequestModal';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';
import { BannerCarousel, BannerSlide } from '../../components/BannerCarousel';

const CATEGORIES = [
  'All',
  'Daily Finance',
  'Business Loan',
  'MSME Loan',
  'Machinery Loan',
  'Emergency Cash',
];

const VENDOR_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'vb-1',
    image: require('../../../assets/banners/vendor_banner_1.png'),
    title: 'Instant Working Capital for Small Shops & Startups',
    badge: '⚡ Direct Financers',
  },
  {
    id: 'vb-2',
    image: require('../../../assets/banners/vendor_banner_2.png'),
    title: 'Zero Collateral Daily Business Financing Nearby',
    badge: '✓ 100% Verified Financers',
  },
  {
    id: 'vb-3',
    image: require('../../../assets/banners/vendor_banner_3.png'),
    title: 'Grow Your Shop Inventory with Fast Local Financing',
    badge: '🏪 Small Shop Support',
  },
  {
    id: 'vb-4',
    image: require('../../../assets/banners/vendor_banner_4.png'),
    title: 'Direct Financer Contact • 0% Broker Commission',
    badge: '⭐ Transparent Capital',
  },
];

export const VendorHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, isSubscribed } = useAuth();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Location & Radius Filter State
  const [radiusKm, setRadiusKm] = useState(50);
  const [selectedCity, setSelectedCity] = useState(user?.vendorProfile?.city || 'Hyderabad');
  const [userCoords, setUserCoords] = useState<{ lat?: number; lng?: number }>({
    lat: user?.vendorProfile?.latitude,
    lng: user?.vendorProfile?.longitude,
  });

  // Refer & Earn (admin-gated)
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);

  // Modals
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [selectedLenderForLoan, setSelectedLenderForLoan] = useState<Lender | null>(null);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [selectedLenderForContact, setSelectedLenderForContact] = useState<any>(null);
  const [contactAction, setContactAction] = useState<'CALL' | 'WHATSAPP'>('CALL');
  const [subModalVisible, setSubModalVisible] = useState(false);

  useEffect(() => {
    loadLenders();
  }, [radiusKm, selectedCity, selectedCategory]);

  const loadLenders = async () => {
    setLoading(true);
    fetchReferEarnStatusApi()
      .then((enabled) => setIsReferEarnEnabled(enabled))
      .catch(() => {});
    try {
      const res = await fetchLenders({
        city: selectedCity || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        query: searchQuery || undefined,
        radiusKm,
        userLat: userCoords.lat,
        userLng: userCoords.lng,
      });

      if (res.lenders && Array.isArray(res.lenders)) {
        setLenders(res.lenders);
      } else {
        setLenders([]);
      }
    } catch (e) {
      console.warn('Error loading lenders:', e);
      setLenders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplyLocation = (newRadius: number, newCity?: string, lat?: number, lng?: number) => {
    setRadiusKm(newRadius);
    if (newCity !== undefined) setSelectedCity(newCity);
    if (lat && lng) setUserCoords({ lat, lng });
  };

  const handleOpenLoanRequest = (lender: Lender) => {
    setSelectedLenderForLoan(lender);
    setLoanModalVisible(true);
  };

  const handleContactAction = async (lender: Lender, type: 'CALL' | 'WHATSAPP') => {
    if (!isSubscribed && !lender.contactUnlocked) {
      const unlockRes = await unlockLenderContact(lender.id);
      if (unlockRes.success && unlockRes.phone) {
        lender.phone = unlockRes.phone;
        lender.contactUnlocked = true;
      } else {
        Alert.alert(
          'Unlock Financer Contacts 🔒',
          'Unlock direct phone and WhatsApp contact with all verified financers with a membership plan.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'View Plans', onPress: () => setSubModalVisible(true) },
          ]
        );
        return;
      }
    }

    setSelectedLenderForContact({
      id: lender.id,
      institutionName: lender.institutionName,
      phone: lender.phone || '9553921237',
    });
    setContactAction(type);
    setConsentModalVisible(true);
  };

  const filteredLenders = lenders.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.institutionName.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      (l.loanCategories && l.loanCategories.some((c) => c.toLowerCase().includes(q)))
    );
  });

  const vendorName = user?.name || user?.fullName || 'Shop Owner';
  const vendorInitial = vendorName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLenders}
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
              loadLenders();
            }}
            colors={['#003893']}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Top Auto-Scrolling Visual Banner Carousel */}
            <BannerCarousel slides={VENDOR_BANNER_SLIDES} autoScrollIntervalMs={4000} />

            {/* Fraud Notice Banner */}
            {(user as any)?.isFraud && (
              <View style={styles.fraudBanner}>
                <AlertCircle size={20} color="#e11d48" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fraudTitle}>🚨 ACCOUNT UNDER VERIFICATION REVIEW</Text>
                  <Text style={styles.fraudDesc}>
                    Your account has restricted loan application privileges. Please contact support.
                  </Text>
                </View>
              </View>
            )}

            {/* Top 3 Hero Cards (Mirrors Website VendorDashboard) */}
            <View style={[styles.heroCardsContainer, isTablet && styles.heroCardsTablet]}>
              {/* Card 1: Welcome Royal Blue Card */}
              <View style={[styles.welcomeHeroCard, isTablet && styles.heroCardTabletItem]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeSub}>Welcome back,</Text>
                  <Text style={styles.welcomeName} numberOfLines={1}>
                    {vendorName}
                  </Text>
                  <View style={styles.verifiedBadgeRow}>
                    <CheckCircle2 size={13} color="#34d399" />
                    <Text style={styles.verifiedBadgeText}>Verified Shop Owner</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.avatarInitial}>{vendorInitial}</Text>
                </TouchableOpacity>
              </View>

              {/* Card 2: Find & Connect with Nearby Commercial Partners */}
              <View style={[styles.nearbyPartnersCard, isTablet && styles.heroCardTabletItem]}>
                <View style={styles.partnersPillRow}>
                  <View style={styles.pulsePill}>
                    <Text style={styles.pulsePillText}>⚡ Nearby Business Partners</Text>
                  </View>
                  <View style={styles.radiusPill}>
                    <Text style={styles.radiusPillText}>10 KM Radius</Text>
                  </View>
                </View>
                <Text style={styles.partnersTitle}>
                  Find Nearby Commercial Partners
                </Text>
                <Text style={styles.partnersDesc}>
                  Discover verified commercial vendors & money financers within 10 KM for direct collaboration.
                </Text>
                <TouchableOpacity
                  style={styles.searchPartnersBtn}
                  onPress={() => navigation.navigate('Financers')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.searchPartnersBtnText}>Search Nearby Partners →</Text>
                </TouchableOpacity>
              </View>

              {/* Card 3: Membership Status Card */}
              <View style={[styles.membershipCard, isTablet && styles.heroCardTabletItem]}>
                <View style={styles.membershipTop}>
                  <View style={styles.membershipBadge}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.membershipBadgeText}>
                      {isSubscribed ? 'Plan Active' : 'Marketplace'}
                    </Text>
                  </View>
                  <Headphones size={20} color="#b45309" />
                </View>
                <Text style={styles.membershipTitle}>Small Shop & Startup Membership</Text>
                <Text style={styles.membershipDesc}>
                  Direct commercial business directory access & verified partner networking.
                </Text>
                <TouchableOpacity
                  style={styles.membershipBtn}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.membershipBtnText}>
                    {isSubscribed ? 'Manage Subscription' : 'View Membership Plans'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions Bar (Mirrors Website) */}
            <View style={styles.quickActionsContainer}>
              <View style={styles.quickActionsHeader}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                <Text style={styles.quickActionsSub}>Shortcuts</Text>
              </View>

              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: '#eff6ff' }]}>
                    <User size={22} color="#003893" />
                  </View>
                  <Text style={styles.quickActionLabel}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Requests')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: '#eff6ff' }]}>
                    <FileText size={22} color="#003893" />
                  </View>
                  <Text style={styles.quickActionLabel}>Inquiries</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionCard, { borderColor: '#10b981', borderWidth: 1.5 }]}
                  onPress={() => navigation.navigate('Financers')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: '#059669' }]}>
                    <Users size={22} color="#ffffff" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: '#047857', fontWeight: '800' }]}>
                    Nearby ⚡
                  </Text>
                </TouchableOpacity>

                {isReferEarnEnabled && (
                  <TouchableOpacity
                    style={[styles.quickActionCard, { borderColor: '#a855f7', borderWidth: 1.5 }]}
                    onPress={() => setReferModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quickIconBox, { backgroundColor: '#9333ea' }]}>
                      <Gift size={22} color="#ffffff" />
                    </View>
                    <Text style={[styles.quickActionLabel, { color: '#7e22ce', fontWeight: '800' }]}>
                      Refer & Earn 🎁
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: '#fffbeb' }]}>
                    <Headphones size={22} color="#d97706" />
                  </View>
                  <Text style={styles.quickActionLabel}>Plans & Help</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Radius Bar */}
            <View style={styles.locationBar}>
              <TouchableOpacity
                style={styles.locationPill}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.8}
              >
                <Compass size={16} color="#003893" />
                <Text style={styles.locationText} numberOfLines={1}>
                  📍 {selectedCity || 'All Locations'} • Within {radiusKm} km
                </Text>
                <View style={styles.changeBadge}>
                  <Text style={styles.changeBadgeText}>Change</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Input Box */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search financers by name, area, loan type..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Category Filter Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Section Heading */}
            <View style={styles.resultsRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.resultsTitle}>
                  Recommended Financers ({filteredLenders.length})
                </Text>
                <View style={styles.nearbyBadge}>
                  <Text style={styles.nearbyBadgeText}>⚡ Nearby</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Financers')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllLink}>View All →</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Users size={32} color="#059669" />
            </View>
            <Text style={styles.emptyCardTitle}>
              No Commercial Partners Located within Service Radius
            </Text>
            <Text style={styles.emptyCardDesc}>
              No active business partners found within their service radius of {selectedCity}. Expand your location search or explore all business listings.
            </Text>
            <TouchableOpacity
              style={styles.emptyExploreBtn}
              onPress={() => {
                setRadiusKm(100);
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyExploreBtnText}>
                Explore All Business Partners
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.lenderCard}>
            {/* Header: Financer Name, Type, Rating & Distance */}
            <View style={styles.cardTop}>
              <View style={styles.instIcon}>
                <Building2 size={24} color="#003893" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.instName}>{item.institutionName}</Text>
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.instType}>
                  {item.institutionType} • {item.registrationNumber || 'Registered'}
                </Text>
              </View>
            </View>

            {/* Rating & Distance Badges */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <MapPin size={13} color="#e11d48" />
                <Text style={styles.metaBadgeText}>
                  {item.distanceKm ? `${item.distanceKm} km away` : item.city}
                </Text>
              </View>
              <View style={styles.metaBadge}>
                <Sparkles size={13} color="#f59e0b" />
                <Text style={styles.metaBadgeText}>★ {item.rating || '4.8'}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: '#ecfdf5' }]}>
                <Percent size={13} color="#10b981" />
                <Text style={[styles.metaBadgeText, { color: '#047857' }]}>
                  {item.successRate || '85% Approval'}
                </Text>
              </View>
            </View>

            {/* Loan Limits & Rate Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Min - Max Loan</Text>
                <Text style={styles.detailValue}>
                  ₹{(item.minLoanAmount || 10000).toLocaleString('en-IN')} - ₹
                  {(item.maxLoanAmount || 500000).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Interest Rate</Text>
                <Text style={styles.detailValue}>From {item.minInterestRate || '1.2'}% / mo</Text>
              </View>
            </View>

            {/* Loan Categories Pills */}
            <View style={styles.tagsRow}>
              {item.loanCategories.map((cat, i) => (
                <View key={i} style={styles.tagPill}>
                  <Text style={styles.tagText}>{cat}</Text>
                </View>
              ))}
            </View>

            {/* Card Action Buttons: Call, WhatsApp, Inquire / Apply */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleContactAction(item, 'CALL')}
                activeOpacity={0.8}
              >
                <Phone size={15} color="#003893" />
                <Text style={styles.callBtnText}>Call Financer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => handleOpenLoanRequest(item)}
                activeOpacity={0.85}
              >
                <FileText size={15} color="#ffffff" />
                <Text style={styles.applyBtnText}>Inquire / Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.statutoryFooter}>
            <ShieldCheck size={16} color="#64748b" />
            <Text style={styles.statutoryText}>
              JustPaisa is a B2B discovery and directory network connecting verified small commercial businesses directly with independent capital financers. We do not act as a lender or broker.
            </Text>
          </View>
        }
      />

      {/* Modals */}
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        currentRadius={radiusKm}
        currentCity={selectedCity}
        onApply={handleApplyLocation}
      />

      <LoanRequestModal
        visible={loanModalVisible}
        onClose={() => setLoanModalVisible(false)}
        lender={selectedLenderForLoan}
      />

      <ConsentModal
        visible={consentModalVisible}
        onClose={() => setConsentModalVisible(false)}
        lender={selectedLenderForContact}
        actionType={contactAction}
      />

      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
      />

      <ReferAndEarnModal
        visible={referModalVisible}
        onClose={() => setReferModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  welcomeHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#003893',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeSub: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  welcomeName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 2,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  verifiedBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00225b',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  fraudBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#fda4af',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  fraudTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#e11d48',
  },
  fraudDesc: {
    fontSize: 11,
    color: '#9f1239',
    marginTop: 2,
    lineHeight: 15,
  },
  nearbyPartnersCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  partnersPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  pulsePill: {
    backgroundColor: '#003893',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  pulsePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  radiusPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  radiusPillText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
  },
  partnersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  partnersDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  searchPartnersBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  searchPartnersBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  membershipCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
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
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  membershipBadgeText: {
    color: '#92400e',
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
    color: '#78350f',
    marginTop: 2,
    lineHeight: 16,
  },
  membershipBtn: {
    backgroundColor: '#d97706',
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
  quickActionsContainer: {
    marginBottom: 14,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  quickActionsSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 64,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  nearbyBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nearbyBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  viewAllLink: {
    color: '#003893',
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
    backgroundColor: '#003893',
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
  locationBar: {
    marginBottom: 10,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#003893',
  },
  changeBadge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  changeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003893',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  categoriesScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  categoryChipActive: {
    backgroundColor: '#003893',
    borderColor: '#003893',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderWidth: 1.5,
    borderColor: '#ddd6fe',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  referIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5b21b6',
  },
  referBadge: {
    backgroundColor: '#ede9fe',
    fontSize: 9,
    fontWeight: '900',
    color: '#6d28d9',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  referSub: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultsRadius: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  lenderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  instIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  instName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
  },
  instType: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  detailBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#eff6ff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#003893',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  statutoryFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  statutoryText: {
    flex: 1,
    fontSize: 10,
    color: '#64748b',
    lineHeight: 15,
  },
});
