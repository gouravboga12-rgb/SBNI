import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../types';

const defaultFAQs: FAQItem[] = [
  {
    id: '1',
    category: 'General',
    question: 'What is Just Paisa App?',
    answer: 'Just Paisa App is India’s premier B2B Business Directory & Commercial Networking platform that connects Business Owners, Vendors, and Enterprises directly with verified Commercial Partners, Suppliers, and Distributors.',
  },
  {
    id: '2',
    category: 'General',
    question: 'Does Just Paisa App provide financial loans or intermediation?',
    answer: 'No. Just Paisa App is strictly a B2B business discovery directory and networking platform. We do not offer loans, credit facilities, deposit products, or payment intermediation. All commercial discussions and trade agreements take place directly between registered enterprises.',
  },
  {
    id: '3',
    category: 'Subscriptions',
    question: 'Why do I need a subscription plan?',
    answer: 'Subscription plans unlock verified business partner contact information, WhatsApp links, and company profile credentials, allowing business owners to connect directly with commercial vendors without intermediaries.',
  },
  {
    id: '4',
    category: 'Verification',
    question: 'How are commercial partners verified on Just Paisa?',
    answer: 'Every commercial enterprise and vendor profile undergoes digital business verification, GST/business credential validation, and profile audits before being listed on the platform.',
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
