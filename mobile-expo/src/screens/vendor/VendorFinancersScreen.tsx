import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Phone,
  MessageSquare,
  Search,
  MapPin,
  CheckCircle2,
  Percent,
  Compass,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchLenders, unlockLenderContact } from '../../services/api';
import { Lender } from '../../types';
import { ConsentModal } from '../../components/ConsentModal';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { LoanRequestModal } from '../../components/LoanRequestModal';
import { LocationPickerModal } from '../../components/LocationPickerModal';

const RADIUS_CHIPS = [10, 25, 50, 70, 100];

export const VendorFinancersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, isSubscribed } = useAuth();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [city, setCity] = useState(user?.vendorProfile?.city || '');

  // Modals
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [selectedLenderForLoan, setSelectedLenderForLoan] = useState<Lender | null>(null);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [selectedLenderForContact, setSelectedLenderForContact] = useState<any>(null);
  const [contactAction, setContactAction] = useState<'CALL' | 'WHATSAPP'>('CALL');
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  useEffect(() => {
    loadLenders();
  }, [radiusKm, city]);

  const loadLenders = async () => {
    setLoading(true);
    try {
      const res = await fetchLenders({
        city: city || undefined,
        query: searchQuery || undefined,
        radiusKm,
      });
      if (res.lenders) {
        setLenders(res.lenders);
      }
    } catch (e) {
      console.warn('Error loading financers directory:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
          'Unlock unlimited phone & WhatsApp contacts with a JustPaisa plan.',
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

  const filtered = lenders.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.institutionName.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.loanCategories.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.headerBox}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by financer name, city, loan type..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.locationFilterBtn}
            onPress={() => setLocationModalVisible(true)}
          >
            <Compass size={20} color="#003893" />
          </TouchableOpacity>
        </View>

        {/* Radius Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radiusScroll}
        >
          <Text style={styles.radiusLabel}>Radius:</Text>
          {RADIUS_CHIPS.map((km) => {
            const active = radiusKm === km;
            return (
              <TouchableOpacity
                key={km}
                style={[styles.radiusPill, active && styles.radiusPillActive]}
                onPress={() => setRadiusKm(km)}
              >
                <Text style={[styles.radiusPillText, active && styles.radiusPillTextActive]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Directory List */}
      <FlatList
        data={filtered}
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
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Building2 size={32} color="#003893" />
            </View>
            <Text style={styles.emptyCardTitle}>No Financers Found</Text>
            <Text style={styles.emptyCardDesc}>
              No active financers found matching your search or radius. Try expanding your radius or changing your search terms.
            </Text>
            <TouchableOpacity
              style={styles.emptyExploreBtn}
              onPress={() => {
                setRadiusKm(100);
                setSearchQuery('');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyExploreBtnText}>Reset Radius to 100 KM</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.instIcon}>
                <Building2 size={22} color="#003893" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.instName}>{item.institutionName}</Text>
                  <View style={styles.verifiedPill}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.subText}>
                  {item.institutionType} • {item.city}, {item.state}
                </Text>
              </View>
            </View>

            {/* Metrics Chips */}
            <View style={styles.metricsRow}>
              <View style={styles.metricChip}>
                <MapPin size={12} color="#2563eb" />
                <Text style={styles.metricChipText}>{item.distanceKm} km</Text>
              </View>
              <View style={styles.metricChip}>
                <Zap size={12} color="#16a34a" />
                <Text style={styles.metricChipText}>{item.successRate || '85% Approval'}</Text>
              </View>
              <View style={styles.metricChip}>
                <Percent size={12} color="#7c3aed" />
                <Text style={styles.metricChipText}>From {item.minInterestRate}%/mo</Text>
              </View>
            </View>

            {/* Loan Limits Banner */}
            <View style={styles.limitsBanner}>
              <Text style={styles.limitsTitle}>
                Limits: ₹{item.minLoanAmount?.toLocaleString('en-IN')} - ₹{item.maxLoanAmount?.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.limitsSub}>
                Categories: {item.loanCategories.slice(0, 2).join(', ')}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedLenderForLoan(item);
                  setLoanModalVisible(true);
                }}
              >
                <Text style={styles.applyBtnText}>Inquire Now</Text>
                <ArrowRight size={14} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => handleContactAction(item, 'CALL')}
              >
                <Phone size={18} color="#003893" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtnGreen}
                onPress={() => handleContactAction(item, 'WHATSAPP')}
              >
                <MessageSquare size={18} color="#16a34a" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modals */}
      <LoanRequestModal
        visible={loanModalVisible}
        lender={selectedLenderForLoan}
        onClose={() => setLoanModalVisible(false)}
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

      <LocationPickerModal
        visible={locationModalVisible}
        currentRadius={radiusKm}
        currentCity={city}
        onClose={() => setLocationModalVisible(false)}
        onApply={(r, c) => {
          setRadiusKm(r);
          if (c !== undefined) setCity(c);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBox: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  locationFilterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 4,
  },
  radiusPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  radiusPillActive: {
    backgroundColor: '#003893',
  },
  radiusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  radiusPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  instIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  subText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  limitsBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  limitsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  limitsSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  circleBtnGreen: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
    backgroundColor: '#eff6ff',
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
});
