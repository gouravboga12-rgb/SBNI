import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Wallet,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  X,
  Clock,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react-native';
import { fetchMyReferralInfoApi } from '../services/api';
import { ReferralInfoData } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReferAndEarnModalProps {
  visible: boolean;
  onClose: () => void;
  userRole?: 'VENDOR' | 'LENDER';
  userName?: string;
}

export const ReferAndEarnModal: React.FC<ReferAndEarnModalProps> = ({
  visible,
  onClose,
  userRole = 'VENDOR',
  userName = 'Partner',
}) => {
  const [data, setData] = useState<ReferralInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'transactions'>('referrals');

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchMyReferralInfoApi()
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  if (!visible) return null;

  const referralCode = data?.referralCode || 'JUSTPAISA';
  const referralLink = `https://justpaisa.in?ref=${referralCode}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: 'Join JustPaisa Partner Network',
        message: `Connect with 100% verified commercial partners and shops on JustPaisa!\n\nSign up with my partner referral link and get welcome reward cashback:\n👉 ${referralLink}\n\nReferral Code: ${referralCode}`,
      });
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Connect with 100% verified commercial partners and shops on JustPaisa.\n\nSign up with my partner referral link and get welcome reward cashback in your wallet:\n👉 ${referralLink}\n\nReferral Code: ${referralCode}`
    );
    Linking.openURL(`https://wa.me/?text=${text}`).catch(() => {});
  };

  const totalEarned = data?.totalEarned || 0;
  const walletBalance = data?.walletBalance || 0;
  const totalInvited = data?.totalInvited || 0;
  const completedConversions = data?.completedConversions || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.giftIconBox}>
                  <Gift size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Refer & Earn Rewards 🎁</Text>
                  <Text style={styles.headerSub}>Invite shop businesses and commercial partners</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero Banner */}
              <View style={styles.heroBanner}>
                <Text style={styles.heroPreTitle}>EXCLUSIVE PARTNER PROGRAM</Text>
                <Text style={styles.heroTitle}>Earn up to ₹500 Cashback</Text>
                <Text style={styles.heroDesc}>
                  Share your link with businesses or commercial partners. When they subscribe, earn instant cashback directly in your wallet!
                </Text>

                {/* Referral Code & Link Box */}
                <View style={styles.codeBox}>
                  <View style={styles.codeRow}>
                    <View>
                      <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                      <Text style={styles.codeVal}>{referralCode}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, copiedCode && styles.copiedBtn]}
                      onPress={handleCopyCode}
                    >
                      {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#003893" />}
                      <Text style={[styles.copyBtnText, copiedCode && { color: '#16a34a' }]}>
                        {copiedCode ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.linkDivider} />

                  <View style={styles.shareBtnsRow}>
                    <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
                      <MessageCircle size={16} color="#ffffff" />
                      <Text style={styles.whatsappBtnText}>WhatsApp Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareLinkBtn} onPress={handleNativeShare}>
                      <Share2 size={16} color="#ffffff" />
                      <Text style={styles.shareLinkBtnText}>Share Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.copyLinkIconBtn, copiedLink && { backgroundColor: '#dcfce7' }]}
                      onPress={handleCopyLink}
                    >
                      {copiedLink ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#003893" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Stats KPI Grid */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Wallet size={18} color="#003893" />
                  <Text style={styles.kpiVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiLabel}>Wallet Balance</Text>
                </View>
                <View style={styles.kpiCard}>
                  <TrendingUp size={18} color="#16a34a" />
                  <Text style={styles.kpiVal}>₹{totalEarned.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiLabel}>Total Earned</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Users size={18} color="#9333ea" />
                  <Text style={styles.kpiVal}>{totalInvited}</Text>
                  <Text style={styles.kpiLabel}>Invited Users</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Award size={18} color="#d97706" />
                  <Text style={styles.kpiVal}>{completedConversions}</Text>
                  <Text style={styles.kpiLabel}>Conversions</Text>
                </View>
              </View>

              {/* Sub-tabs: Referrals List vs Transactions */}
              <View style={styles.tabHeader}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'referrals' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('referrals')}
                >
                  <Users size={14} color={activeTab === 'referrals' ? '#003893' : '#64748b'} />
                  <Text style={[styles.tabText, activeTab === 'referrals' && styles.tabTextActive]}>
                    Referred Partners ({data?.referrals?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'transactions' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('transactions')}
                >
                  <Clock size={14} color={activeTab === 'transactions' ? '#003893' : '#64748b'} />
                  <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
                    Wallet Ledger
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              {loading ? (
                <ActivityIndicator size="small" color="#003893" style={{ padding: 24 }} />
              ) : activeTab === 'referrals' ? (
                data?.referrals && data.referrals.length > 0 ? (
                  data.referrals.map((ref) => (
                    <View key={ref.id} style={styles.refItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.refItemName}>{ref.refereeName}</Text>
                        <Text style={styles.refItemPlan}>{ref.planName} • Code: {ref.referralCode}</Text>
                        <Text style={styles.refItemDate}>Joined on {new Date(ref.joinedAt).toLocaleDateString('en-IN')}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.refRewardText, ref.status === 'COMPLETED' ? { color: '#16a34a' } : { color: '#d97706' }]}>
                          +₹{ref.rewardAmount || 0}
                        </Text>
                        <Text style={[styles.refStatusBadge, ref.status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending]}>
                          {ref.status}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Users size={32} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Referrals Yet</Text>
                    <Text style={styles.emptySub}>Share your code with shop owners and commercial partners to start earning!</Text>
                  </View>
                )
              ) : (
                data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx) => (
                    <View key={tx.id} style={styles.refItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.refItemName}>{tx.description || tx.source}</Text>
                        <Text style={styles.refItemDate}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</Text>
                      </View>
                      <Text style={[styles.refRewardText, tx.type === 'CREDIT' ? { color: '#16a34a' } : { color: '#dc2626' }]}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBox}>
                    <Wallet size={32} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                    <Text style={styles.emptySub}>Your referral rewards and deductions will appear here.</Text>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giftIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroBanner: {
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    gap: 6,
  },
  heroPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4c1d95',
  },
  heroDesc: {
    fontSize: 12,
    color: '#5b21b6',
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    gap: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b21a8',
  },
  codeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#003893',
    letterSpacing: 1.2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  copiedBtn: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
  },
  linkDivider: {
    height: 1,
    backgroundColor: '#f3e8ff',
  },
  shareBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 12,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  shareLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareLinkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  copyLinkIconBtn: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#003893',
    fontWeight: '800',
  },
  refItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  refItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  refItemPlan: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  refItemDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  refRewardText: {
    fontSize: 14,
    fontWeight: '900',
  },
  refStatusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
