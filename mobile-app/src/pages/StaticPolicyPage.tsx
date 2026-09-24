import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { SBNILogo } from '../components/SBNILogo';
import { Footer } from '../components/Footer';

export type StaticPageType =
  | 'terms'
  | 'privacy'
  | 'refund'
  | 'contact'
  | 'about'
  | 'faq';

interface StaticPolicyPageProps {
  pageType: StaticPageType;
  onNavigate: (path: string) => void;
}

export const StaticPolicyPage: React.FC<StaticPolicyPageProps> = ({ pageType, onNavigate }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Dynamic SEO Titles per route
    const titles: Record<StaticPageType, string> = {
      terms: 'Terms and Conditions | Just Paisa B2B Directory',
      privacy: 'Privacy Policy | Just Paisa B2B Directory',
      refund: 'Cancellation & Refund Policy | Just Paisa',
      contact: 'Contact Us & Helpdesk | Just Paisa',
      about: 'About Us & Company Overview | Just Paisa',
      faq: 'Frequently Asked Questions (FAQ) | Just Paisa',
    };
    document.title = titles[pageType] || 'Just Paisa';
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">Helpline Desk</h2>
                <p className="text-xs text-slate-600 font-medium">+91 1800-123-7264</p>
                <a href="tel:18001237264" className="inline-block mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                  Call Now
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">Official Email</h2>
                <p className="text-xs text-slate-600 font-medium break-all">srinivaspolepalli10@gmail.com</p>
                <a href="mailto:srinivaspolepalli10@gmail.com" className="inline-block mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                  Send Email
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">WhatsApp Connect</h2>
                <p className="text-xs text-slate-600 font-medium">+91 98765 43210</p>
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="inline-block mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors">
                  Chat Live
                </a>
              </div>
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
      </main>

      {/* Standard Footer */}
      <Footer onOpenPolicyRoute={(route) => onNavigate(route)} />
    </div>
  );
};
