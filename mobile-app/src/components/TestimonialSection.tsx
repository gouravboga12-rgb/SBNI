import React from 'react';
import { Star, Quote, Building } from 'lucide-react';
import { TestimonialItem } from '../types';

const defaultTestimonials: TestimonialItem[] = [
  {
    id: 't1',
    authorName: 'Rajesh Sharma',
    authorRole: 'Founder & CEO',
    companyName: 'Sharma Textile Exports',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    rating: 5,
    quote: 'Just Paisa helped us discover 4 nearby NBFCs in Mumbai. We unlocked contact details and secured our working capital facility within 3 days directly with the lender!',
  },
  {
    id: 't2',
    authorName: 'Priya Patel',
    authorRole: 'Managing Director',
    companyName: 'Patel Precision Polymers',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
    rating: 5,
    quote: 'Transparent subscription model with zero hidden commissions. Getting direct access to verified bank officers changed our expansion strategy completely.',
  },
  {
    id: 't3',
    authorName: 'Vikram Choudhury',
    authorRole: 'Owner',
    companyName: 'Choudhury Logistics Ltd',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    rating: 5,
    quote: 'The location-based search found verified lenders within 5 km of our factory in Delhi. Unlocking WhatsApp connects allowed us to negotiate terms seamlessly.',
  },
];

export const TestimonialSection: React.FC = () => {
  return (
    <div className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Quote className="w-3.5 h-3.5" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white font-heading">
            Trusted by <span className="gradient-emerald-text">50,000+ Business Owners</span>
          </h2>
          <p className="text-sm text-slate-300">
            See how Indian enterprises use Just Paisa App for direct lender discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {defaultTestimonials.map((t) => (
            <div
              key={t.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-200 italic mb-6 leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <img
                  src={t.avatarUrl}
                  alt={t.authorName}
                  className="w-11 h-11 rounded-full object-cover border border-cyan-500/30"
                />
                <div>
                  <h4 className="font-bold text-sm text-white font-heading">{t.authorName}</h4>
                  <p className="text-xs text-slate-400">{t.authorRole} • {t.companyName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
