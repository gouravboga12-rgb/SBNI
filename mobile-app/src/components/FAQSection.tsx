import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../types';

const defaultFAQs: FAQItem[] = [
  {
    id: '1',
    category: 'General',
    question: 'What is SBNI Money App?',
    answer: 'SBNI Money App is India’s premier B2B Capital Marketplace that connects Business Owners (Vendors) with verified Banks, NBFCs, and Lenders. We facilitate direct discovery and communication.',
  },
  {
    id: '2',
    category: 'General',
    question: 'Does SBNI Money process or approve my financial application?',
    answer: 'No. SBNI Money is strictly a discovery marketplace platform. We do not process, approve, disburse, or track financial credit. All negotiations, documentation, and capital disbursements take place directly between you and the verified lender.',
  },
  {
    id: '3',
    category: 'Subscriptions',
    question: 'Why do I need a subscription plan?',
    answer: 'Subscription plans unlock direct lender phone numbers, WhatsApp links, and verified contact details, allowing business owners to connect directly with financial institutions without intermediaries.',
  },
  {
    id: '4',
    category: 'Verification',
    question: 'How are lenders verified on SBNI Money?',
    answer: 'Every Bank, NBFC, and financial institution undergoes strict digital KYC, license verification, and registration audits before being displayed on the platform.',
  },
];

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('1');

  return (
    <div className="py-16 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white font-heading">
            Got Questions? We Have <span className="gradient-text">Answers</span>.
          </h2>
          <p className="text-sm text-slate-300">
            Everything you need to know about our marketplace discovery platform.
          </p>
        </div>

        <div className="space-y-4">
          {defaultFAQs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-base font-heading"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-300 border-t border-slate-800/50 pt-3 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
