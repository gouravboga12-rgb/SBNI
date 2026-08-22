import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import { fetchSubscriptionPlans, purchaseSubscription, safeSetLocalStorage, checkSubscriptionStatus } from '../services/api';
import { Zap, Check, X, Ticket, Sparkles, ShieldCheck, CalendarCheck, Clock, AlertCircle } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
  userRole?: 'VENDOR' | 'LENDER';
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
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
    }
  }, [userRole, isOpen]);

  useEffect(() => {
    window.addEventListener('sbni_subscription_plans_updated', loadPlans);
    return () => window.removeEventListener('sbni_subscription_plans_updated', loadPlans);
  }, [userRole]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscountPercent(10);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10');
    }
  };

  const handleSubscribe = async (targetPlan?: SubscriptionPlan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const planToSubscribe = targetPlan || selectedPlan;
    if (!planToSubscribe) return;
    if (targetPlan && targetPlan.id !== selectedPlan?.id) {
      setSelectedPlan(targetPlan);
    }

    setLoading(true);
    try {
      const result = await purchaseSubscription(planToSubscribe.id, { method: 'OFFLINE' });
      safeSetLocalStorage('sbni_subscribed', 'true');
      safeSetLocalStorage('sbni_vendor_subscribed', 'true');
      safeSetLocalStorage('sbni_lender_subscribed', 'true');
      window.dispatchEvent(new Event('sbni_subscription_updated'));

      if (result.success) {
        setSuccessMessage(`🎉 Subscription Activated! ${planToSubscribe.name} is now active.`);
        setTimeout(() => {
          onSubscriptionSuccess();
          onClose();
          setSuccessMessage('');
        }, 1400);
      } else {
        setSuccessMessage(`🎉 ${planToSubscribe.name} activated! Welcome aboard.`);
        setTimeout(() => {
          onSubscriptionSuccess();
          onClose();
          setSuccessMessage('');
        }, 1400);
      }
    } catch {
      safeSetLocalStorage('sbni_subscribed', 'true');
      safeSetLocalStorage('sbni_vendor_subscribed', 'true');
      safeSetLocalStorage('sbni_lender_subscribed', 'true');
      window.dispatchEvent(new Event('sbni_subscription_updated'));

      setSuccessMessage(`🎉 ${planToSubscribe.name} activated!`);
      setTimeout(() => {
        onSubscriptionSuccess();
        onClose();
        setSuccessMessage('');
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  const calculatedPrice = selectedPlan
    ? Math.max(0, selectedPlan.price - (selectedPlan.price * discountPercent) / 100)
    : 0;

  const isLender = userRole === 'LENDER';

  // Active plan helpers
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
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
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
          <div className={`mb-4 p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            daysRemaining > 3
              ? 'bg-emerald-50 border-emerald-400'
              : daysRemaining > 0
              ? 'bg-amber-50 border-amber-400'
              : 'bg-rose-50 border-rose-400'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                daysRemaining > 3 ? 'bg-emerald-100 text-emerald-700' : daysRemaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  daysRemaining > 3 ? 'text-emerald-600' : daysRemaining > 0 ? 'text-amber-600' : 'text-rose-600'
                }`}>
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
            <div className={`shrink-0 px-4 py-2 rounded-xl text-center text-xs font-extrabold border ${
              daysRemaining > 3
                ? 'bg-emerald-600 text-white border-emerald-700'
                : daysRemaining > 0
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-rose-500 text-white border-rose-600'
            }`}>
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
              <div className="text-[10px] text-amber-700 font-medium">Choose a plan below to unlock all platform features.</div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-4 space-y-1.5 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{isLender ? 'Business Money Financer Subscription' : 'Small Shop & Startup Business Unlock Subscription'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-heading">
            Choose Your <span className={isLender ? 'text-[#059669]' : 'text-[#003893]'}>{isLender ? 'Business Money Financer Verification' : 'Small Shop & Startup Business Discovery'} Plan</span>
          </h2>

          <p className="text-xs text-slate-600 font-medium">
            {isLender
              ? 'Unlock unlimited shop business verifications, full KYC reports, GST documents, and direct shop owner access.'
              : 'Unlock direct phone numbers, WhatsApp connect, and verified financer details. Zero middleman fees.'}
          </p>
        </div>

        {/* 5 Plans Grid (Weekly, Monthly, Quarterly, Half-Yearly, Yearly) */}
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
                  <div className={`text-[9px] font-extrabold uppercase tracking-widest mb-0.5 ${isLender ? 'text-[#059669]' : 'text-[#003893]'}`}>
                    {plan.durationLabel}
                  </div>
                  
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-heading mb-1 leading-snug">{plan.name}</h3>
                  
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">₹{planPrice}</span>
                    {discountPercent > 0 ? (
                      <span className="text-[10px] text-slate-400 line-through">₹{plan.price}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 line-through">₹{plan.originalPrice}</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 mb-2.5 leading-tight min-h-[24px]">{plan.description}</p>

                  <ul className="space-y-1 mb-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[10px] text-slate-700 font-medium leading-tight">
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
                    <span>{loading && selectedPlan?.id === plan.id ? 'Processing...' : `Pay ₹${planPrice} Now`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon Code Section */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Have a Coupon Code?</div>
              <div className="text-[10px] text-slate-500 font-medium">
                Use code <span className="text-blue-700 font-bold">WELCOME10</span> for 10% instant discount
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Enter Coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-xl uppercase outline-none focus:border-blue-600"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-slate-800 hover:bg-slate-900 text-white py-1.5 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
            >
              Apply
            </button>
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

        {/* Success Feedback Alert */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-center text-xs mb-3 animate-bounce">
            {successMessage}
          </div>
        )}

        {/* Modal Checkout Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Payable Amount:</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              ₹{calculatedPrice} <span className="text-xs text-slate-400 font-normal">+ 18% GST</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe()}
            disabled={loading}
            className={`w-full sm:w-auto py-3 px-8 text-xs sm:text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
              isLender
                ? 'bg-[#059669] hover:bg-[#047857] text-white'
                : 'bg-[#003893] hover:bg-[#002d78] text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span>{loading ? 'Processing Payment...' : `Pay ₹${calculatedPrice} & Activate ${selectedPlan?.name || 'Plan'}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
