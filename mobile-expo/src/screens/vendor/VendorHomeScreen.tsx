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
  Crown,
  Coins,
  TrendingUp,
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
import { resolveDocumentUrl } from '../../utils/documentGenerators';

const CATEGORIES = [
  'All',
  'Commercial Supply',
  'Working Capital',
  'MSME Support',
  'Equipment & Inventory',
  'Trade Partner',
];

const VENDOR_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'vb-1',
    image: require('../../../assets/banners/vendor_banner_1.png'),
    title: 'Instant Commercial Partners for Small Shops & Startups',
    badge: '⚡ Direct Partners',
  },
  {
    id: 'vb-2',
    image: require('../../../assets/banners/vendor_banner_2.png'),
    title: 'Zero Brokerage Direct B2B Business Network Nearby',
    badge: '✓ 100% Verified Partners',
  },
  {
    id: 'vb-3',
    image: require('../../../assets/banners/vendor_banner_3.png'),
    title: 'Grow Your Shop Inventory with Local Commercial Partners',
    badge: '🏪 Small Shop Support',
  },
  {
    id: 'vb-4',
    image: require('../../../assets/banners/vendor_banner_4.png'),
    title: 'Direct Partner Contact • 0% Broker Commission',
    badge: '⭐ Transparent Network',
  },
];

