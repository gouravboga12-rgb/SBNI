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
} from 'react-native';
import {
  Building2,
  Phone,
  MessageSquare,
  Search,
  PlusCircle,
  Crown,
  Sparkles,
  MapPin,
  CheckCircle2,
  Percent,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getLendersList } from '../../services/api';
import { ConsentModal } from '../../components/ConsentModal';
import { SubscriptionModal } from '../../components/SubscriptionModal';

export const VendorHomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [lenders, setLenders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Consent & Subscription Modals
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [selectedLender, setSelectedLender] = useState<any>(null);
  const [actionType, setActionType] = useState<'CALL' | 'WHATSAPP'>('CALL');
  const [subModalVisible, setSubModalVisible] = useState(false);

  const hasSubscription = !!user?.activeSubscription || true; // Demo active

  useEffect(() => {
    loadLenders();
  }, []);

  const loadLenders = async () => {
    setLoading(true);
    try {
      const res = await getLendersList();
      if (res?.data && res.data.length > 0) {
        setLenders(res.data);
      } else {
        // Fallback default financers
        setLenders([
          {
            id: 'l1',
            institutionName: 'Apex Capital Microfinance',
            contactPersonName: 'Srinivas Rao',
            phone: '9553921237',
            city: 'Hyderabad',
            state: 'Telangana',
            loanTypesOffered: ['Daily Finance', 'Weekly Business Loan', 'Emergency Cash'],
            minLoanAmount: 10000,
            maxLoanAmount: 500000,
            interestRateMin: 1.5,
            interestRateMax: 2.5,
            isVerified: true,
          },
          {
            id: 'l2',
            institutionName: 'Pragati Commercial Finance',
            contactPersonName: 'Rajesh Kumar',
            phone: '9848022338',
            city: 'Secunderabad',
            state: 'Telangana',
            loanTypesOffered: ['Machinery Loan', 'Vendor Working Capital'],
            minLoanAmount: 25000,
            maxLoanAmount: 1000000,
            interestRateMin: 1.2,
            interestRateMax: 2.0,
            isVerified: true,
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading lenders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConnect = (lender: any, type: 'CALL' | 'WHATSAPP') => {
    setSelectedLender(lender);
    setActionType(type);
    setConsentModalVisible(true);
  };

  const filteredLenders = lenders.filter(
    (l) =>
      l.institutionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.loanTypesOffered?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search financers by name, loan type, city..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Subscription Banner */}
      <View style={styles.subscriptionBanner}>
        <View style={styles.subBannerLeft}>
          <Crown size={20} color="#f59e0b" />
          <View>
            <Text style={styles.subBannerTitle}>Vendor Growth Plan</Text>
            <Text style={styles.subBannerSubtitle}>Unlimited Direct Financer Calls Unlocked</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => setSubModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Financer Cards List */}
      <FlatList
        data={filteredLenders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Card Top */}
            <View style={styles.cardHeader}>
              <View style={styles.lenderIconBg}>
                <Building2 size={22} color="#003893" />
              </View>
              <View style={styles.lenderDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.institutionName}>{item.institutionName}</Text>
                  {item.isVerified && (
                    <CheckCircle2 size={16} color="#059669" />
                  )}
                </View>
                <View style={styles.locationRow}>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.locationText}>{item.city}, {item.state}</Text>
                </View>
              </View>
            </View>

            {/* Loan Terms Pill Bar */}
            <View style={styles.termsBar}>
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Loan Range</Text>
                <Text style={styles.termValue}>
                  ₹{(item.minLoanAmount / 1000).toFixed(0)}k - ₹{(item.maxLoanAmount / 100000).toFixed(1)}L
                </Text>
              </View>
              <View style={styles.termDivider} />
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Interest Rate</Text>
                <Text style={styles.termValue}>
                  {item.interestRateMin}% - {item.interestRateMax}% /mo
                </Text>
              </View>
            </View>

            {/* Loan Tags */}
            {item.loanTypesOffered && (
              <View style={styles.tagsContainer}>
                {item.loanTypesOffered.map((t: string, idx: number) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleConnect(item, 'CALL')}
                activeOpacity={0.8}
              >
                <Phone size={16} color="#ffffff" />
                <Text style={styles.actionBtnText}>Call Directly</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => handleConnect(item, 'WHATSAPP')}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color="#ffffff" />
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Consent & Subscription Modals */}
      <ConsentModal
        visible={consentModalVisible}
        onClose={() => setConsentModalVisible(false)}
        lender={selectedLender}
        actionType={actionType}
      />

      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  subscriptionBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  subBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  subBannerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  upgradeBtn: {
    backgroundColor: '#003893',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  listContainer: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  lenderIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lenderDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  termsBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  termItem: {
    flex: 1,
    alignItems: 'center',
  },
  termDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  termLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  termValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tagText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
