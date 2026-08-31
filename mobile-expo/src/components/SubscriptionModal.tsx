import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Crown, CheckCircle2, Zap, X, Shield, Sparkles } from 'lucide-react-native';
import { SubscriptionPlan } from '../types';
import { getSubscriptionPlans, purchasePlanWithWallet } from '../services/api';
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
  const { user, role, refreshUserData } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible, role]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await getSubscriptionPlans(role);
      if (res?.data && res.data.length > 0) {
        setPlans(res.data);
        const popular = res.data.find((p: any) => p.isPopular) || res.data[0];
        setSelectedPlanId(popular.id);
      }
    } catch (e) {
      console.error('Failed to load subscription plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    if ((user?.walletBalance || 0) < plan.price) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `This plan costs ₹${plan.price}. Your current balance is ₹${user?.walletBalance || 0}. Please add money or use online checkout.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay Online (Web)',
            onPress: () => {
              Alert.alert('Online Payment', 'Redirecting to secure payment checkout gateway...');
            },
          },
        ]
      );
      return;
    }

    setPurchasing(true);
    try {
      const res = await purchasePlanWithWallet(plan.id);
      if (res?.success) {
        await refreshUserData();
        Alert.alert('🎉 Subscription Activated!', `Your ${plan.name} has been activated with stacked validity!`);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Error', res?.message || 'Failed to activate plan.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to process transaction.');
    } finally {
      setPurchasing(false);
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
                <Text style={styles.headerTitle}>Membership Plans</Text>
                <Text style={styles.headerSub}>Unlock direct contacts with 0% commission</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Stacking Validity Badge */}
          <View style={styles.stackBadge}>
            <Sparkles size={16} color="#d97706" />
            <Text style={styles.stackBadgeText}>
              Validity Stacking Active: Purchased days are added directly on top of your remaining days!
            </Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#003893" />
              <Text style={styles.loaderText}>Loading verified plans...</Text>
            </View>
          ) : (
            <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => setSelectedPlanId(p.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planCardTop}>
                      <View>
                        <Text style={styles.planName}>{p.name}</Text>
                        <Text style={styles.planDuration}>{p.durationDays} Days Full Access</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceCurrency}>₹</Text>
                        <Text style={styles.priceAmount}>{p.price}</Text>
                      </View>
                    </View>

                    {p.features && p.features.length > 0 && (
                      <View style={styles.featureList}>
                        {p.features.map((f, i) => (
                          <View key={i} style={styles.featureItem}>
                            <CheckCircle2 size={14} color="#059669" />
                            <Text style={styles.featureText}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.buyBtn, purchasing && styles.buyBtnDisabled]}
              onPress={handlePurchase}
              disabled={purchasing || loading}
              activeOpacity={0.85}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Zap size={18} color="#ffffff" />
                  <Text style={styles.buyBtnText}>Activate Plan Now</Text>
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
    padding: 22,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
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
    marginBottom: 16,
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
    padding: 16,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: '#003893',
    backgroundColor: '#eff6ff',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  planDuration: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003893',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#003893',
  },
  featureList: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  footer: {
    marginTop: 16,
  },
  buyBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
