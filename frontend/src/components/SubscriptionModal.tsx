import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import { fetchSubscriptionPlans } from '../services/api';
import { Zap, Check, Lock, X, ShieldCheck, Ticket, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    fetchSubscriptionPlans(userRole).then((data) => {
      setPlans(data);
      if (data.length > 0) {
        const popular = data.find((p) => p.isPopular) || data[1] || data[0];
        setSelectedPlan(popular);
      }
    });
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

  const handleSubscribe = (targetPlan?: SubscriptionPlan, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const planToSubscribe = targetPlan || selectedPlan;
    if (!planToSubscribe) return;
    if (targetPlan && targetPlan.id !== selectedPlan?.id) {
      setSelectedPlan(targetPlan);
    }

    setLoading(true);

    setTimeout(() => {
      if (userRole === 'LENDER') {
        localStorage.setItem('sbni_lender_subscribed', 'true');
      } else {
        localStorage.setItem('sbni_vendor_subscribed', 'true');
      }
      localStorage.setItem('sbni_subscribed', 'true');
      setLoading(false);
      setSuccessMessage(`🎉 Subscription Activated! ${planToSubscribe.name} is now active.`);
      setTimeout(() => {
        onSubscriptionSuccess();
        onClose();
        setSuccessMessage('');
      }, 1400);
    }, 1200);
  };

  const calculatedPrice = selectedPlan
    ? Math.max(0, selectedPlan.price - (selectedPlan.price * discountPercent) / 100)
    : 0;

  const isLender = userRole === 'LENDER';

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

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-4 space-y-1.5 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{isLender ? 'Lender Access Subscription' : 'Small Shop Business Unlock Subscription'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-heading">
            Choose Your <span className={isLender ? 'text-[#059669]' : 'text-[#003893]'}>{isLender ? 'Lender Verification' : 'Small Shop Business Discovery'} Plan</span>
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
                {plan.isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                    Most Popular
                  </span>
                )}

                {plan.isBestValue && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                    Best Value
                  </span>
                )}

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
