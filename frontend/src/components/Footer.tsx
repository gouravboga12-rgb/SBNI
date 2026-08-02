import React from 'react';
import { SBNILogo } from './SBNILogo';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white p-2.5 rounded-2xl inline-block shadow-md border border-slate-200">
              <SBNILogo imgClassName="h-12 w-auto object-contain" />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              India's trusted enterprise B2B Loan Marketplace platform connecting Business Owners (Vendors) directly with verified Banks, NBFCs, and Lenders.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Marketplace Links</h4>
            <ul className="space-y-2.5">
              <li><a href="#discovery" className="hover:text-cyan-400 transition-colors">Find Nearby Lenders</a></li>
              <li><a href="#plans" className="hover:text-cyan-400 transition-colors">Subscription Plans</a></li>
              <li><a href="#kyc" className="hover:text-cyan-400 transition-colors">Digital KYC Verification</a></li>
              <li><a href="#faqs" className="hover:text-cyan-400 transition-colors">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Compliance & Legal */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Compliance & Policies</h4>
            <ul className="space-y-2.5">
              <li><a href="#terms" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#disclaimer" className="hover:text-cyan-400 transition-colors">Marketplace Disclaimer</a></li>
              <li><a href="#refund" className="hover:text-cyan-400 transition-colors">Subscription Refund Policy</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Help Desk & Support</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>support@sbnimoney.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Toll Free: +91 1800 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>BKC Financial Tower 4, Mumbai - 400051</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 mb-8 leading-relaxed">
          <strong className="text-slate-200">Regulatory Disclaimer:</strong> SBNI Money App is strictly a technology platform facilitating vendor-lender discovery and communication. SBNI Money App is not a bank, non-banking financial company (NBFC), loan recovery agent, or credit institution. SBNI Money App does not offer loan approvals, process applications, disburse funds, or compute credit scores. All financial arrangements and loan agreements take place directly between independent users.
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p>© 2026 SBNI Money App. All Rights Reserved. Production Enterprise FinTech Release.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Supabase PostgreSQL Realtime Sync Active
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
