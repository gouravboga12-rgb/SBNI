import React, { useState } from 'react';
import { Lender } from '../types';
import { Phone, MessageCircle, CheckCircle2, Star } from 'lucide-react';

interface LenderCardProps {
  lender: Lender;
  onOpenSubscription?: () => void;
}

export const LenderCard: React.FC<LenderCardProps> = ({ lender, onOpenSubscription }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      
      {/* Left Column: Bank Logo & Details */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0 w-full">
        
        {/* Institution Brand Avatar / Logo */}
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {lender.logoUrl && !imgError ? (
            <img
              src={lender.logoUrl}
              alt={lender.institutionName}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#003893] text-white flex items-center justify-center font-extrabold text-xs">
              {lender.institutionName.split(' ').map(n => n[0]).join('').slice(0, 3)}
            </div>
          )}
        </div>

        {/* Institution Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base font-heading leading-tight truncate">
              {lender.institutionName}
            </h3>
            <span className="badge-verified-green">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {lender.institutionType}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <span>{lender.rating}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-slate-400 font-normal">({lender.reviewCount})</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">{lender.distanceKm} KM</span>
          </div>

          {/* Loan Category Tags */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-slate-600 font-medium">
            {lender.loanCategories.join(' • ')}
          </div>
        </div>

      </div>

      {/* Right Column: Call & WhatsApp Action Buttons */}
      <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
        {lender.contactUnlocked ? (
          <>
            <a
              href={`tel:${lender.phone}`}
              className="btn-call-outline text-xs justify-center flex-1 sm:flex-initial"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Call</span>
            </a>

            {lender.whatsAppUrl ? (
              <a
                href={lender.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp-outline text-xs justify-center flex-1 sm:flex-initial"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button disabled className="btn-whatsapp-outline text-xs opacity-50 justify-center flex-1 sm:flex-initial">
                WhatsApp
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onOpenSubscription}
            className="btn-sbni-blue text-xs py-2 px-4 justify-center w-full sm:w-auto"
          >
            Unlock
          </button>
        )}
      </div>

    </div>
  );
};
