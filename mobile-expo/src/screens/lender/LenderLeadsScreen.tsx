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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Store,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Calendar,
  IndianRupee,
  MapPin,
  X,
  Send,
} from 'lucide-react-native';
import { fetchLenderLeadsApi, updateLeadStatusApi, submitFraudReportApi } from '../../services/api';
import { VendorLead } from '../../types';
import { useAuth } from '../../context/AuthContext';

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

export const LenderLeadsScreen: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  // Fraud Report Modal
  const [fraudModalVisible, setFraudModalVisible] = useState(false);
  const [selectedLeadForFraud, setSelectedLeadForFraud] = useState<VendorLead | null>(null);
  const [fraudReason, setFraudReason] = useState('');
  const [submittingFraud, setSubmittingFraud] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLenderLeadsApi();
      if (data && data.length > 0) {
        setLeads(data);
      }
    } catch (e) {
      console.warn('Error loading leads:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      await updateLeadStatusApi(leadId, status);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status } : l))
      );
      Alert.alert('Status Updated', `Lead status updated to ${status}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update lead status.');
    }
  };

  const handleOpenFraudReport = (lead: VendorLead) => {
    setSelectedLeadForFraud(lead);
    setFraudReason('');
    setFraudModalVisible(true);
  };

  const handleSubmitFraudReport = async () => {
    if (!fraudReason.trim()) {
      Alert.alert('Required', 'Please describe the fraud reason or irregular activity.');
      return;
    }

    setSubmittingFraud(true);
    try {
      const res = await submitFraudReportApi({
        shopName: selectedLeadForFraud?.shopName,
        vendorName: selectedLeadForFraud?.vendorName,
        vendorPhone: selectedLeadForFraud?.mobileNumber,
        leadId: selectedLeadForFraud?.id,
        reportedBy: user?.name || user?.email || 'Financer Partner',
        reason: fraudReason.trim(),
      });

      if (res.success) {
        Alert.alert(
          'Fraud Report Submitted 🛡️',
          'Thank you for reporting. This shop has been flagged for investigation by JustPaisa Risk & Compliance.'
        );
        setFraudModalVisible(false);
      } else {
        Alert.alert('Notice', res.message || 'Could not submit report.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report.');
    } finally {
      setSubmittingFraud(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (filter === 'All') return true;
    return l.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs Header */}
      <View style={styles.filterHeader}>
        <Text style={styles.headerTitle}>Inbound Shop Enquiries</Text>
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const active = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
          const isAccepted = item.status.toLowerCase().includes('accept');
          const isRejected = item.status.toLowerCase().includes('reject');

          return (
            <View style={styles.card}>
              {/* Top Row: Shop & Status */}
              <View style={styles.cardTop}>
                <View style={styles.shopIcon}>
                  <Store size={22} color="#007a33" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{item.shopName}</Text>
                  <Text style={styles.vendorOwner}>
                    Owner: {item.vendorName} • {item.city}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isAccepted && styles.badgeAccepted,
                    isPending && styles.badgePending,
                    isRejected && styles.badgeRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isAccepted && { color: '#16a34a' },
                      isPending && { color: '#d97706' },
                      isRejected && { color: '#dc2626' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Amount & Purpose Box */}
              <View style={styles.detailsBox}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Required Amount</Text>
                  <Text style={styles.amountVal}>
                    ₹{Number(item.requiredAmount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purpose</Text>
                  <Text style={styles.purposeVal} numberOfLines={2}>
                    {item.inquiryMessage || 'Shop Inventory & Working Capital'}
                  </Text>
                </View>
              </View>

              {/* Address Row */}
              {item.shopAddress && (
                <View style={styles.addressRow}>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.shopAddress}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {isPending ? (
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
                ) : (
                  <View style={styles.statusConfirmed}>
                    <Text style={styles.statusConfirmedText}>Application {item.status}</Text>
                  </View>
                )}

                {item.mobileNumber && (
                  <>
                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={() => Linking.openURL(`tel:${item.mobileNumber}`)}
                    >
                      <Phone size={16} color="#007a33" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactIconBtn}
                      onPress={() => {
                        const clean = item.mobileNumber.replace(/\D/g, '');
                        const cleanPhone = clean.length === 10 ? `91${clean}` : clean;
                        Linking.openURL(
                          `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
                            item.shopName
                          )},%20we%20have%20reviewed%20your%20loan%20enquiry%20on%20JustPaisa.`
                        );
                      }}
                    >
                      <MessageSquare size={16} color="#16a34a" />
                    </TouchableOpacity>
                  </>
                )}

                {/* Report Fraud Button */}
                <TouchableOpacity
                  style={styles.fraudBtn}
                  onPress={() => handleOpenFraudReport(item)}
                >
                  <ShieldAlert size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Report Fraud Modal */}
      <Modal
        visible={fraudModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFraudModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} color="#dc2626" />
                <Text style={styles.modalTitle}>Report Fraudulent Shop</Text>
              </View>
              <TouchableOpacity onPress={() => setFraudModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Reporting shop: <Text style={{ fontWeight: '800' }}>{selectedLeadForFraud?.shopName}</Text> ({selectedLeadForFraud?.mobileNumber})
            </Text>

            <Text style={styles.inputLabel}>Reason / Suspicious Activity *</Text>
            <View style={styles.fraudInputBox}>
              <TextInput
                style={styles.fraudTextInput}
                placeholder="Describe false information, loan default history, or fraudulent behavior..."
                placeholderTextColor="#94a3b8"
                multiline
                value={fraudReason}
                onChangeText={setFraudReason}
              />
            </View>

            <TouchableOpacity
              style={styles.submitFraudBtn}
              onPress={handleSubmitFraudReport}
              disabled={submittingFraud}
            >
              {submittingFraud ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.submitFraudBtnText}>Submit Fraud Report</Text>
                </>
              )}
            </TouchableOpacity>
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
  filterHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#007a33',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
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
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  vendorOwner: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  badgeAccepted: {
    backgroundColor: '#dcfce7',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeRejected: {
    backgroundColor: '#fee2e2',
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
    color: '#007a33',
    marginTop: 2,
  },
  purposeVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 11,
    color: '#64748b',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007a33',
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  statusConfirmed: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusConfirmedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  contactIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraudBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  fraudInputBox: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    height: 100,
    padding: 10,
    marginBottom: 18,
  },
  fraudTextInput: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0f172a',
  },
  submitFraudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitFraudBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
