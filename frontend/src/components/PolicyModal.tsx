import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  RefreshCcw,
  AlertTriangle,
  Lock,
  Building2,
  CheckCircle2,
  X,
  Scale,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { SBNILogo } from './SBNILogo';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'disclaimer';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-xs shrink-0">
              <SBNILogo imgClassName="h-8 w-auto object-contain" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight font-heading flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                Legal, Compliance & Policy Center
              </h2>
              <p className="text-xs text-slate-400">
                Just Paisa App Marketplace • Last Updated: August 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 overflow-x-auto gap-2 py-2 flex-shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Lock className="w-4 h-4" />
            Privacy Policy
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <RefreshCcw className="w-4 h-4" />
            Refund & Cancellation Policy
          </button>

          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Marketplace Disclaimer
          </button>
        </div>

        {/* Policy Content Scroll View */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* ───────────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: TERMS OF SERVICE */}
          {/* ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-blue-950">Terms of Service Agreement</h3>
                  <p className="text-xs text-blue-800 mt-0.5 font-medium">
                    Please read these terms carefully before accessing or using the Just Paisa App marketplace platform.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  1. Nature of Platform & Non-Banking Status
                </h4>
                <p>
                  <strong>Just Paisa App</strong> operates purely as an online business-to-business (B2B) discovery and communications technology infrastructure. 
                  Just Paisa App is <strong>NOT</strong> a bank, Non-Banking Financial Company (NBFC), money lender, credit rating agency, or recovery agent.
                  The platform enables registered small businesses, shop owners, and startups (<strong>Vendors</strong>) to discover and connect with verified financial institutions and loan providers (<strong>Lenders</strong>).
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  2. User Accounts & Strict Role Independence
                </h4>
                <p>
                  Users must maintain valid account credentials and submit accurate KYC documentation.
                  Vendor, Lender, and Admin accounts are completely separate and independent.
                  A device can maintain only one active session per account role. Logging out terminates all session tokens immediately and purges local storage to protect sensitive financial records.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  3. Subscription Validity & Stacking Terms
                </h4>
                <p>
                  Paid subscription plans provide enhanced discovery, unlocked direct phone contacts, verified KYC downloads, and priority WhatsApp connect features.
                  <strong>Validity Stacking:</strong> If an active subscriber purchases a new plan or upgrade prior to the current plan's expiry date, the new duration is added to the remaining days without any loss of paid validity.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  4. Prohibited Conduct & Fraud Prevention
                </h4>
                <p>
                  Users agree not to submit forged GSTINs, altered PAN/Aadhaar cards, or false loan requests.
                  Any fraudulent activity or extortion attempts will result in immediate suspension, reporting to the Credit Information Bureau of India and Cyber Crime departments, and blacklisting across the platform.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  5. Governing Law & Jurisdiction
                </h4>
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising in connection with the platform shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.
                </p>
              </section>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: PRIVACY POLICY */}
          {/* ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">Privacy & Data Protection Policy</h3>
                  <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                    We are committed to protecting your financial and personal identity with enterprise-grade encryption.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1. Information We Collect
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Account Profile:</strong> Full name, verified mobile number, email address, shop/business name, category, and physical address.</li>
                  <li><strong>KYC Documents:</strong> GSTIN certificate, PAN card, Aadhaar documentation, and business registration records for verification.</li>
                  <li><strong>Location Data:</strong> Geolocation coordinates (via GPS & Mapbox Reverse Geocoding) used strictly to identify nearby financial institutions and service radius.</li>
                  <li><strong>Transaction Records:</strong> Subscription invoices, Razorpay transaction IDs, and referral wallet rewards.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. Consent-Based Data Sharing
                </h4>
                <p>
                  <strong>No KYC or customer information is shared without your explicit consent.</strong>
                  When a Vendor initiates contact with a Lender via Call or WhatsApp, a confirmation dialog explicitly requests permission to share necessary profile and enquiry details. If cancelled, no customer details are transmitted.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  3. Data Security & Storage
                </h4>
                <p>
                  All database communications use 256-bit Transport Layer Security (TLS/SSL).
                  Sensitive authentication secrets and passwords are encrypted using bcrypt hashing.
                  We do not store complete credit card or debit card numbers on our servers; all payment transactions are processed through Razorpay's PCI-DSS compliant payment gateway.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  4. Data Deletion & Privacy Inquiries
                </h4>
                <p>
                  Users may request account deletion or data anonymization at any time by contacting our Data Protection Officer at <a href="mailto:privacy@justpaisa.com" className="text-emerald-700 font-bold underline">privacy@justpaisa.com</a>.
                </p>
              </section>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: REFUND & CANCELLATION POLICY */}
          {/* ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'refund' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-start gap-3">
                <RefreshCcw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-indigo-950">Subscription Refund & Cancellation Policy</h3>
                  <p className="text-xs text-indigo-800 mt-0.5 font-medium">
                    Transparent guidelines on subscription fees, renewals, AutoPay cancellations, and refund claims.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  1. Digital Subscription Nature & Non-Refundable Policy
                </h4>
                <p>
                  Just Paisa App subscriptions (Weekly, Monthly, Quarterly, Half-Yearly, Yearly) provide instantaneous digital access to verified financer databases, direct contact numbers, and KYC sharing features. 
                  All subscription payments are <strong>strictly non-refundable once paid</strong>.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  2. Eligible Refund Circumstance (Service Activation Failure Only)
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Services Failed to Activate:</strong> A refund is considered only if a successful payment occurred but the services failed to activate on your account.
                  </li>
                  <li>
                    <strong>Account Review & 1-Week Resolution Window:</strong> Upon receiving your report, our team will review the account. If our technical team is unable to activate your subscription services within <strong>1 week (7 days)</strong> of the issue being reported, an approved refund will be issued.
                  </li>
                  <li>
                    <strong>Refund Timeline:</strong> Eligible and approved refunds will be credited back to the original payment method within <strong>5 to 7 working days</strong>.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-indigo-600" />
                  3. AutoPay Cancellation & Retained Access
                </h4>
                <p>
                  You can disable Auto-Renewal / AutoPay at any time directly from the Subscription Modal with a single click.
                  Cancelling AutoPay prevents future automatic billing while guaranteeing that your active subscription remains fully functional until the end of the current billing validity.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  4. Reporting Activation Issues
                </h4>
                <p>
                  If your paid subscription has failed to activate, please email our support desk at <a href="mailto:srinivaspolepalli10@gmail.com" className="text-indigo-700 font-bold underline">srinivaspolepalli10@gmail.com</a> with your Payment ID (e.g. <code>pay_...</code>) and Registered Mobile Number. If service activation cannot be resolved within 1 week of reporting, your payment will be refunded within <strong>5 to 7 working days</strong>.
                </p>
              </section>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────────── */}
          {/* TAB 4: MARKETPLACE DISCLAIMER */}
          {/* ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-amber-950">Marketplace Regulatory Disclaimer</h3>
                  <p className="text-xs text-amber-800 mt-0.5 font-medium">
                    Statutory notice regarding financial intermediary status and independent agreements.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">
                  1. Statutory Non-Intermediary Notice
                </h4>
                <p>
                  Just Paisa App is exclusively a communication and match-making portal connecting independent business owners with financial institutions.
                  Just Paisa App is <strong>not</strong> an RBI-regulated bank, NBFC, financial adviser, guarantor, or loan underwriter.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">
                  2. No Loan Approval or Disbursement Guarantee
                </h4>
                <p>
                  Just Paisa App does not guarantee loan sanctions, interest rate caps, credit approvals, or turnaround times.
                  All loan approvals, sanction letters, interest charges, repayment schedules, and documentation are decided solely by the respective independent lending partner based on their proprietary credit evaluation policies.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">
                  3. Zero Middleman Commission
                </h4>
                <p>
                  Just Paisa App charges no commission on approved credit amounts. All commercial relationships and contracts exist strictly between the Vendor and the Lender.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Action */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted Enterprise Protection</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Close Policy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
