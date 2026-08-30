import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import {
  fetchSubscriptionPlans,
  safeSetLocalStorage,
  checkSubscriptionStatus,
  createRazorpayPaymentSession,
  verifyRazorpayPayment,
  getRazorpayKey,
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
  const [isAutoPay, setIsAutoPay] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loadingActiveSub, setLoadingActiveSub] = useState(false);

  const loadPlans = () => {
    fetchSubscriptionPlans(userRole).then((data) => {
      setPlans(data);
      if (data.length > 0) {
        const popular = data.find((p) => p.isPopular) || data[1] || data[0];
        setSelectedPlan(popular);
      }
    });
  };

  const loadActiveSub = async () => {
    setLoadingActiveSub(true);
    try {
      const res = await checkSubscriptionStatus();
      if (res.isActive && res.subscription) {
        setActiveSub(res.subscription);
      } else {
        setActiveSub(null);
      }
    } catch {
      setActiveSub(null);
    } finally {
      setLoadingActiveSub(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      loadActiveSub();
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [userRole, isOpen]);

  useEffect(() => {
    window.addEventListener('sbni_subscription_plans_updated', loadPlans);
    return () => window.removeEventListener('sbni_subscription_plans_updated', loadPlans);
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
      const session = await createRazorpayPaymentSession(planToSubscribe.id, isAutoPay, appliedCoupon);

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
        name: 'SBNI Money',
        description: isAutoPay
          ? `${planToSubscribe.name} Auto-Renewal Subscription`
          : `${planToSubscribe.name} Subscription`,
        image: '/favicon.png',
        prefill: {
          name: user.name || user.fullName || 'Member',
          email: user.email || 'customer@sbnimoney.com',
          contact: user.phone || user.mobileNumber || '9999999999',
        },
        theme: {
          color: userRole === 'LENDER' ? '#059669' : '#003893',
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_subscription_id: response.razorpay_subscription_id || session.subscriptionId,
              planId: planToSubscribe.id,
              couponCode: appliedCoupon,
              isAutoPay,
            };

            const verifyRes = await verifyRazorpayPayment(verificationPayload);

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

  const calculatedPrice = selectedPlan
    ? Math.max(0, selectedPlan.price - (selectedPlan.price * discountPercent) / 100)
    : 0;

  const isLender = userRole === 'LENDER';

  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const daysRemaining = activeSub?.endDate
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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
                <div className="flex flex-wrap items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <CalendarCheck className="w-3 h-3 text-slate-400" />
                    Started: {formatDate(activeSub.startDate || activeSub.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Valid Until: {formatDate(activeSub.endDate)}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`shrink-0 px-4 py-2 rounded-xl text-center text-xs font-extrabold border ${
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
              {isLender
                ? 'Business Money Financer Subscription'
                : 'Small Shop & Startup Business Unlock Subscription'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-heading">
            Choose Your{' '}
            <span className={isLender ? 'text-[#059669]' : 'text-[#003893]'}>
              {isLender ? 'Business Money Financer Verification' : 'Small Shop & Startup Business Discovery'} Plan
            </span>
          </h2>

          <p className="text-xs text-slate-600 font-medium">
            {isLender
              ? 'Unlock unlimited shop business verifications, full KYC reports, GST documents, and direct shop owner access.'
              : 'Unlock direct phone numbers, WhatsApp connect, and verified financer details. Zero middleman fees.'}
          </p>
        </div>

        {/* 5 Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const planPrice = Math.max(0, plan.price - (plan.price * discountPercent) / 100);
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`cursor-pointer rounded-2xl p-3 sm:p-3.5 border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? isLender
                      ? 'bg-emerald-50/70 border-2 border-[#059669] shadow-lg shadow-emerald-500/10 scale-[1.02]'
                      : 'bg-blue-50/70 border-2 border-[#003893] shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="absolute -top-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {plan.isPopular && (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                      Most Popular
                    </span>
                  )}

                  {plan.isBestValue && (
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                      ✨ Best Value
                    </span>
                  )}
                </div>

                <div>
                  <div
                    className={`text-[9px] font-extrabold uppercase tracking-widest mb-0.5 ${
                      isLender ? 'text-[#059669]' : 'text-[#003893]'
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
                      isSelected
                        ? isLender
                          ? 'bg-[#059669] hover:bg-[#047857] text-white ring-2 ring-emerald-300'
                          : 'bg-[#003893] hover:bg-[#002d78] text-white ring-2 ring-blue-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{loading && selectedPlan?.id === plan.id ? 'Connecting...' : `Pay ₹${planPrice} Now`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── AUTOPAY & COUPON SECTION ──────────────────────────────── */}
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
              <span className="inline-flex items-center gap-0.5 text-slate-400">
                <Lock className="w-3 h-3" /> 256-Bit Razorpay Secure
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading flex items-baseline gap-2">
              <span>₹{calculatedPrice}</span>
              <span className="text-xs text-slate-400 font-normal">
                {isAutoPay ? 'per cycle • AutoPay' : 'one-time'}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe()}
            disabled={loading}
            className={`w-full sm:w-auto py-3 px-8 text-xs sm:text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              isLender
                ? 'bg-[#059669] hover:bg-[#047857] text-white'
                : 'bg-[#003893] hover:bg-[#002d78] text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span>
              {loading
                ? 'Opening Razorpay Gateway...'
                : isAutoPay
                ? `Setup AutoPay ₹${calculatedPrice} & Activate ${selectedPlan?.name || 'Plan'}`
                : `Pay ₹${calculatedPrice} with Razorpay & Unlock Contacts`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
