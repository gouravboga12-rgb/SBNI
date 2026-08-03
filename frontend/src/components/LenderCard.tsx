import React, { useState } from 'react';
import { Lender } from '../types';
import { Phone, MessageCircle, CheckCircle2, Star, SendHorizontal, Lock, Building2, ChevronRight, Zap } from 'lucide-react';

interface LenderCardProps {
  lender: Lender;
  onOpenSubscription?: () => void;
  onRequestLoan?: (lender: Lender) => void;
}

export const LenderCard: React.FC<LenderCardProps> = ({ lender, onOpenSubscription, onRequestLoan }) => {
  const [imgError, setImgError] = useState(false);

  const checkSubscription = () => {
    return (
      localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true'
    );
  };

  const handleApplyClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSubscribed = checkSubscription();
    
    if (!isSubscribed) {
      if (onOpenSubscription) {
        onOpenSubscription();
      }
      return;
    }

    if (onRequestLoan) {
      onRequestLoan(lender);
    }
  };

  const isSubscribed = checkSubscription();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300/80 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative overflow-hidden border-l-4 border-l-[#003893]">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-100/60 transition-colors" />

      {/* Left Column: Bank Logo & Details */}
      <div 
        onClick={handleApplyClick}
        className="flex items-start gap-4 flex-1 min-w-0 w-full cursor-pointer z-10"
      >
        
        {/* Institution Brand Avatar / Logo */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/80 p-2 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
          {lender.logoUrl && !imgError ? (
            <img
              src={lender.logoUrl}
              alt={lender.institutionName}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#003893] to-[#001f54] text-white flex items-center justify-center font-extrabold text-sm shadow-inner">
              {lender.institutionName.split(' ').map(n => n[0]).join('').slice(0, 3)}
            </div>
          )}
        </div>

        {/* Institution Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-heading leading-tight truncate group-hover:text-[#003893] transition-colors">
              {lender.institutionName}
            </h3>
            <span className="badge-verified-green">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              Verified Partner
            </span>
          </div>

          <div className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {lender.institutionType}
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-extrabold border border-emerald-200/60">
              Max: ₹{(lender.maxLoanAmount / 100000).toFixed(1)} Lakhs
            </span>
            {lender.minInterestRate && (
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] font-bold border border-blue-100">
                From {lender.minInterestRate}% p.a.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{lender.rating}</span>
              <span className="text-slate-400 font-normal text-[10px]">({lender.reviewCount})</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
              {lender.distanceKm} KM away
            </span>
          </div>

          {/* Loan Category Tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-slate-600 font-semibold">
            {lender.loanCategories.map((cat, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200/70 text-[10px]">
                {cat}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Apply Now & Call/WhatsApp Action Buttons */}
      <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 z-10">
        
        {/* Apply Now Button with Subscription Badge */}
        <button
          type="button"
          onClick={handleApplyClick}
          className="btn-sbni-blue text-xs py-2.5 px-4 font-extrabold justify-center flex-1 sm:flex-initial flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl"
        >
          {isSubscribed ? (
            <>
              <SendHorizontal className="w-4 h-4 text-blue-200" />
              <span>Apply Now</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-amber-300" />
              <span>Apply Now</span>
            </>
          )}
        </button>

        {lender.contactUnlocked || isSubscribed ? (
          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${lender.phone}`}
              className="btn-call-outline text-xs justify-center flex-1 font-bold"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Call</span>
            </a>

            {lender.whatsAppUrl && (
              <a
                href={lender.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp-outline text-xs justify-center flex-1 font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSubscription}
            className="text-[11px] font-extrabold text-blue-900 hover:text-blue-700 py-1 text-center flex items-center justify-center gap-1 transition-colors"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span>Unlock Direct Contact</span>
          </button>
        )}
      </div>

    </div>
  );
};