export const VendorHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { user, isSubscribed, daysRemaining, formattedEndDate } = useAuth();
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
    if (!isSubscribed) {
      setSubModalVisible(true);
      return;
    }
    setSelectedLenderForLoan(lender);
    setLoanModalVisible(true);
  };

  const handleContactAction = async (lender: Lender, type: 'CALL' | 'WHATSAPP') => {
    if (!isSubscribed) {
      setSubModalVisible(true);
      return;
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
    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      const hasCategory =
        l.loanCategories &&
        l.loanCategories.some(
          (c) => c.toLowerCase().includes(catLower) || catLower.includes(c.toLowerCase())
        );
      const hasType = l.institutionType && l.institutionType.toLowerCase().includes(catLower);
      if (!hasCategory && !hasType) {
        return false;
      }
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = l.institutionName.toLowerCase().includes(q);
      const matchesCity = l.city.toLowerCase().includes(q);
      const matchesType = l.institutionType && l.institutionType.toLowerCase().includes(q);
      const matchesCat =
        l.loanCategories &&
        l.loanCategories.some((c) => c.toLowerCase().includes(q));
      if (!matchesName && !matchesCity && !matchesType && !matchesCat) {
        return false;
      }
    }

    return true;
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
                    Your account has restricted inquiry privileges. Please contact support.
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
                  Discover verified commercial vendors & partners within 10 KM for direct collaboration.
                </Text>
                <TouchableOpacity
                  style={styles.searchPartnersBtn}
                  onPress={() => {
                    if (!isSubscribed) {
                      setSubModalVisible(true);
                    } else {
                      navigation.navigate('Financers');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.searchPartnersBtnText}>Search Nearby Partners →</Text>
                </TouchableOpacity>
              </View>

              {/* Card 3: Membership Status Card */}
              <View style={[styles.membershipCard, isTablet && styles.heroCardTabletItem]}>
                <View style={styles.membershipTop}>
                  <View style={[styles.membershipBadge, isSubscribed && { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                    <CheckCircle2 size={12} color={isSubscribed ? "#059669" : "#16a34a"} />
                    <Text style={[styles.membershipBadgeText, isSubscribed && { color: '#065f46' }]}>
                      {isSubscribed ? `VIP Active (${daysRemaining} Days)` : 'Marketplace'}
                    </Text>
                  </View>
                  <Crown size={20} color={isSubscribed ? "#059669" : "#b45309"} />
                </View>
                <Text style={styles.membershipTitle}>
                  {isSubscribed ? `VIP Membership (${daysRemaining} Days Remaining)` : 'Small Shop & Startup Membership'}
                </Text>
                <Text style={styles.membershipDesc}>
                  {isSubscribed
                    ? `Valid until ${formattedEndDate || 'Active'}. Direct commercial business directory access & 0% broker fees.`
                    : 'Direct commercial business directory access & verified partner networking.'}
                </Text>
                <TouchableOpacity
                  style={styles.membershipBtn}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.membershipBtnText}>
                    {isSubscribed ? 'Extend Validity / Upgrade' : 'View Membership Plans'}
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
                  onPress={() => {
                    if (!isSubscribed) {
                      setSubModalVisible(true);
                    } else {
                      navigation.navigate('Financers');
                    }
                  }}
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
                  placeholder="Search commercial partners by name, area, service type..."
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
                  Recommended Commercial Partners ({filteredLenders.length})
                </Text>
                <View style={styles.nearbyBadge}>
                  <Text style={styles.nearbyBadgeText}>⚡ Nearby</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!isSubscribed) {
                    setSubModalVisible(true);
                  } else {
                    navigation.navigate('Financers');
                  }
                }}
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
                if (!isSubscribed) {
                  setSubModalVisible(true);
                } else {
                  setRadiusKm(100);
                  setSelectedCategory('All');
                  setSearchQuery('');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyExploreBtnText}>
                Explore All Business Partners
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const rawLogo = item.logoUrl || item.avatarUrl;
          const hasCustomLogo = rawLogo && !rawLogo.includes('unsplash.com');
          const cleanInstName = (item.institutionName || 'Commercial Partner').replace(/money financer/gi, 'Commercial Partner');
          const minAmt = (item.minLoanAmount || 5000).toLocaleString('en-IN');
          const maxAmt = (item.maxLoanAmount || 100000).toLocaleString('en-IN');
          const successRateText = item.successRate && item.successRate.toLowerCase().includes('success rate')
            ? item.successRate
            : `${item.successRate || '85% - 95%'} Success Rate on Borrowing Money`;

          return (
            <View style={styles.cleanLenderCard}>
              {/* Top Row: Logo, Name & Verified Partner badge */}
              <View style={styles.cleanCardTop}>
                <View style={styles.cleanLogoBox}>
                  {hasCustomLogo ? (
                    <Image
                      source={{ uri: resolveDocumentUrl(rawLogo) }}
                      style={styles.cleanLogoImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.cleanLogoFallback}>
                      <Text style={styles.cleanLogoFallbackText}>
                        {cleanInstName.charAt(0).toUpperCase() || 'P'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.cleanInstName} numberOfLines={1}>
                    {cleanInstName}
                  </Text>
                  <View style={styles.cleanVerifiedBadge}>
                    <CheckCircle2 size={13} color="#16a34a" />
                    <Text style={styles.cleanVerifiedText}>Verified Partner</Text>
                  </View>
                </View>
              </View>

              {/* Success Rate Pill Banner */}
              <View style={styles.cleanSuccessPill}>
                <TrendingUp size={14} color="#059669" />
                <Text style={styles.cleanSuccessText}>{successRateText}</Text>
              </View>

              {/* Limit Pill Banner */}
              <View style={styles.cleanLimitPill}>
                <Coins size={14} color="#1d4ed8" />
                <Text style={styles.cleanLimitText}>Limit: ₹{minAmt} to ₹{maxAmt}</Text>
              </View>

              {/* Location & Radius Pill Banner */}
              <View style={styles.cleanLocPill}>
                <View style={styles.cleanPulseDot} />
                <MapPin size={13} color="#059669" />
                <Text style={styles.cleanLocText} numberOfLines={2}>
                  {item.distanceKm ? `${item.distanceKm} KM away` : '0.7 KM away'} • Lending Office Location, {item.place ? `${item.place}, ` : ''}{item.city || 'Hyderabad'} (Inside {item.lendingRadiusKm || 100} KM Radius)
                </Text>
              </View>

              {/* Action Buttons */}
              {isSubscribed ? (
                <View style={styles.cleanSubscribedRow}>
                  <TouchableOpacity
                    style={styles.cleanPrimaryInquireBtn}
                    onPress={() => handleOpenLoanRequest(item)}
                    activeOpacity={0.85}
                  >
                    <FileText size={15} color="#ffffff" />
                    <Text style={styles.cleanPrimaryInquireText}>Inquire Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cleanCallBtn}
                    onPress={() => handleContactAction(item, 'CALL')}
                    activeOpacity={0.8}
                  >
                    <Phone size={16} color="#003893" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cleanWhatsAppBtn}
                    onPress={() => handleContactAction(item, 'WHATSAPP')}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.cleanUnsubscribedCol}>
                  <TouchableOpacity
                    style={styles.cleanBigInquireBtn}
                    onPress={() => setSubModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Lock size={15} color="#fde047" />
                    <Text style={styles.cleanBigInquireText}>Inquire Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cleanUnlockLink}
                    onPress={() => setSubModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Zap size={13} color="#d97706" fill="#f59e0b" />
                    <Text style={styles.cleanUnlockLinkText}>Unlock Direct Contact</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.statutoryFooter}>
            <ShieldCheck size={16} color="#64748b" />
            <Text style={styles.statutoryText}>
              JustPaisa is a B2B discovery and directory network connecting verified small commercial businesses directly with independent commercial partners. We do not act as a lender or broker.
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
    overflow: 'hidden',
  },
  instLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
  whatsAppActionBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 12,
  },
  whatsAppActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
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
  unlockContactBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  unlockContactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  lockedApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#002870',
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
  cleanLenderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#003893',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cleanCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cleanLogoBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanLogoImg: {
    width: '100%',
    height: '100%',
  },
  cleanLogoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanLogoFallbackText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#003893',
  },
  cleanInstName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  cleanVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cleanVerifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  cleanSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  cleanSuccessText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  cleanLimitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  cleanLimitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e40af',
  },
  cleanLocPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  cleanPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  cleanLocText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    lineHeight: 15,
  },
  cleanBigInquireBtn: {
    backgroundColor: '#002870',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#002870',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  cleanBigInquireText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  cleanUnlockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 4,
  },
  cleanUnlockLinkText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },
  cleanSubscribedRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cleanPrimaryInquireBtn: {
    flex: 1,
    backgroundColor: '#003893',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cleanPrimaryInquireText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  cleanCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanWhatsAppBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanUnsubscribedCol: {
    marginTop: 2,
  },
});
