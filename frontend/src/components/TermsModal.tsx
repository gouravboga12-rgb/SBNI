import React from 'react';
import { FileText, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 my-auto max-h-[85vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">Terms & Privacy Policy</h2>
            <p className="text-xs text-slate-500 font-medium">Just Paisa App Platform Terms of Service & Privacy Policy</p>
          </div>
        </div>

        {/* Policy Content Scroll View */}
        <div className="overflow-y-auto space-y-4 text-xs text-slate-600 pr-2 leading-relaxed">
          <section className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Platform Nature & Direct Marketplace
            </h3>
            <p>
              Just Paisa App connects verified Vendors directly with Nationalized Banks, NBFCs, and Private Lenders. Just Paisa App operates as a direct listing technology platform and does not charge any hidden middleman commission on credit approvals.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              2. Data Privacy & Compliance
            </h3>
            <p>
              All GST numbers, Aadhaar details, PAN cards, and business financial documents uploaded during digital KYC verification are encrypted with 256-bit SSL encryption. Data is shared exclusively with partner financial institutions upon your explicit request.
            </p>
          </section>

          <section className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" />
              3. Subscription Terms & Duration Tiers
            </h3>
            <p>
              Subscription plans (Weekly, Monthly, Quarterly, Half-Yearly, Yearly) grant access to unlocked lender contact details, instant verification reports, and priority loan processing. Subscription fees are non-refundable once activated.
            </p>
          </section>
        </div>

        {/* Footer Accept Button */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#003893] hover:bg-[#002d78] text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
