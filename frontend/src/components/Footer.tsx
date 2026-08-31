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
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg border border-slate-200">
              <SBNILogo imgClassName="h-20 sm:h-24 w-auto object-contain" style={{ maxHeight: '100px' }} />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              India's trusted enterprise B2B Financial Marketplace platform connecting Business Owners (Vendors) directly with verified Banks, NBFCs, and Financial Institutions.
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
                <span>support@justpaisa.com</span>
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
          <strong className="text-slate-200">Regulatory Disclaimer:</strong> Just Paisa App is strictly a technology platform facilitating vendor-lender discovery and communication. Just Paisa App is not a bank, non-banking financial company (NBFC), recovery agent, or credit institution. Just Paisa App does not offer credit approvals, process applications, disburse funds, or compute credit scores. All financial arrangements and business agreements take place directly between independent users.
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p>© 2026 Just Paisa App. All Rights Reserved. Production Enterprise FinTech Release.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span>
              Developed by{' '}
              <a
                href="https://www.codtechitsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-extrabold underline underline-offset-2 transition-colors cursor-pointer"
              >
                CODTECH IT SOLUTIONS
              </a>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a href="/admin" className="text-slate-500 hover:text-cyan-400 font-bold transition-colors">
              Super Admin Portal (/admin)
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
