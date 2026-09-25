import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldAlert,
  Search,
  PlusCircle,
  X,
  AlertTriangle,
  Calendar,
  Send,
  Phone,
  Store,
} from 'lucide-react-native';
import { fetchFraudReportsApi, submitFraudReportApi } from '../../services/api';
import { FraudReportItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const LenderFraudScreen: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<FraudReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [shopName, setShopName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetchFraudReportsApi();
      if (res.data && res.data.length > 0) {
        setReports(res.data);
      } else {
        // Fallback sample reports
        setReports([
          {
            id: 'fr_1',
            shopName: 'Balaji Fancy & Tailors',
            vendorName: 'K. Balaji',
            vendorPhone: '9848011223',
            reason: 'Submitted fake shop electricity bills and defaulted on daily finance payment.',
            status: 'CONFIRMED',
            createdAt: new Date(Date.now() - 86400000 * 3).toLocaleDateString('en-IN'),
          },
          {
            id: 'fr_2',
            shopName: 'Metro Footwear',
            vendorName: 'Vikram Singh',
            vendorPhone: '9876543200',
            reason: 'Multiple simultaneous loan requests across 4 financers with forged KYC.',
            status: 'INVESTIGATING',
            createdAt: new Date(Date.now() - 86400000 * 7).toLocaleDateString('en-IN'),
          },
        ]);
      }
    } catch (e) {
      console.warn('Error loading fraud reports:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateReport = async () => {
    if (!shopName.trim() || !reason.trim()) {
      Alert.alert('Required Fields', 'Please enter shop name and description of fraud.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFraudReportApi({
        shopName: shopName.trim(),
        vendorName: vendorName.trim() || undefined,
        vendorPhone: phone.trim() || undefined,
        reportedBy: user?.name || user?.email || 'Commercial Partner',
        reason: reason.trim(),
      });

      if (res.success) {
        Alert.alert('Report Submitted', 'Fraud report entered into the JustPaisa Risk Network.');
        setModalVisible(false);
        setShopName('');
        setVendorName('');
        setPhone('');
        setReason('');
        loadReports();
      } else {
        Alert.alert('Notice', res.message || 'Could not submit report.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.shopName && r.shopName.toLowerCase().includes(q)) ||
      (r.vendorName && r.vendorName.toLowerCase().includes(q)) ||
      (r.vendorPhone && r.vendorPhone.includes(q)) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ShieldAlert size={22} color="#dc2626" />
          <View>
            <Text style={styles.headerTitle}>Fraud Risk Network</Text>
            <Text style={styles.headerSub}>Collective intelligence protecting business financers</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <PlusCircle size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Report Fraud</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fraud list by shop name or phone..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReports();
            }}
            colors={['#dc2626']}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <View style={styles.reportTop}>
              <View style={styles.dangerIconBg}>
                <AlertTriangle size={20} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportedShop}>{item.shopName || 'Unknown Shop'}</Text>
                <Text style={styles.reportedOwner}>
                  {item.vendorName ? `Owner: ${item.vendorName}` : 'Owner Unspecified'}
                  {item.vendorPhone ? ` • ${item.vendorPhone}` : ''}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{item.status || 'CONFIRMED'}</Text>
              </View>
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            {item.createdAt && (
              <View style={styles.dateRow}>
                <Calendar size={12} color="#94a3b8" />
                <Text style={styles.dateText}>Reported on {item.createdAt}</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* New Report Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} color="#dc2626" />
                <Text style={styles.modalHeading}>Report Fraudulent Shop</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Shop / Business Name *</Text>
            <View style={styles.inputBox}>
              <Store size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="Shop Name"
                placeholderTextColor="#94a3b8"
                value={shopName}
                onChangeText={setShopName}
              />
            </View>

            <Text style={styles.inputLabel}>Shop Owner Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.textInput, { paddingLeft: 12 }]}
                placeholder="Owner Full Name"
                placeholderTextColor="#94a3b8"
                value={vendorName}
                onChangeText={setVendorName}
              />
            </View>

            <Text style={styles.inputLabel}>Shop Phone Number</Text>
            <View style={styles.inputBox}>
              <Phone size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.inputLabel}>Reason / Default Details *</Text>
            <View style={[styles.inputBox, { height: 90, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe default behavior, forged docs, or fake address..."
                placeholderTextColor="#94a3b8"
                multiline
                value={reason}
                onChangeText={setReason}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateReport}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit to Fraud Network</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    elevation: 2,
  },
  reportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dangerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportedShop: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  reportedOwner: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  reasonBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  reasonText: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
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
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
