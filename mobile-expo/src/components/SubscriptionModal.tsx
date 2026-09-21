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
import { WebView } from 'react-native-webview';
import { SubscriptionPlan } from '../types';
import {
  getSubscriptionPlans,
  activateSubscriptionWithWalletApi,
  createRazorpayPaymentSessionApi,
  verifyRazorpayPaymentApi,
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
  const [isAutoPay, setIsAutoPay] = useState(true);
  const [razorpaySession, setRazorpaySession] = useState<any>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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

    // 2. Direct In-App Razorpay Checkout
    setPurchasing(true);
    try {
      const sessionRes = await createRazorpayPaymentSessionApi(
        selectedPlan.id,
        isAutoPay,
        undefined,
        useWallet
      );

      if (!sessionRes || !sessionRes.success) {
        Alert.alert('Payment Error', sessionRes?.message || 'Failed to initialize Razorpay checkout.');
        return;
      }

      setRazorpaySession(sessionRes);
      setShowRazorpayModal(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Unable to open payment gateway.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'PAYMENT_SUCCESS') {
        setShowRazorpayModal(false);
        setVerifyingPayment(true);
        try {
          const verifyRes = await verifyRazorpayPaymentApi({
            razorpay_order_id: msg.data.razorpay_order_id,
            razorpay_payment_id: msg.data.razorpay_payment_id,
            razorpay_signature: msg.data.razorpay_signature,
            razorpay_subscription_id: msg.data.razorpay_subscription_id || razorpaySession?.subscriptionId,
            planId: selectedPlan?.id || '',
            isAutoPay,
            useWallet,
            walletAmountUsed: appliedWalletDeduction,
          });

          if (verifyRes.success) {
            await refreshUserData();
            Alert.alert(
              '🎉 Payment Verified!',
              `Your ${selectedPlan?.name || 'VIP'} membership is active with stacked validity!`
            );
            onClose();
            if (onSuccess) onSuccess();
          } else {
            Alert.alert('Payment Received', verifyRes.message || 'Account status updated.');
            await refreshUserData();
            onClose();
          }
        } catch (verErr: any) {
          await refreshUserData();
          onClose();
        } finally {
          setVerifyingPayment(false);
        }
      } else if (msg.type === 'PAYMENT_DISMISSED') {
        setShowRazorpayModal(false);
      } else if (msg.type === 'PAYMENT_FAILED') {
        setShowRazorpayModal(false);
        Alert.alert('Payment Failed', msg.data?.description || 'Transaction was not completed.');
      } else if (msg.type === 'PAYMENT_ERROR') {
        setShowRazorpayModal(false);
        Alert.alert('Payment Error', msg.message || 'Error communicating with Razorpay.');
      }
    } catch (e) {
      console.warn('WebView parse error:', e);
    }
  };

  const getRazorpayHtml = (session: any) => {
    if (!session || !selectedPlan) return '';
    const key = session.keyId || 'rzp_test_TUjAguyFqbDjNk';
    const isSubMode = session.mode === 'subscription' && !!session.subscriptionId;
    const effectiveAmount = session.amountPaise || Math.round(finalPayable * 100);

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 16px;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
      text-align: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top: 4px solid #38bdf8;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 0.9s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .title {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .sub {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #064e3b;
      color: #34d399;
      font-size: 11px;
      font-weight: 700;
    }
    .open-btn {
      margin-top: 20px;
      width: 100%;
      padding: 14px;
      background: #0284c7;
      color: #fff;
      font-weight: 800;
      border-radius: 12px;
      border: none;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <div class="title">Opening Razorpay Checkout...</div>
    <div class="sub">Please complete your payment securely on the Razorpay screen.</div>
    <div class="badge">🔒 256-bit Encrypted Payment</div>
    <button class="open-btn" id="retryBtn" style="display:none;" onclick="openRzp()">Re-Open Payment</button>
  </div>

  <script>
    var rzpInstance = null;

    function openRzp() {
      try {
        var options = {
          key: ${JSON.stringify(key)},
          name: "JustPaisa Money App",
          description: ${JSON.stringify(`${selectedPlan.name} Membership`)},
          image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          prefill: {
            name: ${JSON.stringify(user?.name || 'Business Partner')},
            email: ${JSON.stringify(user?.email || 'user@justpaisa.shop')},
            contact: ${JSON.stringify(user?.phone || '9876543210')}
          },
          theme: {
            color: ${JSON.stringify(role === 'LENDER' ? '#007a33' : '#003893')}
          },
          handler: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_SUCCESS',
              data: response
            }));
          },
          modal: {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_DISMISSED'
              }));
            }
          }
        };

        if (${JSON.stringify(isSubMode)}) {
          options.subscription_id = ${JSON.stringify(session.subscriptionId)};
        } else {
          options.order_id = ${JSON.stringify(session.orderId)};
          options.amount = ${JSON.stringify(effectiveAmount)};
          options.currency = "INR";
        }

        rzpInstance = new Razorpay(options);
        rzpInstance.on('payment.failed', function(resp) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            data: resp.error
          }));
        });
        rzpInstance.open();
      } catch (err) {
        document.getElementById('retryBtn').style.display = 'block';
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_ERROR',
          message: err.message || 'Error launching Razorpay'
        }));
      }
    }

    window.onload = function() {
      setTimeout(openRzp, 300);
    };
  </script>
