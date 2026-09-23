import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  TextInput,
  Modal,
  ScrollView,
  useWindowDimensions,
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
  X,
  MapPin,
  Eye,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { fetchVendorMyLeadsApi } from '../../services/api';
import { VendorLead } from '../../types';

const STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Rejected'];

export const VendorRequestsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [requests, setRequests] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VendorLead | null>(null);

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
    // 1. Status Filter
    if (statusFilter !== 'All') {
      const s = (r.status || '').toLowerCase();
      const target = statusFilter.toLowerCase();
      if (target === 'pending' && !s.includes('pend')) return false;
      if (target === 'accepted' && !s.includes('accept') && !s.includes('verif') && !s.includes('approv') && !s.includes('complete')) return false;
      if (target === 'rejected' && !s.includes('reject')) return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesLender = (r.lenderName || '').toLowerCase().includes(q);
      const matchesShop = (r.shopName || '').toLowerCase().includes(q);
      const matchesNotes = (r.inquiryMessage || '').toLowerCase().includes(q);
      const matchesStatus = (r.status || '').toLowerCase().includes(q);
      if (!matchesLender && !matchesShop && !matchesNotes && !matchesStatus) {
        return false;
      }
    }

    return true;
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
      {/* Header, Search Bar & Status Filter Pills */}
      <View style={styles.filterHeader}>
        <Text style={styles.headerTitle}>My Inquiries</Text>
        <Text style={styles.headerSub}>
          Track your direct business inquiries and connect with verified financers
        </Text>

        {/* Live Search Input */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by financer name, notes, or status..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pillsRow}>
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            let count = requests.length;
            if (s === 'Pending') count = requests.filter((r) => (r.status || '').toLowerCase().includes('pend')).length;
            else if (s === 'Accepted') count = requests.filter((r) => {
              const st = (r.status || '').toLowerCase();
              return st.includes('accept') || st.includes('verif') || st.includes('approv') || st.includes('complete');
            }).length;
            else if (s === 'Rejected') count = requests.filter((r) => (r.status || '').toLowerCase().includes('reject')).length;

            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {s} ({count})
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
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tab-req-grid' : 'phone-req-grid'}
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
            <Text style={styles.emptyTitle}>No Inquiries Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || statusFilter !== 'All'
                ? 'No inquiries match your current search or filter criteria.'
                : "You haven't submitted any inquiries yet. Explore verified financers and click Inquire Now to connect with lenders."}
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
        renderItem={({ item }) => {
          const status = item.status || 'Pending';
          const isAccepted =
            status === 'Accepted' ||
            status === 'Verified' ||
            status === 'Approved' ||
            status === 'Completed';
          const isRejected = status === 'Rejected' || status === 'REJECTED';
          const statusColor = getStatusColor(status);
          const statusBg = getStatusBg(status);

          // Financer Contact Phone (strictly the Lender's phone number, with fallback)
          const rawPhone =
            (item.lender as any)?.phone ||
            (item as any).lenderPhone ||
            (item.lender as any)?.user?.phone ||
            '9553921237';
          const cleanPhone = (rawPhone || '').replace(/\D/g, '') || '9553921237';
          const effectivePhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

          const financerName = item.lenderName || (item.lender as any)?.institutionName || 'Business Money Financer';
          const whatsAppMsg = encodeURIComponent(
            `Hello ${financerName}, I am contacting you regarding my business enquiry #${(item.id || '').substring(0, 8)} on Just Paisa App.`
          );

          // Office coordinates
          const lenderLat = (item as any).lenderLatitude || (item.lender as any)?.latitude || 17.3850;
          const lenderLng = (item as any).lenderLongitude || (item.lender as any)?.longitude || 78.4867;

          return (
            <TouchableOpacity
              style={[styles.requestCard, isTablet && styles.requestCardTablet]}
              onPress={() => setSelectedRequest(item)}
              activeOpacity={0.92}
            >
              <View style={styles.cardHeader}>
                <View style={styles.lenderIcon}>
                  <Building2 size={20} color="#003893" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lenderName}>
                    {financerName}
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

              {/* Action Buttons: Call Financer, WhatsApp Financer, Navigation to Office */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${effectivePhone}`)}
                  activeOpacity={0.8}
                >
                  <Phone size={13} color="#15803d" />
                  <Text style={styles.callBtnText}>Call Financer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => Linking.openURL(`https://wa.me/91${effectivePhone}?text=${whatsAppMsg}`)}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={13} color="#16a34a" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                {isAccepted ? (
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${lenderLat},${lenderLng}`
                      ).catch(() => {})
                    }
                    activeOpacity={0.8}
                  >
                    <Navigation size={13} color="#003893" />
                    <Text style={styles.navBtnText}>Office Map</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedRequest(item)}
                    activeOpacity={0.8}
                  >
                    <Eye size={13} color="#475569" />
                    <Text style={styles.viewDetailsBtnText}>View</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Full Application Details Inspection Modal */}
      {selectedRequest && (
        <Modal
          visible={true}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.modalHeaderIcon}>
                    <FileText size={20} color="#003893" />
                  </View>
                  <View>
                    <Text style={styles.modalHeaderTitle}>Inquiry Details</Text>
                    <Text style={styles.modalHeaderSub}>
                      App #{selectedRequest.id ? selectedRequest.id.substring(0, 10) : 'REF'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedRequest(null)}
                >
                  <X size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Status Callout */}
                <View
                  style={[
                    styles.statusCallout,
                    {
                      backgroundColor: getStatusBg(selectedRequest.status || 'Pending'),
                      borderColor: getStatusColor(selectedRequest.status || 'Pending') + '40',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusCalloutText,
                      { color: getStatusColor(selectedRequest.status || 'Pending') },
                    ]}
                  >
                    Current Status:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {selectedRequest.status === 'Accepted'
                        ? '✓ Accepted by Financer'
                        : selectedRequest.status === 'Rejected'
                        ? '✕ Rejected'
                        : '⏳ Under Review'}
                    </Text>
                  </Text>
                  <Text style={styles.statusCalloutSub}>
                    {selectedRequest.status === 'Accepted'
                      ? 'The financer has approved your inquiry. You can call them directly or navigate to their office location on Google Maps.'
                      : 'Your financing request is currently being reviewed by the financer partner.'}
                  </Text>
                </View>

                {/* Financer Info Card */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Financer Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Institution</Text>
                    <Text style={styles.infoValue}>
                      {selectedRequest.lenderName || (selectedRequest.lender as any)?.institutionName || 'Verified Financer'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Inquiry Date</Text>
                    <Text style={styles.infoValue}>{selectedRequest.requestedDate || 'Recent'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Requirement Amount</Text>
                    <Text style={styles.infoValueHighlight}>
                      ₹{Number(selectedRequest.requiredAmount || 50000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Submission Notes */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Submitted Purpose & Notes</Text>
                  <Text style={styles.notesText}>
                    {selectedRequest.inquiryMessage || 'Working Capital & Inventory Purchase'}
                  </Text>
                </View>

                {/* Office Navigation for Accepted Requests */}
                {((selectedRequest.status || '').toLowerCase().includes('accept') ||
                  (selectedRequest.status || '').toLowerCase().includes('approv') ||
                  (selectedRequest.status || '').toLowerCase().includes('verif')) && (
                  <View style={styles.navSection}>
                    <TouchableOpacity
                      style={styles.fullNavBtn}
                      onPress={() => {
                        const lat = (selectedRequest as any).lenderLatitude || (selectedRequest.lender as any)?.latitude || 17.3850;
                        const lng = (selectedRequest as any).lenderLongitude || (selectedRequest.lender as any)?.longitude || 78.4867;
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                        ).catch(() => {});
                      }}
                    >
                      <Navigation size={18} color="#ffffff" />
                      <Text style={styles.fullNavBtnText}>Open Financer Office in Google Maps</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#003893',
    borderColor: '#003893',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  requestCardTablet: {
    flex: 1,
    marginHorizontal: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  lenderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lenderName: {
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#003893',
    marginTop: 2,
  },
  purposeVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
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
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalCardTablet: {
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 24,
    marginBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  modalHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalScroll: {
    maxHeight: 450,
  },
  statusCallout: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusCalloutText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusCalloutSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoValueHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: '#003893',
  },
  notesText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  navSection: {
    marginTop: 6,
    marginBottom: 10,
  },
  fullNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fullNavBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
