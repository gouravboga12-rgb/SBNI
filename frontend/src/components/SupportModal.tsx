import React from 'react';
import { Headphones, Phone, Mail, MessageSquare, X, Clock, ShieldCheck } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 font-bold">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">Customer Support & Helpdesk</h2>
            <p className="text-xs text-slate-500 font-medium">We are available 24/7 to assist your loan inquiries</p>
          </div>
        </div>

        {/* Contact Options Grid */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Official Customer Support &amp; Helpdesk</div>
                <div className="text-sm font-extrabold text-blue-900">support@justpaisa.in</div>
                <div className="text-[11px] font-medium text-slate-500">srinivaspolepalli10@gmail.com</div>
              </div>
            </div>
            <a
              href="mailto:support@justpaisa.in"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Email Us
            </a>
          </div>
        </div>

        {/* Operating Hours Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Priority support for active Subscribers. Operational 9:00 AM - 9:00 PM IST (Mon-Sat).</span>
        </div>

      </div>
    </div>
  );
};
