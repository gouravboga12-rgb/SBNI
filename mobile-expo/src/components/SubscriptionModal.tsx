import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  Switch,
} from 'react-native';
import {
  Crown,
  CheckCircle2,
  Zap,
  X,
  Shield,
  Sparkles,
  Wallet,
  ExternalLink,
  Repeat,
  Check,
} from 'lucide-react-native';
import { SubscriptionPlan } from '../types';
import {
  getSubscriptionPlans,
  activateSubscriptionWithWalletApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    user,
    role,
    token,
    isSubscribed,
    activeSubscription,
    daysRemaining,
    formattedEndDate,
    refreshUserData,
  } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [useWallet, setUseWallet] = useState(true);
  const [isAutoPay, setIsAutoPay] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible, role]);

  // Deep Link and AppState listeners for payment return
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (!event.url) return;
      if (event.url.includes('payment-success')) {
        await refreshUserData();
        Alert.alert(
          '🎉 Payment Verified!',
          'Your membership has been activated and validity successfully stacked!'
        );
        onClose();
        if (onSuccess) onSuccess();
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && visible) {
        await refreshUserData();
      }
    });

    return () => {
      linkSub.remove();
      appStateSub.remove();
    };
  }, [visible]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const targetRole = role === 'LENDER' ? 'LENDER' : 'VENDOR';
      const plansList = await getSubscriptionPlans(targetRole);
      if (Array.isArray(plansList) && plansList.length > 0) {
        setPlans(plansList);
        const popular = plansList.find((p: any) => p.isPopular) || plansList[0];
        setSelectedPlanId(popular.id);
      }
    } catch (e) {
      console.error('Failed to load subscription plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const walletBalance = user?.walletBalance || 0;
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const appliedWalletDeduction = useWallet ? Math.min(walletBalance, basePrice) : 0;
  const finalPayable = Math.max(0, basePrice - appliedWalletDeduction);

  const handleActivate = async () => {
    if (!selectedPlan) return;

    // 1. If 100% covered by wallet balance (₹0 payable)
    if (useWallet && appliedWalletDeduction >= basePrice && basePrice > 0) {
      setPurchasing(true);
      try {
        const res = await activateSubscriptionWithWalletApi(selectedPlan.id);
        if (res?.success) {
          await refreshUserData();
          Alert.alert(
            '🎉 Plan Activated!',
            `Your ${selectedPlan.name} is now active with validity stacking!`
          );
          onClose();
          if (onSuccess) onSuccess();
        } else {
          Alert.alert('Activation Failed', res?.message || 'Failed to activate with wallet.');
        }
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Error activating plan.');
      } finally {
        setPurchasing(false);
      }
      return;
    }

    // 2. Online Razorpay Checkout
    try {
      const checkoutUrl = `https://justpaisa.in/checkout?token=${encodeURIComponent(
        token || ''
      )}&planId=${encodeURIComponent(selectedPlan.id)}&isAutoPay=${isAutoPay}&useWallet=${useWallet}`;

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        await Linking.openURL(`https://justpaisa.in`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Unable to open payment gateway. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.crownIconBg}>
                <Crown size={22} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>VIP Membership</Text>
                <Text style={styles.headerSub}>0% Commission • Unlimited Financer Discovery</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Active Validity Stacking Info */}
          {isSubscribed && daysRemaining > 0 ? (
            <View style={styles.activePlanBanner}>
              <View style={styles.activePlanBannerHeader}>
                <Crown size={16} color="#047857" />
                <Text style={styles.activePlanBannerTitle}>
                  VIP Active: {daysRemaining} Days Remaining
                </Text>
              </View>
              <Text style={styles.activePlanBannerSub}>
                Valid until {formattedEndDate || 'Active'}. Any new plan purchased will stack and add extra days on top!
              </Text>
            </View>
          ) : (
            <View style={styles.stackBadge}>
              <Sparkles size={16} color="#d97706" />
              <Text style={styles.stackBadgeText}>
                Validity Stacking Enabled: Extra purchased days are added directly to your account!
              </Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#003893" />
              <Text style={styles.loaderText}>Loading verified plans...</Text>
            </View>
          ) : (
            <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
              {/* Plans List */}
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                    onPress={() => setSelectedPlanId(p.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.planName}>{p.name}</Text>
                          {p.isPopular && (
                            <View style={styles.popularTag}>
                              <Text style={styles.popularTagText}>POPULAR</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planDuration}>+{p.durationDays} Days Stacked Validity</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceCurrency}>₹</Text>
                        <Text style={styles.priceAmount}>{p.price}</Text>
                      </View>
                    </View>

                    {p.features && p.features.length > 0 && (
                      <View style={styles.featureList}>
                        {p.features.slice(0, 3).map((f, i) => (
                          <View key={i} style={styles.featureItem}>
                            <CheckCircle2 size={13} color="#059669" />
                            <Text style={styles.featureText}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Wallet Balance & AutoPay Options */}
              {selectedPlan && (
                <View style={styles.optionsCard}>
                  {/* Wallet Toggle */}
                  <View style={styles.optionRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Wallet size={18} color="#003893" />
                      <View>
                        <Text style={styles.optionLabel}>Use Wallet Balance</Text>
                        <Text style={styles.optionSub}>
                          Available: ₹{walletBalance} (Deducts ₹{appliedWalletDeduction})
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={useWallet && walletBalance > 0}
                      onValueChange={setUseWallet}
                      disabled={walletBalance <= 0}
                      trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                      thumbColor={useWallet && walletBalance > 0 ? '#003893' : '#f1f5f9'}
                    />
                  </View>

                  {/* AutoPay Toggle */}
                  <View style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Repeat size={18} color="#059669" />
                      <View>
                        <Text style={styles.optionLabel}>Enable AutoPay</Text>
                        <Text style={styles.optionSub}>Auto-renews when current validity expires</Text>
                      </View>
                    </View>
                    <Switch
                      value={isAutoPay}
                      onValueChange={setIsAutoPay}
                      trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                      thumbColor={isAutoPay ? '#059669' : '#f1f5f9'}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Action */}
          <View style={styles.footer}>
            {selectedPlan && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Payable:</Text>
                <Text style={styles.summaryPrice}>₹{finalPayable}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.buyBtn, purchasing && styles.buyBtnDisabled]}
              onPress={handleActivate}
              disabled={purchasing || loading || !selectedPlan}
              activeOpacity={0.85}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : finalPayable === 0 ? (
                <>
                  <Check size={18} color="#ffffff" />
                  <Text style={styles.buyBtnText}>Activate with Wallet (₹0 to pay)</Text>
                </>
              ) : (
                <>
                  <Zap size={18} color="#ffffff" />
                  <Text style={styles.buyBtnText}>Pay ₹{finalPayable} Online & Activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  activePlanBanner: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 14,
  },
  activePlanBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  activePlanBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  activePlanBannerSub: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
    lineHeight: 16,
  },
  stackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  stackBadgeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  loaderContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  plansList: {
    maxHeight: 380,
  },
  planCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 10,
  },
  planCardSelected: {
    borderColor: '#003893',
    backgroundColor: '#eff6ff',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  popularTag: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  planDuration: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 15,
    fontWeight: '800',
    color: '#003893',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#003893',
  },
  featureList: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  optionsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  optionSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  footer: {
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#003893',
  },
  buyBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
