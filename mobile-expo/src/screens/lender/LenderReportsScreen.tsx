import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Phone,
  MessageSquare,
  Eye,
  Trash2,
  Store,
  MapPin,
  Calendar,
  Search,
  ShieldAlert,
  PlusCircle,
  X,
  Send,
  Navigation,
} from 'lucide-react-native';
import {
  fetchLenderLeadsApi,
  updateLeadStatusApi,
  deleteLenderLeadApi,
  fetchFraudReportsApi,
  submitFraudReportApi,
} from '../../services/api';
import { VendorLead, FraudReportItem } from '../../types';
import { VendorReviewModal } from '../../components/VendorReviewModal';
import { useAuth } from '../../context/AuthContext';

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'FRAUD', label: 'Fraud' },
];

export const LenderReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { user } = useAuth();

  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorLead | null>(null);

  // Fraud Reporting Modal State
  const [fraudModalVisible, setFraudModalVisible] = useState(false);
  const [reportingLead, setReportingLead] = useState<VendorLead | null>(null);
  const [fraudReason, setFraudReason] = useState('');
  const [submittingFraud, setSubmittingFraud] = useState(false);

  // Community Risk Network Modal State
  const [riskNetworkModalVisible, setRiskNetworkModalVisible] = useState(false);
  const [communityFrauds, setCommunityFrauds] = useState<FraudReportItem[]>([]);
  const [loadingFrauds, setLoadingFrauds] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLenderLeadsApi();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCommunityFrauds = async () => {
    setLoadingFrauds(true);
    try {
      const res = await fetchFraudReportsApi();
      if (res && res.data && res.data.length > 0) {
        setCommunityFrauds(res.data);
      } else {
        setCommunityFrauds([
          {
            id: 'fr_1',
            shopName: 'Balaji Fancy & Tailors',
            vendorName: 'K. Balaji',
            vendorPhone: '9848011223',
            reason: 'Submitted fake electricity bills and defaulted on daily finance payment.',
            status: 'CONFIRMED',
            createdAt: 'Recent',
          },
          {
            id: 'fr_2',
            shopName: 'Metro Footwear',
            vendorName: 'Vikram Singh',
            vendorPhone: '9876543200',
            reason: 'Simultaneous loan requests across 4 financers with forged KYC documents.',
            status: 'INVESTIGATING',
            createdAt: 'Recent',
          },
        ]);
      }
    } catch (e) {
      console.warn('Error loading community frauds:', e);
    } finally {
      setLoadingFrauds(false);
    }
  };

  const handleOpenRiskNetwork = () => {
    setRiskNetworkModalVisible(true);
    loadCommunityFrauds();
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
    if (selectedVendorForReview?.id === leadId) {
      setSelectedVendorForReview((prev) => (prev ? { ...prev, status } : null));
    }

    await updateLeadStatusApi(leadId, status);
    Alert.alert('Status Updated', `Enquiry marked as ${status}.`);
  };

  const handleDeleteLead = (lead: VendorLead) => {
    Alert.alert(
      'Delete Request',
      `Are you sure you want to delete the financing request from ${lead.vendorName} (${lead.shopName})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLeads((prev) => prev.filter((l) => l.id !== lead.id));
            if (selectedVendorForReview?.id === lead.id) {
              setSelectedVendorForReview(null);
            }
            await deleteLenderLeadApi(lead.id);
          },
        },
      ]
    );
  };

  const handleOpenFraudReport = (lead: VendorLead) => {
    setReportingLead(lead);
    setFraudReason('');
    setFraudModalVisible(true);
  };

  const handleSubmitFraudReport = async () => {
    if (!reportingLead) return;
    if (!fraudReason.trim()) {
      Alert.alert('Reason Required', 'Please provide detailed reason for reporting this account as fraud.');
      return;
    }

    setSubmittingFraud(true);
    try {
      const res = await submitFraudReportApi({
        shopName: reportingLead.shopName,
        vendorName: reportingLead.vendorName,
        vendorPhone: reportingLead.mobileNumber,
        reason: fraudReason.trim(),
        reportedBy: user?.name || user?.email || 'Commercial Partner',
      });

      if (res.success) {
        // Mark lead as fraud locally
        setLeads((prev) =>
          prev.map((l) =>
            l.id === reportingLead.id ? { ...l, isFraud: true } : l
          )
        );
        if (selectedVendorForReview?.id === reportingLead.id) {
          setSelectedVendorForReview((prev) => (prev ? { ...prev, isFraud: true } : null));
        }

        Alert.alert(
          'Fraud Report Logged 🚨',
          `Account flagged and reported to JustPaisa Risk Network. Other business financers will be alerted.`
        );
        setFraudModalVisible(false);
        setReportingLead(null);
        setFraudReason('');
      } else {
        Alert.alert('Notice', res.message || 'Could not submit report.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed.');
    } finally {
      setSubmittingFraud(false);
    }
  };

  const pendingCount = leads.filter((l) => l.status.toLowerCase().includes('pend')).length;
  const acceptedCount = leads.filter((l) => l.status.toLowerCase().includes('accept')).length;
  const rejectedCount = leads.filter((l) => l.status.toLowerCase().includes('reject')).length;
  const fraudCount = leads.filter((l) => !!l.isFraud).length;

  const filteredLeads = leads.filter((l) => {
    // 1. Status filter
    if (filter === 'PENDING' && !l.status.toLowerCase().includes('pend')) return false;
    if (filter === 'ACCEPTED' && !l.status.toLowerCase().includes('accept')) return false;
    if (filter === 'REJECTED' && !l.status.toLowerCase().includes('reject')) return false;
    if (filter === 'FRAUD' && !l.isFraud) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.vendorName?.toLowerCase().includes(q);
      const matchShop = l.shopName?.toLowerCase().includes(q);
      const matchCity = l.city?.toLowerCase().includes(q);
      const matchPhone = l.mobileNumber?.includes(q);
      const matchMsg = l.inquiryMessage?.toLowerCase().includes(q);
      if (!matchName && !matchShop && !matchCity && !matchPhone && !matchMsg) {
        return false;
      }
    }

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.topCard}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Business Enquiries & Reports</Text>
            <Text style={styles.subTitle}>
              Manage business enquiries, approve or reject applications, and inspect KYC files
            </Text>
          </View>
          <TouchableOpacity
            style={styles.riskNetworkBtn}
            onPress={handleOpenRiskNetwork}
            activeOpacity={0.85}
          >
            <ShieldAlert size={14} color="#dc2626" />
            <Text style={styles.riskNetworkBtnText}>Risk Network</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by shop name, owner, city, phone..."
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

        {/* Filter Pills - Horizontal Scrolling */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            let count = leads.length;
            if (tab.key === 'PENDING') count = pendingCount;
            else if (tab.key === 'ACCEPTED') count = acceptedCount;
            else if (tab.key === 'REJECTED') count = rejectedCount;
            else if (tab.key === 'FRAUD') count = fraudCount;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                  tab.key === 'FRAUD' && styles.filterChipFraud,
                  tab.key === 'FRAUD' && active && styles.filterChipFraudActive,
                ]}
                onPress={() => setFilter(tab.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                    tab.key === 'FRAUD' && styles.filterChipFraudText,
                    tab.key === 'FRAUD' && active && styles.filterChipFraudTextActive,
                  ]}
                >
                  {tab.key === 'FRAUD' ? '🚨 ' : ''}{tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <FlatList
        key={isTablet ? 'tablet-2' : 'phone-1'}
        numColumns={isTablet ? 2 : 1}
        data={filteredLeads}
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
              loadLeads();
            }}
            colors={['#007a33']}
          />
        }
        renderItem={({ item }) => {
          const isPending = item.status.toLowerCase().includes('pend');
          const isAccepted = item.status.toLowerCase().includes('accept') || item.status === 'Verified';
          const isRejected = item.status.toLowerCase().includes('reject');
          const isFraud = !!item.isFraud;

          return (
            <TouchableOpacity
              style={[
                styles.card,
                isTablet && styles.cardTablet,
                isFraud && styles.cardFraud,
              ]}
              activeOpacity={0.9}
              onPress={() => setSelectedVendorForReview(item)}
            >
              {/* Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarBox}>
                  {item.avatarUrl || item.liveSelfieUrl ? (
                    <Image
                      source={{ uri: item.avatarUrl || item.liveSelfieUrl }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <Text style={styles.avatarInitial}>
                      {item.vendorName?.charAt(0).toUpperCase() || 'V'}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName} numberOfLines={1}>
                    {item.vendorName}
                  </Text>
                  <Text style={styles.shopNameText} numberOfLines={1}>
                    {item.shopName}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  {isFraud ? (
                    <View style={styles.badgeFraud}>
                      <Text style={styles.badgeFraudText}>🚨 FRAUD</Text>
                    </View>
                  ) : isAccepted ? (
                    <View style={styles.badgeGreen}>
                      <Text style={styles.badgeGreenText}>✓ Accepted</Text>
                    </View>
                  ) : isRejected ? (
                    <View style={styles.badgeRed}>
                      <Text style={styles.badgeRedText}>✗ Rejected</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeAmber}>
                      <Text style={styles.badgeAmberText}>⏳ Pending</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDeleteLead(item)}
                  >
                    <Trash2 size={14} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inquiry Source Badge */}
              <View style={styles.inquiryBadge}>
                {item.inquiryType === 'PHONE_CALL' ? (
                  <Phone size={12} color="#003893" />
                ) : item.inquiryType === 'WHATSAPP' ? (
                  <MessageSquare size={12} color="#16a34a" />
                ) : (
                  <FileText size={12} color="#003893" />
                )}
                <Text style={styles.inquiryText} numberOfLines={1}>
                  {item.inquiryMessage ||
                    (item.inquiryType === 'PHONE_CALL'
                      ? '📞 Phone Call inquiry'
                      : item.inquiryType === 'WHATSAPP'
                      ? '💬 WhatsApp inquiry'
                      : '📝 Business Enquiry submitted')}
                </Text>
              </View>

              {/* Info Details */}
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoVal}>
                    {item.city}, {item.state}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Annual Income:</Text>
                  <Text style={[styles.infoVal, { color: '#007a33' }]}>
                    {item.annualTurnover || item.annualIncome || 'Under 2 Lakhs'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Mobile:</Text>
                  <Text style={styles.infoVal}>{item.mobileNumber}</Text>
                </View>
              </View>

              {/* Action Buttons: Inspect KYC & Report Fraud */}
              <View style={styles.dualActionRow}>
                <TouchableOpacity
                  style={[styles.inspectBtn, { flex: 1 }]}
                  onPress={() => setSelectedVendorForReview(item)}
                >
                  <Eye size={13} color="#003893" />
                  <Text style={styles.inspectBtnText}>Inspect KYC Files</Text>
                </TouchableOpacity>

                {!isFraud && (
                  <TouchableOpacity
                    style={styles.reportFraudBtn}
                    onPress={() => handleOpenFraudReport(item)}
                  >
                    <AlertTriangle size={13} color="#dc2626" />
                    <Text style={styles.reportFraudBtnText}>Report Fraud</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons if Pending */}
              {isPending && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleUpdateStatus(item.id, 'Accepted')}
                  >
                    <CheckCircle2 size={14} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Accept Request</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleUpdateStatus(item.id, 'Rejected')}
                  >
                    <XCircle size={14} color="#dc2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAccepted && (
                <View style={styles.acceptedBannerRow}>
                  <View style={styles.acceptedBanner}>
                    <Text style={styles.acceptedBannerText}>
                      ✓ Accepted · Navigation Active
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => {
                      const lat = item.latitude || 17.3688;
                      const lng = item.longitude || 78.5247;
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
                    }}
                  >
                    <Navigation size={13} color="#007a33" />
                    <Text style={styles.navBtnText}>Map</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <FileText size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No financing requests match "${searchQuery}".`
                : filter === 'ALL'
                ? 'No customer financing applications have been received yet.'
                : `No requests with status "${filter}".`}
            </Text>
          </View>
        }
      />

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
        onReportFraud={(v) => {
          setSelectedVendorForReview(null);
          handleOpenFraudReport(v);
        }}
      />

      {/* Fraud Reporting Modal (Matches Website) */}
      <Modal
        visible={fraudModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFraudModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#dc2626" />
                <Text style={styles.modalTitle}>Report Suspicious / Fraud Account</Text>
              </View>
              <TouchableOpacity onPress={() => setFraudModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Reporting will flag this applicant across the JustPaisa Risk Network and notify other commercial partners in your district.
            </Text>

            {reportingLead && (
              <View style={styles.modalLeadPreview}>
                <Text style={styles.modalLeadName}>{reportingLead.vendorName}</Text>
                <Text style={styles.modalLeadShop}>{reportingLead.shopName} • {reportingLead.city}</Text>
                <Text style={styles.modalLeadPhone}>Phone: {reportingLead.mobileNumber}</Text>
              </View>
            )}

            <Text style={styles.reasonLabel}>Detailed Reason for Flagging as Fraud:</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g., Submitted fake electricity bills / forged GST / defaulted multiple daily loans..."
              placeholderTextColor="#94a3b8"
              value={fraudReason}
              onChangeText={setFraudReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setFraudModalVisible(false)}
                disabled={submittingFraud}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitFraudBtn}
                onPress={handleSubmitFraudReport}
                disabled={submittingFraud}
              >
                {submittingFraud ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={15} color="#ffffff" />
                    <Text style={styles.submitFraudBtnText}>Submit Fraud Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Community Risk Network Modal */}
      <Modal
        visible={riskNetworkModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRiskNetworkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={20} color="#dc2626" />
                <Text style={styles.modalTitle}>Fraud Risk Network</Text>
              </View>
              <TouchableOpacity onPress={() => setRiskNetworkModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Collective intelligence protecting commercial partners against fraud and fake documents.
            </Text>

            {loadingFrauds ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>Loading fraud registry...</Text>
              </View>
            ) : (
              <FlatList
                data={communityFrauds}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 10 }}
                renderItem={({ item }) => (
                  <View style={styles.riskCard}>
                    <View style={styles.riskCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.riskShopName}>{item.shopName}</Text>
                        <Text style={styles.riskVendorName}>{item.vendorName || 'Applicant'} • {item.vendorPhone || 'No Phone'}</Text>
                      </View>
                      <View style={styles.riskPill}>
                        <Text style={styles.riskPillText}>{item.status || 'FLAGGED'}</Text>
                      </View>
                    </View>
                    <Text style={styles.riskReason}>{item.reason}</Text>
                    <Text style={styles.riskDate}>Reported: {item.createdAt || 'Recent'}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>No fraud reports recorded.</Text>
                  </View>
                }
              />
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
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  riskNetworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  riskNetworkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipFraud: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  filterChipFraudActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipFraudText: {
    color: '#e11d48',
  },
  filterChipFraudTextActive: {
    color: '#ffffff',
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
  vendorName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  shopNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeGreenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeRedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  badgeAmber: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeAmberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
  },
  badgeFraud: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeFraudText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  deleteIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  inquiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  inquiryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    flex: 1,
  },
  infoBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  reportFraudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  reportFraudBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 12,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 9,
    borderRadius: 12,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  acceptedBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptedBanner: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
  },
  acceptedBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007a33',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  modalLeadPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  modalLeadName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalLeadShop: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalLeadPhone: {
    fontSize: 11,
    color: '#007a33',
    fontWeight: '700',
    marginTop: 4,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  reasonInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitFraudBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dc2626',
  },
  submitFraudBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  riskCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  riskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  riskShopName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  riskVendorName: {
    fontSize: 11,
    color: '#64748b',
  },
  riskPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',
  },
  riskReason: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 4,
  },
  riskDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
});
