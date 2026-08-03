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
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Toll-Free Helpline</div>
                <div className="text-sm font-extrabold text-blue-900">+91 1800-123-7264 (Just Paisa)</div>
              </div>
            </div>
            <a
              href="tel:18001237264"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              Call Now
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Official Email Desk</div>
                <div className="text-xs font-bold text-slate-600">support@justpaisa.com</div>
              </div>
            </div>
            <a
              href="mailto:support@justpaisa.com"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Send Email
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">WhatsApp Support</div>
                <div className="text-xs font-bold text-slate-600">+91 98765 43210</div>
              </div>
            </div>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
            >
              Chat Live
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
