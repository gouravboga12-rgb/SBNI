import React from 'react';
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  X,
  Building2,
  Lock,
} from 'lucide-react';
import { Lender } from '../types';

interface LenderContactConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lender: Lender;
  actionType: 'CALL' | 'WHATSAPP';
  onConfirm: () => void;
}

export const LenderContactConsentModal: React.FC<LenderContactConsentModalProps> = ({
  isOpen,
  onClose,
  lender,
  actionType,
  onConfirm,
}) => {
  if (!isOpen || !lender) return null;

  const lenderName =
    lender.institutionName && !lender.institutionName.toLowerCase().includes('money financer')
      ? `${lender.institutionName} Money Financer`
      : lender.institutionName || 'Business Money Financer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Close X button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Cancel"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Shield Icon Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <Lock className="w-2.5 h-2.5 text-blue-600" /> Data Sharing Consent
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading leading-tight mt-0.5">
              Connect with Financer
            </h3>
          </div>
        </div>

        {/* Financer Details Card */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5 text-blue-700" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate font-heading">{lenderName}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {lender.city || 'Hyderabad'}, {lender.state || 'Telangana'} • Verified Financer
            </div>
          </div>
        </div>

        {/* Explicit Consent Message */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
          Your details will be shared with <strong className="font-extrabold text-blue-950">{lenderName}</strong> to connect you with the lender and process your enquiry. Do you want to continue?
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center active:scale-95"
          >
            Cancel
          </button>

          {actionType === 'CALL' ? (
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              <span>Continue & Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Continue to WhatsApp</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
