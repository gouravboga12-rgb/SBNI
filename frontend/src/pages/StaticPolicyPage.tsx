import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  RefreshCcw,
  Headphones,
  Info,
  HelpCircle,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Trash2,
  Loader2,
} from 'lucide-react';
import { SBNILogo } from '../components/SBNILogo';
import { Footer } from '../components/Footer';
import { submitAccountDeletionRequestApi } from '../services/api';

export type StaticPageType =
  | 'terms'
  | 'privacy'
  | 'refund'
  | 'contact'
  | 'about'
  | 'faq'
  | 'delete-account';

interface StaticPolicyPageProps {
  pageType: StaticPageType;
  onNavigate: (path: string) => void;
}

export const StaticPolicyPage: React.FC<StaticPolicyPageProps> = ({ pageType, onNavigate }) => {
  const [delIdentifier, setDelIdentifier] = useState('');
  const [delRole, setDelRole] = useState<'VENDOR' | 'LENDER' | 'USER'>('VENDOR');
  const [delReason, setDelReason] = useState('');
  const [delConfirmed, setDelConfirmed] = useState(false);
  const [delSubmitting, setDelSubmitting] = useState(false);
  const [delSuccessMsg, setDelSuccessMsg] = useState<string | null>(null);
  const [delErrorMsg, setDelErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Dynamic SEO Titles and Descriptions per route
    const seoData: Record<StaticPageType, { title: string; desc: string; path: string }> = {
      about: {
        title: 'About Us & Company Overview | Just Paisa',
        desc: 'Learn about Just Paisa, India premier B2B Commercial Directory & Networking platform connecting verified local vendors, businesses, and suppliers.',
        path: '/about-us',
      },
      terms: {
        title: 'Terms and Conditions | Just Paisa B2B Directory',
        desc: 'Read the official terms and conditions for using the Just Paisa B2B platform, services, and commercial directory.',
        path: '/terms-and-conditions',
      },
      privacy: {
        title: 'Privacy Policy | Just Paisa B2B Directory',
        desc: 'Learn how Just Paisa collects, safeguards, and respects your business data, contact credentials, and personal information.',
        path: '/privacy-policy',
      },
      refund: {
        title: 'Cancellation & Refund Policy | Just Paisa',
        desc: 'Official cancellation and refund terms for Just Paisa VIP memberships and platform subscriptions.',
        path: '/refund-policy',
      },
      contact: {
        title: 'Contact Us & Helpdesk | Just Paisa',
        desc: 'Get in touch with the Just Paisa support team, grievance officer, and customer helpdesk.',
        path: '/contact-us',
      },
      faq: {
        title: 'Frequently Asked Questions (FAQ) | Just Paisa',
        desc: 'Find answers to common questions about Just Paisa B2B directory, commercial networking, and subscription benefits.',
        path: '/faq',
      },
      'delete-account': {
        title: 'Request Account & Data Deletion | Just Paisa',
        desc: 'Submit an official request to permanently delete your Just Paisa account and associated personal data.',
        path: '/delete-account',
      },
    };

    const currentSeo = seoData[pageType];
    if (currentSeo) {
      document.title = currentSeo.title;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', currentSeo.desc);
      }

      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://justpaisa.in${currentSeo.path}`);
    }
  }, [pageType]);

  const navTabs = [
    { type: 'about' as StaticPageType, label: 'About Us', path: '/about-us', icon: Info },
    { type: 'terms' as StaticPageType, label: 'Terms & Conditions', path: '/terms-and-conditions', icon: FileText },
    { type: 'privacy' as StaticPageType, label: 'Privacy Policy', path: '/privacy-policy', icon: Lock },
    { type: 'refund' as StaticPageType, label: 'Refund Policy', path: '/refund-policy', icon: RefreshCcw },
    { type: 'faq' as StaticPageType, label: 'FAQs', path: '/faq', icon: HelpCircle },
    { type: 'contact' as StaticPageType, label: 'Contact Us', path: '/contact-us', icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to Home</span>
            </button>
            <div onClick={() => onNavigate('/')} className="cursor-pointer flex items-center">
              <SBNILogo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/vendor-login')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Vendor Login
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Partner Login
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Bar for all legal & info pages */}
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 min-w-max">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pageType === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => onNavigate(tab.path)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Page Content Container */}
      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. ABOUT US PAGE                                                          */}
        {/* ========================================================================= */}
        {pageType === 'about' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-black">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  About Just Paisa
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  India's Premier B2B Business Directory & Commercial Networking Platform
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
              <p>
                <strong>Just Paisa</strong> (operated via <a href="https://justpaisa.in/" className="text-blue-600 font-bold underline">justpaisa.in</a>) is an independent business-to-business (B2B) digital listing and discovery technology platform. Our mission is to bridge the networking divide for micro, small, and medium enterprises (MSMEs), small retail shops, startups, manufacturers, and commercial business suppliers across India.
              </p>

              <h2 className="text-lg font-bold text-slate-900 pt-2 font-heading">Our Core Objective</h2>
              <p>
                In today's fast-moving commercial ecosystem, local business owners frequently face challenges discovering reliable commercial vendors, suppliers, distributors, and business partners. Just Paisa simplifies this by providing location-based GPS discovery, verified business credentials (including GST & registration documents), and direct communication channels.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <h3 className="font-extrabold text-blue-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Transparent Subscription Model
                  </h3>
                  <p className="text-xs text-slate-600">
                    We charge a straightforward, upfront subscription fee for business directory contact unlocks with zero hidden percentages or middleman brokerages.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <h3 className="font-extrabold text-emerald-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Commercial Listings
                  </h3>
                  <p className="text-xs text-slate-600">
                    Profiles listed in our directory undergo rigorous digital verification audits to ensure high transparency, trust, and business authenticity.
                  </p>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 pt-2 font-heading">Statutory & Regulatory Non-Intermediary Status</h2>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                <p className="font-bold">Important Notice:</p>
                <p>
                  Just Paisa is strictly a commercial business directory and communication technology provider. Just Paisa is NOT a bank, non-banking financial company (NBFC), financial intermediary, payment gateway, credit broker, or multi-level marketing (MLM) entity. Just Paisa does not lend funds, disburse loans, manage investments, or collect deposits.
                </p>
              </div>
            </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 2. TERMS AND CONDITIONS PAGE                                             */}
        {/* ========================================================================= */}
        {pageType === 'terms' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Terms & Conditions
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Last Updated: September 2026 • Legal Terms of Service
                </p>
              </div>
            </div>

            <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Platform Nature & Direct B2B Directory
                </h2>
                <p>
                  Just Paisa App connects verified Commercial Businesses, Vendors, Suppliers, and Enterprises. Just Paisa App operates as a direct B2B directory and networking technology platform providing contact discovery without hidden broker commissions.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. User Verification & Information Security
                </h2>
                <p>
                  All profile details, shop addresses, and contact credentials provided during digital onboarding are protected with 256-bit SSL encryption. Contact details are shared exclusively with verified commercial partners upon your explicit mutual request.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  3. Subscription Plans & Access Model
                </h2>
                <p>
                  Subscription plans (Weekly, Monthly, Quarterly, Half-Yearly, Yearly) grant digital access to verified business directory contact listings and commercial communication tools. Subscription fees are non-refundable once activated.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  4. Direct Commercial Communication
                </h2>
                <p>
                  All commercial agreements, supply contracts, pricing discussions, and business negotiations occur directly between independent registered businesses. Just Paisa App does not hold funds, approve credit, guarantee trade contracts, or arbitrate commercial disputes.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  5. Governing Law & Jurisdiction
                </h2>
                <p>
                  These terms are governed by and construed in accordance with the laws of India. Any disputes arising in connection with the platform shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
                </p>
              </section>
            </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 3. PRIVACY POLICY PAGE                                                   */}
        {/* ========================================================================= */}
        {pageType === 'privacy' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Privacy Policy
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Compliance with the Digital Personal Data Protection Act (DPDPA 2023) & IT Act 2000
                </p>
              </div>
            </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1 mb-4">
                <p className="font-bold">Applicability & Non-Lending Disclosure:</p>
                <p>
                  This Privacy Policy applies to the <strong>Just Paisa</strong> platform, website (<strong>justpaisa.in</strong>), and the <strong>Just Paisa Mobile Application</strong> (Package: <code>com.justpaisa.app</code>). 
                  Just Paisa is strictly a commercial B2B contact directory and communication facilitator. Just Paisa is <strong>NOT</strong> a bank, non-banking financial company (NBFC), moneylender, loan distributor, credit provider, or financial intermediary. Just Paisa does not issue loans, collect loan installments, make credit underwriting decisions, or offer consumer credit.
                </p>
              </div>

              <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">1. Information We Collect</h2>
                  <p>
                    To deliver accurate B2B location-based directory discovery and business verification, we collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Account & Profile Details:</strong> Business owner name, enterprise/shop name, phone number, email address, physical address.</li>
                    <li><strong>Location Information:</strong> Geographic coordinates (latitude and longitude via GPS/Mapbox) to show nearby commercial businesses and financers.</li>
                    <li><strong>Shop Verification & Media (Optional):</strong> Shop storefront photos and Shop & Establishment certificate (Labour Certificate / Trade License) uploaded solely to authenticate local merchant listings in the directory.</li>
                    <li><strong>Transaction Records:</strong> Subscription invoices and activation logs processed securely via Razorpay.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">2. Device Permissions Usage</h2>
                  <p>
                    The Just Paisa mobile application requests access to the following device permissions only when necessary:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Location (Fine/Coarse):</strong> Used to calculate distance and display nearby verified commercial listings within your service radius.</li>
                    <li><strong>Camera & Media / Photos:</strong> Used solely to capture and upload shop storefront photos or Labour / Shop Establishment certificates for merchant verification.</li>
                    <li><strong>Notifications:</strong> Used to alert you in real-time about incoming commercial inquiries, profile updates, and subscription status.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">3. Purpose of Data Processing</h2>
                  <p>
                    Data is processed strictly for authenticating business profiles, facilitating contact discovery between registered commercial enterprises, processing SaaS subscription payments via licensed payment aggregators (Razorpay), providing customer support, and complying with statutory recordkeeping obligations under Indian law.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">4. Data Security & Encryption</h2>
                  <p>
                    All data in transit is protected using industry-standard 256-bit TLS/SSL encryption. Documents and databases are stored on secured cloud infrastructure located within India in full compliance with Indian data sovereignty and DPDPA 2023 guidelines.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">5. Data Sharing & Third Parties</h2>
                  <p>
                    We do <strong>NOT</strong> sell, trade, or rent your personal or business data to third-party advertisers or brokers. Business contact information is shared exclusively with registered commercial users when you explicitly initiate an inquiry, unlock a contact, or respond to a mutual communication request.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">6. Data Retention & Account Deletion Policy</h2>
                  <p>
                    You have the right to request deletion of your Just Paisa account and all associated personal and business data at any time.
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <p className="font-semibold text-slate-800">How to request account and data deletion:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li><strong>In-App:</strong> Navigate to your <strong>Profile / Settings</strong> tab within the Just Paisa mobile app or website and select <strong>Delete Account</strong>.</li>
                      <li><strong>Email Request:</strong> Send an email from your registered email address to <a href="mailto:srinivaspolepalli10@gmail.com" className="text-blue-600 underline font-semibold">srinivaspolepalli10@gmail.com</a> with the subject <em>"Account Deletion Request"</em> along with your registered mobile number.</li>
                    </ol>
                    <p className="text-slate-500">
                      Upon receiving your deletion request, your profile, active listings, documents, and contact details will be permanently removed from our active database within 30 days, except for transaction records required to be retained under Indian statutory taxation and accounting laws.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base font-extrabold text-slate-900 font-heading">7. Legal Entity & Grievance Officer</h2>
                  <p>
                    In accordance with the Information Technology Act 2000, the Digital Personal Data Protection Act (DPDPA 2023), and rules made thereunder, the legal entity details and Grievance Officer for Just Paisa are:
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <p><strong>Legal Entity Name:</strong> Just Paisa (Registered Micro Enterprise)</p>
                    <p><strong>MSME Udyam Registration No:</strong> UDYAM-AP-13-0101061</p>
                    <p><strong>Labour Department Registration (LIN):</strong> AP-08-52-015-04472896 (AP Shops &amp; Establishments Act)</p>
                    <p><strong>Proprietor / Grievance Officer:</strong> Polepalli Srinivasulu</p>
                    <p><strong>Official Contact Email:</strong> <a href="mailto:srinivaspolepalli10@gmail.com" className="text-blue-600 underline font-semibold">srinivaspolepalli10@gmail.com</a></p>
                    <p><strong>Official Contact Phone:</strong> +91 8886284648</p>
                    <p><strong>Registered Office Address:</strong> Door No: 6-6-26, Current Office Colony, Pamur Village &amp; Mandal, Prakasam District, Andhra Pradesh - 523108, India</p>
                  </div>
                </section>
              </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 4. REFUND & CANCELLATION POLICY PAGE                                     */}
        {/* ========================================================================= */}
        {pageType === 'refund' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-black">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Cancellation & Refund Policy
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Clear, Transparent Rules on Subscriptions and AutoPay
                </p>
              </div>
            </div>

            <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 font-heading">1. Digital Nature of Service</h2>
                <p>
                  Just Paisa provides digital directory access subscriptions. Once a subscription plan (Weekly, Monthly, Quarterly, Half-Yearly, or Yearly) is purchased and activated, instant digital access to verified commercial contacts, phone numbers, and profile details is immediately unlocked.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 font-heading">2. Strict Non-Refundable Policy</h2>
                <p>
                  Due to the immediate provisioning of digital contact information, subscription fees are strictly non-refundable once payment has been completed and the subscription has been activated on your account.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 font-heading">3. One-Week Technical Activation Review Clause</h2>
                <p>
                  If you experience a verified technical failure where payment was debited via Razorpay but your digital subscription failed to activate within seven (7) business days, you may file a review request by writing to <a href="mailto:srinivaspolepalli10@gmail.com" className="text-blue-600 font-bold underline">srinivaspolepalli10@gmail.com</a> with your transaction ID and bank confirmation receipt. Following validation, a refund will be processed back to the original payment source within 5–7 banking business days.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-extrabold text-slate-900 font-heading">4. AutoPay Cancellation Anytime in 1-Click</h2>
                <p>
                  Users who opt for recurring AutoPay subscriptions may cancel recurring billing at any time in 1-click directly from their dashboard profile or subscription modal. Upon cancellation, no further charges will be billed, and your active access will remain valid until the end of the current paid billing cycle.
                </p>
              </section>
            </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 5. FAQS PAGE                                                             */}
        {/* ========================================================================= */}
        {pageType === 'faq' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-black">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Frequently Asked Questions (FAQ)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Answers to Common Questions About Just Paisa
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-extrabold text-slate-900 text-base mb-1">
                  1. What is Just Paisa App?
                </h2>
                <p className="text-slate-600">
                  Just Paisa App is India's premier B2B Business Directory & Commercial Networking platform that connects Business Owners, Vendors, and Enterprises directly with verified Commercial Partners, Suppliers, and Distributors.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-extrabold text-slate-900 text-base mb-1">
                  2. Does Just Paisa App provide financial loans or intermediation?
                </h2>
                <p className="text-slate-600">
                  No. Just Paisa App is strictly a B2B business discovery directory and networking platform. We do not offer loans, credit facilities, deposit products, or payment intermediation. All commercial discussions and trade agreements take place directly between registered enterprises.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-extrabold text-slate-900 text-base mb-1">
                  3. Why do I need a subscription plan?
                </h2>
                <p className="text-slate-600">
                  Subscription plans unlock verified business partner contact information, WhatsApp links, and company profile credentials, allowing business owners to connect directly with commercial vendors without intermediaries.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-extrabold text-slate-900 text-base mb-1">
                  4. How are commercial partners verified on Just Paisa?
                </h2>
                <p className="text-slate-600">
                  Every commercial enterprise and vendor profile undergoes digital business verification, GST/business credential validation, and profile audits before being listed on the platform.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-extrabold text-slate-900 text-base mb-1">
                  5. How can I cancel AutoPay recurring billing?
                </h2>
                <p className="text-slate-600">
                  You can cancel recurring billing at any time in 1-click from your profile settings or the subscription modal. Your plan remains active until the end of your prepaid period.
                </p>
              </div>
            </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 6. CONTACT US PAGE                                                       */}
        {/* ========================================================================= */}
        {pageType === 'contact' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-black">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Contact Us & Helpdesk
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  We are here to assist your commercial networking & directory queries
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base font-heading">Official Customer Support &amp; Helpdesk</h2>
                  <p className="text-sm font-bold text-blue-900 mt-0.5">support@justpaisa.in</p>
                  <p className="text-xs text-slate-600 font-medium">srinivaspolepalli10@gmail.com</p>
                </div>
              </div>
              <a
                href="mailto:support@justpaisa.in"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0"
              >
                Send Email
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-slate-500" /> Operating Working Hours
              </div>
              <p>
                Our customer helpdesk operates from <strong>9:00 AM to 9:00 PM IST (Monday through Saturday)</strong>. Queries submitted outside business hours will be addressed on the following business day.
              </p>
            </div>
          </article>
        )}

        {/* ========================================================================= */}
        {/* 7. ACCOUNT & DATA DELETION PORTAL (GOOGLE PLAY STORE COMPLIANT)          */}
        {/* ========================================================================= */}
        {pageType === 'delete-account' && (
          <article className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                  Account &amp; Data Deletion Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Official portal to request permanent deletion of your Just Paisa account and associated personal data
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Google Play Policy &amp; DPDPA 2023 Compliance
              </p>
              <p>
                Just Paisa respects your digital privacy rights. Users can request complete account deletion at any time, either directly within the Just Paisa mobile application (via <em>Profile &gt; Delete Account</em>) or via this web submission form without needing to reinstall the app.
              </p>
            </div>

            {/* Submission Form */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 font-heading">
                Submit Account Deletion Request
              </h2>

              {delSuccessMsg ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Request Successfully Submitted
                  </div>
                  <p>{delSuccessMsg}</p>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!delIdentifier.trim()) {
                      setDelErrorMsg('Please enter your registered mobile number or email address.');
                      return;
                    }
                    if (!delConfirmed) {
                      setDelErrorMsg('Please check the confirmation box to proceed.');
                      return;
                    }
                    setDelErrorMsg(null);
                    setDelSubmitting(true);
                    try {
                      const res = await submitAccountDeletionRequestApi({
                        identifier: delIdentifier,
                        reason: delReason,
                        confirm: delConfirmed,
                      });
                      setDelSubmitting(false);
                      if (res.success) {
                        setDelSuccessMsg(res.message || 'Your account deletion request has been submitted.');
                      } else {
                        setDelErrorMsg(res.message || 'Failed to submit request. Please try again or email support@justpaisa.in');
                      }
                    } catch (err: any) {
                      setDelSubmitting(false);
                      setDelErrorMsg(err.message || 'Failed to submit request.');
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Registered Mobile Number or Email ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={delIdentifier}
                      onChange={(e) => setDelIdentifier(e.target.value)}
                      placeholder="e.g. 9876543210 or yourname@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:border-rose-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Account Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="role"
                          checked={delRole === 'VENDOR'}
                          onChange={() => setDelRole('VENDOR')}
                        />
                        <span>Small Shop / Vendor</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="role"
                          checked={delRole === 'LENDER'}
                          onChange={() => setDelRole('LENDER')}
                        />
                        <span>Business Financer (Lender)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Reason for Deletion (Optional)
                    </label>
                    <select
                      value={delReason}
                      onChange={(e) => setDelReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-rose-500 focus:outline-none bg-white"
                    >
                      <option value="">Select a reason (optional)</option>
                      <option value="No longer using the platform">No longer using the platform</option>
                      <option value="Closed shop or business">Closed shop or business</option>
                      <option value="Privacy concerns">Privacy concerns</option>
                      <option value="Created duplicate account">Created duplicate account</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <label className="flex items-start gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={delConfirmed}
                        onChange={(e) => setDelConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        I understand that upon submitting this request, my Just Paisa account, profile details, KYC documents, and business listings will be permanently deleted and cannot be restored.
                      </span>
                    </label>
                  </div>

                  {delErrorMsg && (
                    <p className="text-rose-600 font-bold">{delErrorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={delSubmitting}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    {delSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Submit Account Deletion Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Information Disclosures */}
            <div className="space-y-4 text-xs text-slate-600">
              <section className="space-y-1.5">
                <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                  1. What data is permanently deleted?
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Your user account profile (name, phone number, email address, password hash).</li>
                  <li>All uploaded KYC identity documents (Aadhaar, PAN, GST, business registration certificate).</li>
                  <li>Store location, shop photos, coordinates, and operating service radius.</li>
                  <li>In-app communication records, inquiries, and device push notification tokens.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                  2. What data is retained and why?
                </h2>
                <p>
                  In accordance with Indian financial and taxation regulations (including the GST Act and Companies Act), records of financial billing transactions and generated tax invoices are required to be preserved for statutory audit purposes. No further commercial networking or communication occurs after account deletion.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                  3. Retention &amp; Purge Timeline
                </h2>
                <p>
                  Deletion requests submitted via the mobile app or this web portal are processed within <strong>30 days</strong>. Immediate access to your account is revoked upon verification.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                  4. Direct Grievance &amp; Manual Support
                </h2>
                <p>
                  You can also directly email our Grievance Officer at <a href="mailto:support@justpaisa.in" className="text-blue-600 font-bold underline">support@justpaisa.in</a> or <a href="mailto:srinivaspolepalli10@gmail.com" className="text-blue-600 font-bold underline">srinivaspolepalli10@gmail.com</a> with the subject <em>"Account Deletion Request"</em> along with your registered phone number.
                </p>
              </section>
            </div>
          </article>
        )}

      </main>

      {/* Standard Footer */}
      <Footer onOpenPolicyRoute={(route) => onNavigate(route)} />
    </div>
  );
};
