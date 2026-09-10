import React, { useState } from 'react';
import { SBNILogo } from './SBNILogo';
import { ShieldCheck, Mail, Phone, MapPin, FileText, Lock, RefreshCcw, AlertTriangle } from 'lucide-react';
import { PolicyModal, PolicyTab } from './PolicyModal';

interface FooterProps {
  onOpenPolicyRoute?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicyRoute }) => {
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('terms');

  const navigateTo = (path: string, fallbackTab?: PolicyTab) => {
    if (onOpenPolicyRoute) {
      onOpenPolicyRoute(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (fallbackTab) {
      setPolicyTab(fallbackTab);
      setPolicyModalOpen(true);
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs pt-12 pb-36 sm:pb-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg border border-slate-200">
              <SBNILogo imgClassName="h-20 sm:h-24 w-auto object-contain" style={{ maxHeight: '100px' }} />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              JustPaisa is strictly a local business directory and communication platform connecting local business owners (vendors) directly with commercial partners. No lending, loan disbursement, collection, or financial intermediation of any kind takes place through our website or infrastructure.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Directory Links</h4>
            <ul className="space-y-2.5">
              <li><button type="button" onClick={() => navigateTo('/about-us')} className="hover:text-cyan-400 transition-colors cursor-pointer text-left">About Just Paisa</button></li>
              <li><button type="button" onClick={() => navigateTo('/faq')} className="hover:text-cyan-400 transition-colors cursor-pointer text-left">Frequently Asked Questions</button></li>
              <li><button type="button" onClick={() => navigateTo('/contact-us')} className="hover:text-cyan-400 transition-colors cursor-pointer text-left">Help Desk & Support</button></li>
              <li><button type="button" onClick={() => navigateTo('/vendor-login')} className="hover:text-cyan-400 transition-colors cursor-pointer text-left">Vendor Portal Login</button></li>
              <li><button type="button" onClick={() => navigateTo('/login')} className="hover:text-cyan-400 transition-colors cursor-pointer text-left">Commercial Partner Login</button></li>
            </ul>
          </div>

          {/* Compliance & Legal Policies */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Compliance & Policies</h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/terms-and-conditions', 'terms')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/privacy-policy', 'privacy')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/refund-policy', 'refund')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
                  Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/about-us', 'disclaimer')}
                  className="hover:text-cyan-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                  Directory Disclaimer
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white text-sm font-heading mb-4">Help Desk & Support</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <a href="mailto:srinivaspolepalli10@gmail.com" className="hover:text-cyan-400 transition-colors break-all">
                  srinivaspolepalli10@gmail.com
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/contact-us')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Contact Support ➔
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mb-8 leading-relaxed">
          <strong className="text-amber-400">Important Statutory Notice & Regulatory Disclaimer:</strong> JustPaisa is strictly a local business directory and communication platform. No lending, loan disbursement, collection, or financial intermediation of any kind takes place through our website or infrastructure. JustPaisa does not provide loans, process loan applications, disburse loans, collect repayments, or process financial transactions. We do not act as a lender, financial institution, NBFC, or credit provider. Any communication or business arrangement between a vendor and a lender takes place directly between the respective parties outside the platform.
        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col items-center justify-between gap-4 text-center">
          
          {/* Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => navigateTo('/privacy-policy', 'privacy')}
              className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => navigateTo('/terms-and-conditions', 'terms')}
              className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => navigateTo('/refund-policy', 'refund')}
              className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Refund & Cancellation Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => navigateTo('/about-us', 'disclaimer')}
              className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              About Just Paisa
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => navigateTo('/contact-us')}
              className="text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </div>

          {/* Copyright & Developed By */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-400">
            <p>© 2026 Just Paisa App. All Rights Reserved.</p>
            <span className="hidden sm:inline text-slate-600">•</span>
            <p>
              Developed by{' '}
              <a
                href="https://www.codtechitsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-extrabold underline underline-offset-4 transition-colors cursor-pointer"
              >
                CODTECH IT SOLUTIONS
              </a>
            </p>
          </div>

        </div>

      </div>

      {/* Interactive Policy Modal */}
      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialTab={policyTab}
      />
    </footer>
  );
};
