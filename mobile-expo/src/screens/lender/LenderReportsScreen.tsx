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
} from 'lucide-react-native';
import { fetchLenderLeadsApi, updateLeadStatusApi, deleteLenderLeadApi } from '../../services/api';
import { VendorLead } from '../../types';
import { VendorReviewModal } from '../../components/VendorReviewModal';

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'FRAUD', label: 'Fraud' },
];

export const LenderReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorLead | null>(null);

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

  const handleUpdateStatus = async (leadId: string, status: string) => {
    // Update local state immediately
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

  const pendingCount = leads.filter((l) => l.status.toLowerCase().includes('pend')).length;
  const acceptedCount = leads.filter((l) => l.status.toLowerCase().includes('accept')).length;
  const rejectedCount = leads.filter((l) => l.status.toLowerCase().includes('reject')).length;
  const fraudCount = leads.filter((l) => !!l.isFraud).length;

  const filteredLeads = leads.filter((l) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return l.status.toLowerCase().includes('pend');
    if (filter === 'ACCEPTED') return l.status.toLowerCase().includes('accept');
    if (filter === 'REJECTED') return l.status.toLowerCase().includes('reject');
    if (filter === 'FRAUD') return !!l.isFraud;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.topCard}>
        <Text style={styles.title}>Financing Requests & Reports</Text>
        <Text style={styles.subTitle}>
          Manage customer financing requests, approve or reject applications, and inspect KYC documents
        </Text>

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
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(tab.key)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <FlatList
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
              style={[styles.card, isFraud && styles.cardFraud]}
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
                  <Text style={styles.vendorName}>{item.vendorName}</Text>
                  <Text style={styles.shopNameText}>{item.shopName}</Text>
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
                  {item.inquiryMessage || (item.inquiryType === 'PHONE_CALL' ? '📞 Phone Call inquiry' : item.inquiryType === 'WHATSAPP' ? '💬 WhatsApp inquiry' : '📝 Loan Application submitted')}
                </Text>
              </View>

              {/* Info Details */}
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoVal}>{item.city}, {item.state}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Annual Income:</Text>
                  <Text style={[styles.infoVal, { color: '#007a33' }]}>{item.annualTurnover || item.annualIncome || 'Under 2 Lakhs'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Mobile:</Text>
                  <Text style={styles.infoVal}>{item.mobileNumber}</Text>
                </View>
              </View>

              {/* Inspect KYC Files Button */}
              <TouchableOpacity
                style={styles.inspectBtn}
                onPress={() => setSelectedVendorForReview(item)}
              >
                <Eye size={14} color="#003893" />
                <Text style={styles.inspectBtnText}>Inspect All KYC Files & Photos</Text>
              </TouchableOpacity>

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
                <View style={styles.acceptedBanner}>
                  <Text style={styles.acceptedBannerText}>
                    ✓ Accepted · Vendor Office Navigation Unlocked
                  </Text>
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
              {filter === 'ALL'
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
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
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterChipTextActive: {
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
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
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
  acceptedBanner: {
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