</body>
</html>`;
  };

  return (
    <>
      <Modal
        visible={visible && !showRazorpayModal}
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
              <View style={styles.stackingNoticeBanner}>
                <Sparkles size={16} color="#d97706" />
                <Text style={styles.stackingNoticeText}>
                  <Text style={{ fontWeight: '800' }}>Validity Stacking Enabled:</Text> Extra purchased days are added directly to your account!
                </Text>
              </View>
            )}

            {/* Plans List */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#003893" />
                <Text style={styles.loadingText}>Loading membership plans...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.plansScroll}
                showsVerticalScrollIndicator={false}
              >
                {plans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        isSelected && styles.planCardSelected,
                      ]}
                      onPress={() => setSelectedPlanId(plan.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.planCardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                              {plan.name}
                            </Text>
                            {plan.isPopular && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>POPULAR</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.planDuration}>
                            +{plan.durationDays} Days Stacked Validity
                          </Text>
                        </View>
                        <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                          ₹{plan.price}
                        </Text>
                      </View>

                      {plan.features && plan.features.length > 0 && (
                        <View style={styles.featuresList}>
                          {plan.features.map((feat, idx) => (
                            <View key={idx} style={styles.featureItem}>
                              <CheckCircle2 size={13} color="#059669" />
                              <Text style={styles.featureText}>{feat}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Options: Wallet deduction & AutoPay */}
            <View style={styles.optionsContainer}>
              {walletBalance > 0 && (
                <View style={styles.optionRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Wallet size={16} color="#003893" />
                    <View>
                      <Text style={styles.optionLabel}>Use Wallet Balance</Text>
                      <Text style={styles.optionSub}>
                        Available: ₹{walletBalance} (Deducts ₹{appliedWalletDeduction})
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={useWallet}
                    onValueChange={setUseWallet}
                    trackColor={{ false: '#cbd5e1', true: '#003893' }}
                  />
                </View>
              )}

              <View style={[styles.optionRow, { borderTopWidth: walletBalance > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Repeat size={16} color="#059669" />
                  <View>
                    <Text style={styles.optionLabel}>Enable AutoPay</Text>
                    <Text style={styles.optionSub}>Auto-renews when current validity expires</Text>
                  </View>
                </View>
                <Switch
                  value={isAutoPay}
                  onValueChange={setIsAutoPay}
                  trackColor={{ false: '#cbd5e1', true: '#059669' }}
                />
              </View>
            </View>

            {/* Price Breakdown and Checkout Button */}
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Payable:</Text>
                <Text style={styles.summaryPrice}>
                  ₹{finalPayable}
                  {appliedWalletDeduction > 0 && (
                    <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>
                      {' '}(₹{appliedWalletDeduction} saved from wallet)
                    </Text>
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.buyBtn, (!selectedPlan || purchasing) && styles.buyBtnDisabled]}
                onPress={handleActivate}
                disabled={!selectedPlan || purchasing}
                activeOpacity={0.85}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : finalPayable === 0 ? (
                  <>
                    <Check size={18} color="#ffffff" />
                    <Text style={styles.buyBtnText}>Activate ₹0 Instantly from Wallet</Text>
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

      {/* IN-APP RAZORPAY CHECKOUT WEBVIEW MODAL */}
      <Modal
        visible={showRazorpayModal && !!razorpaySession}
        animationType="slide"
        onRequestClose={() => setShowRazorpayModal(false)}
      >
        <View style={styles.webContainer}>
          <View style={styles.webHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="#10b981" />
              <Text style={styles.webHeaderTitle}>Razorpay Secure Checkout</Text>
            </View>
            <TouchableOpacity
              style={styles.webCloseBtn}
              onPress={() => setShowRazorpayModal(false)}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <WebView
            originWhitelist={['*']}
            source={{
              html: getRazorpayHtml(razorpaySession),
              baseUrl: 'https://justpaisa.in',
            }}
            onMessage={handleWebViewMessage}
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (
                url.startsWith('https://justpaisa.in') ||
                url.startsWith('https://api.razorpay.com') ||
                url.startsWith('https://checkout.razorpay.com') ||
                url.startsWith('about:blank') ||
                url.startsWith('data:')
              ) {
                return true;
              }

              // Handle UPI apps & custom schemes natively
              if (
                url.startsWith('upi://') ||
                url.startsWith('phonepe://') ||
                url.startsWith('paytmmp://') ||
                url.startsWith('gpay://') ||
                url.startsWith('tez://') ||
                url.startsWith('intent://')
              ) {
                Linking.openURL(url).catch((err) => {
                  console.warn('Could not launch payment app:', err);
                });
                return false;
              }

              return true;
            }}
            renderLoading={() => (
              <View style={styles.webLoaderBox}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.webLoaderText}>Connecting to Razorpay...</Text>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* VERIFYING PAYMENT MODAL OVERLAY */}
      {verifyingPayment && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.verifyingOverlay}>
            <View style={styles.verifyingCard}>
              <ActivityIndicator size="large" color="#003893" />
              <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
              <Text style={styles.verifyingSub}>Confirming signature and stacking validity</Text>
            </View>
          </View>
        </Modal>
      )}
    </>
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
    marginBottom: 12,
  },
  activePlanBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activePlanBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  activePlanBannerSub: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '500',
    lineHeight: 16,
  },
  stackingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 12,
  },
  stackingNoticeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  plansScroll: {
    maxHeight: 280,
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  planCardSelected: {
    borderColor: '#003893',
    backgroundColor: '#f8fafc',
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  planNameSelected: {
    color: '#003893',
  },
  popularBadge: {
    backgroundColor: '#f59e0b',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  planDuration: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  planPriceSelected: {
    color: '#003893',
  },
  featuresList: {
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  optionsContainer: {
    backgroundColor: '#f8fafc',
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
  webContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 44,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  webHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  webCloseBtn: {
    padding: 6,
    backgroundColor: '#334155',
    borderRadius: 16,
  },
  webLoaderBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  webLoaderText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  verifyingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  verifyingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '85%',
    maxWidth: 320,
  },
  verifyingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifyingSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
});
