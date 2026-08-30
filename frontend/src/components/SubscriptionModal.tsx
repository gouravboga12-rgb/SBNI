import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import {
  fetchSubscriptionPlans,
  safeSetLocalStorage,
  checkSubscriptionStatus,
  createRazorpayPaymentSession,
  verifyRazorpayPayment,
  getRazorpayKey,
  cancelAutoPayApi,
  fetchMyWalletApi,
  activateSubscriptionWithWalletApi,
} from '../services/api';
import {
  Zap,
  Check,
  X,
  Ticket,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Clock,
  AlertCircle,
  Repeat,
  CreditCard,
  Lock,
  Wallet,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
  userRole?: 'VENDOR' | 'LENDER';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionSuccess,
  userRole = 'VENDOR',
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(false);
  const [isAutoPay, setIsAutoPay] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [cancellingAutoPay, setCancellingAutoPay] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loadingActiveSub, setLoadingActiveSub] = useState(false);

  const handleConfirmCancelAutoPay = async () => {
    setCancellingAutoPay(true);
    setErrorMessage('');
    try {
      const res = await cancelAutoPayApi();
      if (res.success) {
        setSuccessMessage(res.message || 'AutoPay cancelled. Your plan remains active until its expiration.');
        setActiveSub((prev: any) => (prev ? { ...prev, isAutoPay: false } : prev));
        setShowCancelConfirm(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(res.message || 'Failed to cancel AutoPay.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error cancelling AutoPay.');
    } finally {
      setCancellingAutoPay(false);
    }
  };

  const selectBestPlan = (plansList: SubscriptionPlan[], currentSub: any) => {
    if (!plansList || plansList.length === 0) return;

    if (currentSub && currentSub.plan) {
      const curPrice = Number(currentSub.plan.price) || 0;
      const curDays = Number(currentSub.plan.durationDays) || 0;
      const curId = currentSub.plan.id;
      const curCode = currentSub.plan.code;
      const curName = currentSub.plan.name?.trim().toLowerCase();

      // Find higher upgrade plans (higher price or longer duration)
      const higherPlans = plansList.filter((p) => {
        const isMatch =
          p.id === curId ||
          (p.code && p.code === curCode) ||
          (p.name && p.name.trim().toLowerCase() === curName);
        if (isMatch) return false;
        return p.price > curPrice || p.durationDays > curDays;
      });

      if (higherPlans.length > 0) {
        // Pick the best value higher plan or next higher price plan
        const recommendedUpgrade =
          higherPlans.find((p) => p.isPopular || p.isBestValue) ||
          [...higherPlans].sort((a, b) => a.price - b.price)[0];
        setSelectedPlan(recommendedUpgrade);
        return;
      } else {
        // Already on top tier plan
        const matchingCurrent = plansList.find(
          (p) => p.id === curId || p.code === curCode || p.name?.trim().toLowerCase() === curName
        );
        setSelectedPlan(matchingCurrent || plansList[plansList.length - 1]);
        return;
      }
    }

    // Default if no active subscription: select popular or first plan
    const popular = plansList.find((p) => p.isPopular) || plansList[1] || plansList[0];
    setSelectedPlan(popular);
  };

  const loadData = async () => {
    setLoadingActiveSub(true);
    try {
      const [plansData, subRes, walletRes] = await Promise.all([
        fetchSubscriptionPlans(userRole),
        checkSubscriptionStatus().catch(() => ({ isActive: false, subscription: null })),
        fetchMyWalletApi().catch(() => ({ success: false, data: null })),
      ]);

      const loadedPlans = Array.isArray(plansData) ? plansData : [];
      setPlans(loadedPlans);

      const currentSub = subRes?.isActive && subRes?.subscription ? subRes.subscription : null;
      setActiveSub(currentSub);
      selectBestPlan(loadedPlans, currentSub);

      if (walletRes?.success && walletRes?.data) {
        const bal = walletRes.data.balance || 0;
        setWalletBalance(bal);
        if (bal > 0) {
          setUseWallet(true);
        }
      }
    } catch {
      setActiveSub(null);
    } finally {
      setLoadingActiveSub(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsAutoPay(true);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [userRole, isOpen]);

  useEffect(() => {
    const handleReload = () => loadData();
    window.addEventListener('sbni_subscription_plans_updated', handleReload);
    return () => window.removeEventListener('sbni_subscription_plans_updated', handleReload);
  }, [userRole]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'WELCOME10') {
      setDiscountPercent(10);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10');
    }
  };

  const getUserDetails = () => {
    try {
      const rawUser = localStorage.getItem('sbni_user');
      if (rawUser) {
        return JSON.parse(rawUser);
      }
    } catch (e) {}
    return {
      name: 'Valued Customer',
      email: 'user@example.com',
      phone: '9876543210',
    };
  };

  const baseDiscountedPrice = selectedPlan
    ? Math.max(0, selectedPlan.price - (selectedPlan.price * discountPercent) / 100)
    : 0;

  const appliedWalletDeduction = useWallet ? Math.min(walletBalance, baseDiscountedPrice) : 0;
  const calculatedPrice = Math.max(0, baseDiscountedPrice - appliedWalletDeduction);

  const handleSubscribe = async (targetPlan?: SubscriptionPlan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const planToSubscribe = targetPlan || selectedPlan;
    if (!planToSubscribe) return;
    if (targetPlan && targetPlan.id !== selectedPlan?.id) {
      setSelectedPlan(targetPlan);
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const appliedCoupon = couponApplied ? couponCode.trim().toUpperCase() : undefined;

      // 1. If 100% covered by wallet balance (₹0 payable)
      if (useWallet && appliedWalletDeduction >= baseDiscountedPrice && baseDiscountedPrice > 0) {
        const walRes = await activateSubscriptionWithWalletApi(planToSubscribe.id, appliedCoupon);
        if (walRes.success) {
          safeSetLocalStorage('sbni_subscribed', 'true');
          safeSetLocalStorage('sbni_vendor_subscribed', 'true');
          safeSetLocalStorage('sbni_lender_subscribed', 'true');
          window.dispatchEvent(new Event('sbni_subscription_updated'));

          setSuccessMessage(`🎉 ${planToSubscribe.name} activated successfully with Wallet Balance!`);
          setTimeout(() => {
            onSubscriptionSuccess();
            onClose();
            setSuccessMessage('');
          }, 1500);
          return;
        } else {
          throw new Error(walRes.message || 'Failed to activate plan with wallet balance.');
        }
      }

      // 2. Standard Razorpay payment or partial wallet deduction session
      const session = await createRazorpayPaymentSession(planToSubscribe.id, isAutoPay, appliedCoupon, useWallet);

      if (!session.success) {
        throw new Error(session.message || 'Unable to initiate payment session. Please try again.');
      }

      // Ensure Razorpay Checkout script is loaded
      if (typeof window.Razorpay === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay payment gateway SDK.'));
          document.body.appendChild(script);
        });
      }

      const user = getUserDetails();
      const rzpKey = session.keyId || (await getRazorpayKey());

      const options: any = {
        key: rzpKey,
        name: 'JustPaisa Money App',
        description: `${planToSubscribe.name} Membership (${isAutoPay ? 'AutoPay' : 'One-time'})`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        prefill: {
          name: user.name || 'Business Partner',
          email: user.email || 'user@justpaisa.shop',
          contact: user.phone || '9876543210',
        },
        theme: {
          color: isLender ? '#059669' : '#003893',
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_subscription_id: response.razorpay_subscription_id || session.subscriptionId,
              planId: planToSubscribe.id,
              couponCode: appliedCoupon,
              isAutoPay,
              useWallet,
              walletAmountUsed: appliedWalletDeduction,
            });

            if (verifyRes.success) {
              safeSetLocalStorage('sbni_subscribed', 'true');
              safeSetLocalStorage('sbni_vendor_subscribed', 'true');
              safeSetLocalStorage('sbni_lender_subscribed', 'true');
              window.dispatchEvent(new Event('sbni_subscription_updated'));

              setSuccessMessage(
                isAutoPay
                  ? `🚀 AutoPay Activated! ${planToSubscribe.name} is now active with auto-renewal.`
                  : `🎉 Payment Successful! ${planToSubscribe.name} is now active.`
              );

              setTimeout(() => {
                onSubscriptionSuccess();
                onClose();
                setSuccessMessage('');
              }, 1500);
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification could not be confirmed.');
            }
          } catch (verErr: any) {
            setErrorMessage(verErr.message || 'Error confirming payment with server.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      if (session.mode === 'subscription' && session.subscriptionId) {
        options.subscription_id = session.subscriptionId;
      } else if (session.orderId) {
        options.order_id = session.orderId;
        options.amount = session.amountPaise;
        options.currency = session.currency || 'INR';
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setLoading(false);
        setErrorMessage(
          response.error?.description || 'Payment was unsuccessful or cancelled. Please try again.'
        );
      });
      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to open payment gateway. Please check your connection.');
    }
  };

  const isLender = userRole === 'LENDER';

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const daysRemaining = activeSub?.endDate
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const curSubPrice = Number(activeSub?.plan?.price) || 0;
  const curSubDays = Number(activeSub?.plan?.durationDays) || 0;
  const curPlanId = activeSub?.plan?.id;
  const curPlanCode = activeSub?.plan?.code;
  const curPlanName = activeSub?.plan?.name?.trim().toLowerCase();

  const isCurrentActivePlan = (plan: SubscriptionPlan) => {
    if (!activeSub?.plan) return false;
    return (
      plan.id === curPlanId ||
      (plan.code && plan.code === curPlanCode) ||
      (plan.name && plan.name.trim().toLowerCase() === curPlanName)
    );
  };

  const isHigherTierPlan = (plan: SubscriptionPlan) => {
    if (!activeSub?.plan || isCurrentActivePlan(plan)) return false;
    return plan.price > curSubPrice || plan.durationDays > curSubDays;
  };

  const isLowerTierPlan = (plan: SubscriptionPlan) => {
    if (!activeSub?.plan || isCurrentActivePlan(plan)) return false;
    return plan.price < curSubPrice && plan.durationDays <= curSubDays;
  };

  const isUpgrading = !!(activeSub && daysRemaining > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── ACTIVE PLAN BANNER ─────────────────────────────────────── */}
        {loadingActiveSub ? (
          <div className="mb-4 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 font-medium animate-pulse flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Checking your current subscription...
          </div>
        ) : activeSub ? (
          <div
            className={`mb-4 p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              daysRemaining > 3
                ? 'bg-emerald-50 border-emerald-400'
                : daysRemaining > 0
                ? 'bg-amber-50 border-amber-400'
                : 'bg-rose-50 border-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  daysRemaining > 3
                    ? 'bg-emerald-100 text-emerald-700'
                    : daysRemaining > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    daysRemaining > 3
                      ? 'text-emerald-600'
                      : daysRemaining > 0
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {daysRemaining > 0 ? '✅ Current Active Plan' : '⚠️ Plan Expired'}
                </div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {activeSub.plan?.name || 'Subscription Plan'}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <CalendarCheck className="w-3 h-3 text-slate-400" />
                    Started: {formatDate(activeSub.startDate || activeSub.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Valid Until: {formatDate(activeSub.endDate)}
                  </span>
                  {activeSub.isAutoPay ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Repeat className="w-3 h-3 text-emerald-600" /> AutoPay: Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                      AutoPay: Off (Expires {formatDate(activeSub.endDate)})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeSub.isAutoPay && (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancellingAutoPay}
                  className="px-3 py-2 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  {cancellingAutoPay ? 'Cancelling...' : 'Cancel Auto-Renewal'}
                </button>
              )}
              <div
                className={`px-4 py-2 rounded-xl text-center text-xs font-extrabold border ${
                  daysRemaining > 3
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : daysRemaining > 0
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-rose-500 text-white border-rose-600'
                }`}
              >
                {daysRemaining > 0 ? (
                  <>
                    <div className="text-xl font-black leading-none">{daysRemaining}</div>
                    <div className="text-[9px] uppercase tracking-wider">Days Left</div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mx-auto mb-0.5" />
                    <div className="text-[9px]">Renew Now</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-extrabold text-amber-900">No Active Plan</div>
              <div className="text-[10px] text-amber-700 font-medium">
                Choose a plan below to unlock direct phone contacts and WhatsApp connections.
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-4 space-y-1.5 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {isUpgrading
                ? 'Upgrade Your Subscription'
                : isLender
                ? 'Business Money Financer Subscription'
                : 'Small Shop & Startup Business Unlock Subscription'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-heading">
            {isUpgrading ? (
              <>
                Upgrade to a{' '}
                <span className={isLender ? 'text-[#059669]' : 'text-[#003893]'}>
                  Higher {isLender ? 'Financer' : 'Business'} Tier
                </span>
              </>
            ) : (
              <>
                Choose Your{' '}
                <span className={isLender ? 'text-[#059669]' : 'text-[#003893]'}>
                  {isLender ? 'Business Money Financer Verification' : 'Small Shop & Startup Business Discovery'} Plan
                </span>
              </>
            )}
          </h2>

          <p className="text-xs text-slate-600 font-medium">
            {isUpgrading
              ? `You are currently on ${activeSub?.plan?.name || 'an active plan'}. Select a higher tier plan below for extended validity, higher priority, and maximum savings.`
              : isLender
              ? 'Unlock unlimited shop business verifications, full KYC reports, GST documents, and direct shop owner access.'
              : 'Unlock direct phone numbers, WhatsApp connect, and verified financer details. Zero middleman fees.'}
          </p>
        </div>

        {/* 5 Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const planPrice = Math.max(0, plan.price - (plan.price * discountPercent) / 100);
            const isCurrent = isCurrentActivePlan(plan);
            const isHigher = isHigherTierPlan(plan);
            const isLower = isLowerTierPlan(plan);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`cursor-pointer rounded-2xl p-3 sm:p-3.5 border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? isLender
                      ? 'bg-emerald-50/70 border-2 border-[#059669] shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'bg-blue-50/70 border-2 border-[#003893] shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : isCurrent
                    ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400'
                    : isHigher
                    ? 'bg-gradient-to-b from-indigo-50/40 to-slate-50 border-indigo-200 hover:border-indigo-400 hover:shadow-sm'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="absolute -top-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {isCurrent ? (
                    <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Current Plan
                    </span>
                  ) : isHigher && (plan.isBestValue || plan.isPopular) ? (
                    <span className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm flex items-center gap-1">
                      🚀 Recommended Upgrade
                    </span>
                  ) : isHigher ? (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm flex items-center gap-1">
                      ✨ Upgrade Tier
                    </span>
                  ) : plan.isPopular ? (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                      Most Popular
                    </span>
                  ) : plan.isBestValue ? (
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                      ✨ Best Value
                    </span>
                  ) : isLower ? (
                    <span className="bg-slate-200 text-slate-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Lower Tier
                    </span>
                  ) : null}
                </div>

                <div>
                  <div
                    className={`text-[9px] font-extrabold uppercase tracking-widest mb-0.5 ${
                      isCurrent
                        ? 'text-emerald-700'
                        : isHigher
                        ? 'text-indigo-700'
                        : isLender
                        ? 'text-[#059669]'
                        : 'text-[#003893]'
                    }`}
                  >
                    {plan.durationLabel}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-heading mb-1 leading-snug">
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                      ₹{planPrice}
                    </span>
                    {discountPercent > 0 ? (
                      <span className="text-[10px] text-slate-400 line-through">₹{plan.price}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 line-through">₹{plan.originalPrice}</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 mb-2.5 leading-tight min-h-[24px]">
                    {plan.description}
                  </p>

                  <ul className="space-y-1 mb-3">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1 text-[10px] text-slate-700 font-medium leading-tight"
                      >
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-center mt-auto">
                  <button
                    type="button"
                    onClick={(e) => handleSubscribe(plan, e)}
                    disabled={loading}
                    className={`w-full text-xs font-extrabold py-2 px-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      isCurrent && daysRemaining > 0
                        ? isSelected
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                        : isHigher
                        ? isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white ring-2 ring-indigo-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : isSelected
                        ? isLender
                          ? 'bg-[#059669] hover:bg-[#047857] text-white ring-2 ring-emerald-300'
                          : 'bg-[#003893] hover:bg-[#002d78] text-white ring-2 ring-blue-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isCurrent && daysRemaining > 0 ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{loading && selectedPlan?.id === plan.id ? 'Connecting...' : `Current Active Plan`}</span>
                      </>
                    ) : isHigher ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{loading && selectedPlan?.id === plan.id ? 'Connecting...' : `Upgrade for ₹${planPrice}`}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{loading && selectedPlan?.id === plan.id ? 'Connecting...' : `Pay ₹${planPrice} Now`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── AUTOPAY & COUPON & WALLET SECTION ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 flex-shrink-0">
          {/* AutoPay / Recurring Renewal Toggle */}
          <div
            onClick={() => setIsAutoPay(!isAutoPay)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              isAutoPay
                ? isLender
                  ? 'bg-emerald-50/90 border-emerald-500 shadow-sm'
                  : 'bg-blue-50/90 border-blue-500 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isAutoPay
                    ? isLender
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Repeat className={`w-4 h-4 ${isAutoPay ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">Enable AutoPay (Auto-Renew)</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isAutoPay
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    UPI / Card
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Continuous platform access • Cancel or pause anytime in 1-click
                </div>
              </div>
            </div>

            {/* Switch UI */}
            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0 ${
                isAutoPay ? (isLender ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  isAutoPay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Have a Coupon?</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Use code <span className="text-blue-700 font-bold">WELCOME10</span> (10% off)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1.5 rounded-xl uppercase outline-none focus:border-blue-600 w-full sm:w-28 text-center font-bold"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="bg-slate-800 hover:bg-slate-900 text-white py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* ── REFERRAL WALLET BALANCE CARD (If available) ───────────────── */}
        {walletBalance > 0 && (
          <div
            onClick={() => setUseWallet(!useWallet)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 mb-3 ${
              useWallet
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500 shadow-xs ring-1 ring-emerald-400'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  useWallet ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">
                    Apply Referral Wallet Balance
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                    ₹{walletBalance} Available
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  {appliedWalletDeduction > 0
                    ? `Subtracts ₹${appliedWalletDeduction} directly from your plan price`
                    : 'Deducts available referral balance from your checkout'}
                </div>
              </div>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0 ${
                useWallet ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  useWallet ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        )}

        {couponApplied && (
          <div className="text-xs text-emerald-700 font-bold mb-2 text-center">
            ✅ Coupon applied! 10% discount subtracted.
          </div>
        )}
        {couponError && (
          <div className="text-xs text-rose-600 font-bold mb-2 text-center">
            {couponError}
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold text-center text-xs mb-3 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-center text-xs mb-3 animate-bounce">
            {successMessage}
          </div>
        )}

        {/* Modal Checkout Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span>Total Payable Amount:</span>
              {appliedWalletDeduction > 0 && (
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                  -₹{appliedWalletDeduction} Wallet Applied
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-slate-400">
                <Lock className="w-3 h-3" /> 256-Bit Razorpay Secure
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading flex items-baseline gap-2">
              <span>₹{calculatedPrice}</span>
              {appliedWalletDeduction > 0 && (
                <span className="text-xs line-through text-slate-400 font-normal">
                  ₹{baseDiscountedPrice}
                </span>
              )}
              <span className="text-xs text-slate-400 font-normal">
                {calculatedPrice === 0
                  ? '• 100% Free with Wallet'
                  : isAutoPay
                  ? 'per cycle • AutoPay'
                  : 'one-time'}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe()}
            disabled={loading}
            className={`w-full sm:w-auto py-3 px-8 text-xs sm:text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              calculatedPrice === 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : selectedPlan && isHigherTierPlan(selectedPlan)
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white'
                : isLender
                ? 'bg-[#059669] hover:bg-[#047857] text-white'
                : 'bg-[#003893] hover:bg-[#002d78] text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span>
              {loading
                ? 'Processing Activation...'
                : calculatedPrice === 0
                ? `✨ Activate ${selectedPlan?.name || 'Plan'} (Free with Wallet)`
                : selectedPlan && isHigherTierPlan(selectedPlan)
                ? isAutoPay
                  ? `Upgrade to ${selectedPlan.name} • ₹${calculatedPrice} AutoPay`
                  : `Upgrade to ${selectedPlan.name} • Pay ₹${calculatedPrice} Now`
                : selectedPlan && isCurrentActivePlan(selectedPlan) && daysRemaining > 0
                ? `Extend / Renew ${selectedPlan.name} (₹${calculatedPrice})`
                : isAutoPay
                ? `Setup AutoPay ₹${calculatedPrice} & Activate ${selectedPlan?.name || 'Plan'}`
                : `Pay ₹${calculatedPrice} with Razorpay & Unlock Contacts`}
            </span>
          </button>
        </div>

        {/* ── CANCEL AUTOPAY CONFIRMATION MODAL ───────────────────────── */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                  Turn Off Auto-Renewal?
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                  Your subscription will not be charged again. You will continue to have full, uninterrupted platform access until{' '}
                  <span className="font-extrabold text-slate-900">
                    {activeSub?.endDate ? formatDate(activeSub.endDate) : 'the end of your current cycle'}
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancellingAutoPay}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Keep AutoPay
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelAutoPay}
                  disabled={cancellingAutoPay}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  {cancellingAutoPay ? 'Cancelling...' : 'Yes, Turn Off'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
