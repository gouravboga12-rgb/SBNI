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
} from 'react-native';
import {
  Store,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  BadgeAlert,
  ChevronRight,
} from 'lucide-react-native';
import { getInboundLeads, updateLeadStatus } from '../../services/api';
import { LoanRequestItem } from '../../types';

export const LenderHomeScreen: React.FC = () => {
  const [leads, setLeads] = useState<LoanRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await getInboundLeads();
      if (res?.data && res.data.length > 0) {
        setLeads(res.data);
      } else {
        // Fallback default leads
        setLeads([
          {
            id: 'lead_101',
            vendorId: 'v1',
            vendorName: 'Ramesh Gupta',
            shopName: 'Gupta General & Kirana Store',
            amount: 50000,
            purpose: 'Festival inventory purchase & working capital',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            vendorPhone: '9553921237',
          },
          {
            id: 'lead_102',
            vendorId: 'v2',
            vendorName: 'Mohammed Ali',
            shopName: 'Deccan Mobile & Electronics',
            amount: 150000,
            purpose: 'Shop renovation and bulk accessory stock',
            status: 'ACCEPTED',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            vendorPhone: '9848022338',
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading leads:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
      );
      Alert.alert('Status Updated', `Enquiry marked as ${newStatus}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleCallVendor = (phone?: string) => {
    if (!phone) {
      Alert.alert('Notice', 'Vendor phone not available.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsAppVendor = (shopName: string, phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const cleanPhone = clean.length === 10 ? `91${clean}` : clean;
    const msg = encodeURIComponent(
      `Hello, this is regarding your loan enquiry on JustPaisa for ${shopName}. We would like to discuss the sanction terms.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
  };

  const filteredLeads = leads.filter(
    (l) => statusFilter === 'ALL' || l.status === statusFilter
  );

  return (
    <View style={styles.container}>
      {/* Header Filter Pills */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterPill, statusFilter === 'ALL' && styles.filterPillActive]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={[styles.filterText, statusFilter === 'ALL' && styles.filterTextActive]}>
            All Leads ({leads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, statusFilter === 'PENDING' && styles.filterPillActive]}
          onPress={() => setStatusFilter('PENDING')}
        >
          <Text style={[styles.filterText, statusFilter === 'PENDING' && styles.filterTextActive]}>
            Pending ({leads.filter((l) => l.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, statusFilter === 'ACCEPTED' && styles.filterPillActive]}
          onPress={() => setStatusFilter('ACCEPTED')}
        >
          <Text style={[styles.filterText, statusFilter === 'ACCEPTED' && styles.filterTextActive]}>
            Sanctioned ({leads.filter((l) => l.status === 'ACCEPTED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
          const isPending = item.status === 'PENDING';
          return (
            <View style={styles.leadCard}>
              {/* Card Top */}
              <View style={styles.leadCardTop}>
                <View style={styles.shopIconBg}>
                  <Store size={22} color="#007a33" />
                </View>
                <View style={styles.leadInfo}>
                  <Text style={styles.shopName}>{item.shopName}</Text>
                  <Text style={styles.vendorName}>Owner: {item.vendorName}</Text>
                </View>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>₹{(item.amount / 1000).toFixed(0)}k</Text>
                </View>
              </View>

              {/* Purpose Box */}
              <View style={styles.purposeBox}>
                <Text style={styles.purposeLabel}>Requirement / Purpose:</Text>
                <Text style={styles.purposeText}>{item.purpose}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCallVendor(item.vendorPhone)}
                  activeOpacity={0.8}
                >
                  <Phone size={16} color="#ffffff" />
                  <Text style={styles.btnText}>Call Vendor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={() => handleWhatsAppVendor(item.shopName, item.vendorPhone)}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={16} color="#ffffff" />
                  <Text style={styles.btnText}>WhatsApp</Text>
                </TouchableOpacity>

                {isPending && (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle size={16} color="#ffffff" />
                    <Text style={styles.btnText}>Accept</Text>
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
    backgroundColor: '#f1f5f9',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#007a33',
    borderColor: '#007a33',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    gap: 14,
  },
  leadCard: {
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
  leadCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  shopIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  leadInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  vendorName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  amountBadge: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#007a33',
  },
  purposeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  purposeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  purposeText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007a33',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
