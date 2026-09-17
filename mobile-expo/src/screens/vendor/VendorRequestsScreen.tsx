import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Building2,
  Calendar,
  Search,
  Navigation,
  MessageSquare,
} from 'lucide-react-native';
import { fetchVendorMyLeadsApi } from '../../services/api';
import { VendorLead } from '../../types';

const STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Rejected'];

export const VendorRequestsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetchVendorMyLeadsApi();
      if (res.data && Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.warn('Error loading vendor requests:', e);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'All') return true;
    return (r.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('accept') || s.includes('verif') || s.includes('approv') || s.includes('complete')) return '#16a34a';
    if (s.includes('reject')) return '#dc2626';
    return '#d97706'; // Pending
  };

  const getStatusBg = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('accept') || s.includes('verif') || s.includes('approv') || s.includes('complete')) return '#dcfce7';
    if (s.includes('reject')) return '#fee2e2';
    return '#fef3c7'; // Pending
  };

  return (
    <View style={styles.container}>
      {/* Header & Status Filter Pills */}
      <View style={styles.filterHeader}>
        <Text style={styles.headerTitle}>My Inquiries</Text>
        <Text style={styles.headerSub}>
          Track your direct business inquiries and connect with verified financers
        </Text>
        <View style={styles.pillsRow}>
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Inquiries List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item, index) => item.id || String(index)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRequests();
            }}
            colors={['#003893']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <FileText size={36} color="#003893" />
            </View>
            <Text style={styles.emptyTitle}>No Inquiries Submitted Yet</Text>
            <Text style={styles.emptySub}>
              You haven't submitted any inquiries yet. Explore verified financers and click Inquire Now to connect with lenders.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Financers')}
              activeOpacity={0.85}
            >
              <Search size={15} color="#ffffff" />
              <Text style={styles.exploreBtnText}>Explore Verified Financers</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const status = item.status || 'Pending';
          const isAccepted =
            status === 'Accepted' ||
            status === 'Verified' ||
            status === 'Approved' ||
            status === 'Completed';
          const isRejected = status === 'Rejected' || status === 'REJECTED';
          const statusColor = getStatusColor(status);
          const statusBg = getStatusBg(status);

          const rawPhone = item.mobileNumber || '9553921237';
          const cleanPhone = (rawPhone || '').replace(/\D/g, '') || '9553921237';
          const effectivePhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

          const whatsAppMsg = encodeURIComponent(
            `Hello ${item.lenderName || 'Financer'}, I am contacting you regarding my business enquiry #${(item.id || '').substring(0, 8)} on Just Paisa App.`
          );

          return (
            <View style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.lenderIcon}>
                  <Building2 size={20} color="#003893" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lenderName}>
                    {item.lenderName || 'Business Money Financer'}
                  </Text>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#64748b" />
                    <Text style={styles.dateText}>
                      {item.requestedDate || 'Recent Inquiry'}
                    </Text>
                  </View>
                </View>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {isAccepted ? '✓ Accepted' : isRejected ? '✕ Rejected' : '⏳ Pending'}
                  </Text>
                </View>
              </View>

              {/* Requirement & Notes Box */}
              <View style={styles.detailsBox}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Requirement</Text>
                  <Text style={styles.amountVal}>
                    ₹{Number(item.requiredAmount || 50000).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Enquiry Note</Text>
                  <Text style={styles.purposeVal} numberOfLines={1}>
                    {item.inquiryMessage || 'Working Capital & Business Need'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Call, WhatsApp, Navigation */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${effectivePhone}`)}
                  activeOpacity={0.8}
                >
                  <Phone size={13} color="#15803d" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => Linking.openURL(`https://wa.me/91${effectivePhone}?text=${whatsAppMsg}`)}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={13} color="#16a34a" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                {isAccepted && (
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => {
                      const lat = (item as any).lenderLatitude || 17.385;
                      const lng = (item as any).lenderLongitude || 78.4867;
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Navigation size={13} color="#003893" />
                    <Text style={styles.navBtnText}>Office GPS</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
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
  filterHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#003893',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
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
    alignItems: 'center',
    gap: 12,
  },
  lenderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailCol: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#003893',
    marginTop: 2,
  },
  purposeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 8,
    borderRadius: 10,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 16,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
