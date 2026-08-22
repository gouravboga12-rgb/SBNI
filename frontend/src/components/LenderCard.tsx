import React, { useState, useEffect } from 'react';
import { Lender } from '../types';
import { Phone, MessageCircle, CheckCircle2, SendHorizontal, Lock, Zap, TrendingUp, Coins, MapPin } from 'lucide-react';
import { ingestLeadApi, safeSetLocalStorage, fetchVendorMyLeadsApi } from '../services/api';

interface LenderCardProps {
  lender: Lender;
  onOpenSubscription?: () => void;
  onRequestLoan?: (lender: Lender) => void;
}

export const LenderCard: React.FC<LenderCardProps> = ({ lender, onOpenSubscription, onRequestLoan }) => {
  const [imgError, setImgError] = useState(false);

  const checkHasApplied = (id: string) => {
    try {
      const deletedLeads = JSON.parse(localStorage.getItem('sbni_deleted_leads') || '[]');
      const reqsStr = localStorage.getItem('sbni_vendor_requests');

      if (reqsStr) {
        const reqs = JSON.parse(reqsStr);
        if (Array.isArray(reqs)) {
          const hasActive = reqs.some(
            (r: any) =>
              !deletedLeads.includes(r.id) &&
              (r.lenderId === id ||
                (r.lenderId && (lender.registrationNumber === r.lenderId || lender.institutionName === r.lenderName || (lender as any).name === r.lenderName)))
          );

          if (hasActive) return true;

          // Clear any stale applied markers
          localStorage.removeItem(`sbni_applied_${id}`);
          if (lender.registrationNumber) localStorage.removeItem(`sbni_applied_${lender.registrationNumber}`);
          return false;
        }
      }

      // If no active requests array, ensure flag is cleaned up
      localStorage.removeItem(`sbni_applied_${id}`);
      if (lender.registrationNumber) localStorage.removeItem(`sbni_applied_${lender.registrationNumber}`);
    } catch (e) {}
    return false;
  };

  const [hasApplied, setHasApplied] = useState(() => checkHasApplied(lender.id));

  const checkSubscription = () => {
    try {
      if (
        lender.contactUnlocked ||
        localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
        localStorage.getItem('sbni_lender_subscribed') === 'true' ||
        localStorage.getItem('sbni_subscribed') === 'true'
      ) {
        return true;
      }
    } catch (e) {}
    return false;
  };

  const [isSubscribedState, setIsSubscribedState] = useState(() => checkSubscription());

  useEffect(() => {
    const handleUpdate = () => {
      setHasApplied(checkHasApplied(lender.id));
      setIsSubscribedState(checkSubscription());
    };

    // Live sync with RDS to check if lead was deleted by financer
    fetchVendorMyLeadsApi()
      .then((res) => {
        if (res && res.success) {
          const activeLeads = Array.isArray(res.data) ? res.data : [];
          if (activeLeads.length === 0) {
            // No active leads in database -> reset all local applied flags
            localStorage.removeItem(`sbni_applied_${lender.id}`);
            if (lender.registrationNumber) localStorage.removeItem(`sbni_applied_${lender.registrationNumber}`);
            localStorage.setItem('sbni_vendor_requests', JSON.stringify([]));
            setHasApplied(false);
          } else {
            const matchesLender = activeLeads.some(
              (lead: any) =>
                lead.lenderId === lender.id ||
                (lead.lender && (lead.lender.id === lender.id || lead.lender.registrationNumber === lender.registrationNumber || lead.lender.institutionName === lender.institutionName))
            );
            if (!matchesLender) {
              localStorage.removeItem(`sbni_applied_${lender.id}`);
              if (lender.registrationNumber) localStorage.removeItem(`sbni_applied_${lender.registrationNumber}`);
              setHasApplied(false);
            } else {
              setHasApplied(true);
            }
          }
        }
      })
      .catch(() => {});

    window.addEventListener('sbni_request_submitted', handleUpdate);
    window.addEventListener('sbni_vendor_deleted', handleUpdate);
    window.addEventListener('sbni_subscription_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sbni_request_submitted', handleUpdate);
      window.removeEventListener('sbni_vendor_deleted', handleUpdate);
      window.removeEventListener('sbni_subscription_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [lender.id]);

  const handleApplyClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSubscribed = checkSubscription();
    
    if (!isSubscribed && !isSubscribedState) {
      if (onOpenSubscription) {
        onOpenSubscription();
      }
      return;
    }

    if (onRequestLoan) {
      onRequestLoan(lender);
    }
  };

  const getLoggedInVendorDetails = () => {
    let name = 'Registered Vendor';
    let phone = '';
    let email = '';
    let businessName = '';
    let address = '';
    let city = '';
    let state = '';
    let panNumber = undefined;
    let aadhaarNumber = undefined;
    let monthlyIncome = '₹ 50,000 / month';
    let avatarUrl = undefined;
    let panFileUrl = undefined;
    let aadhaarFileUrl = undefined;
    let shopLicensePdf = undefined;
    let gstCertificatePdf = undefined;
    let shopPhotoUrl = undefined;
    let liveSelfieUrl = undefined;

    try {
      const uStr = localStorage.getItem('sbni_user');
      const vpStr = localStorage.getItem('sbni_vendor_profile');
      const u = uStr ? JSON.parse(uStr) : null;
      const vp = vpStr ? JSON.parse(vpStr) : null;

      name = vp?.ownerName || vp?.fullName || u?.name || u?.fullName || 'Registered Vendor';
      phone = vp?.phone || u?.phone || '';
      email = vp?.email || u?.email || '';
      businessName = vp?.businessName || (name + ' Enterprise');
      city = vp?.city || '';
      state = vp?.state || '';
      address = vp?.address || (city ? `${city}, ${state}` : '');
      panNumber = vp?.panNumber || u?.panNumber;
      aadhaarNumber = vp?.aadhaarNumber;
      monthlyIncome = vp?.monthlyIncome || u?.monthlyIncome || '₹ 50,000 / month';
      avatarUrl = vp?.avatarUrl || vp?.photoDataUrl || localStorage.getItem('sbni_vendor_avatar') || undefined;
      panFileUrl = vp?.panFileUrl || vp?.panDataUrl || undefined;
      aadhaarFileUrl = vp?.aadhaarFileUrl || vp?.aadhaarDataUrl || undefined;
      shopLicensePdf = vp?.shopLicensePdf || vp?.licenseDataUrl || undefined;
      gstCertificatePdf = vp?.gstCertificatePdf || vp?.gstDataUrl || vp?.licenseDataUrl || undefined;
      shopPhotoUrl = vp?.shopPhotoUrl || vp?.shopPhotoDataUrl || undefined;
      liveSelfieUrl = vp?.liveSelfieUrl || vp?.liveSelfieDataUrl || avatarUrl || undefined;
    } catch (e) {}

    return {
      name,
      phone,
      email,
      businessName,
      address,
      city,
      state,
      panNumber,
      aadhaarNumber,
      monthlyIncome,
      avatarUrl,
      panFileUrl,
      aadhaarFileUrl,
      shopLicensePdf,
      gstCertificatePdf,
      shopPhotoUrl,
      liveSelfieUrl,
    };
  };

  const recordLenderRequest = (actionType: 'APPLY' | 'CALL' | 'WHATSAPP') => {
    try {
      const v = getLoggedInVendorDetails();
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      let inquiryType: 'LOAN_APPLICATION' | 'PHONE_CALL' | 'WHATSAPP' = 'LOAN_APPLICATION';
      let inquiryMessage = '📝 Vendor submitted a Working Capital Loan application.';
      if (actionType === 'CALL') {
        inquiryType = 'PHONE_CALL';
        inquiryMessage = '📞 This customer/vendor has called you to discuss financing.';
      } else if (actionType === 'WHATSAPP') {
        inquiryType = 'WHATSAPP';
        inquiryMessage = '💬 This customer/vendor messaged you on WhatsApp for financing.';
      }

      const newRequest = {
        id: 'req-' + Date.now() + '-' + actionType.toLowerCase(),
        vendorName: v.name,
        shopName: v.businessName,
        shopAddress: v.address || (lender.city ? `${lender.city}, ${lender.state || ''}` : 'Registered Location'),
        city: lender.city || v.city || 'Mumbai',
        state: lender.state || v.state || 'Maharashtra',
        requestedDate: formattedDate,
        requestedTime: formattedTime,
        status: 'Pending',
        inquiryType,
        inquiryMessage,
        mobileNumber: v.phone,
        emailId: v.email,
        panNumber: v.panNumber || 'PAN Verified',
        aadhaarNumber: v.aadhaarNumber || 'Aadhaar Verified',
        monthlyIncome: v.monthlyIncome,
        lenderId: lender.id,
        lenderName: lender.institutionName,
        avatarUrl: v.avatarUrl || v.liveSelfieUrl,
        panFileUrl: v.panFileUrl,
        aadhaarFileUrl: v.aadhaarFileUrl,
        shopLicensePdf: v.shopLicensePdf,
        gstCertificatePdf: v.gstCertificatePdf,
        shopPhotoUrl: v.shopPhotoUrl,
        liveSelfieUrl: v.liveSelfieUrl,
        shopImages: v.shopPhotoUrl ? [v.shopPhotoUrl] : [],
      };

      const existingStr = localStorage.getItem('sbni_vendor_requests');
      let existingList: any[] = [];
      if (existingStr) {
        try { existingList = JSON.parse(existingStr); } catch (e) {}
      }

      // Avoid exact duplicates
      const filtered = existingList.filter((r: any) => !(r.lenderId === lender.id && r.inquiryType === inquiryType && r.vendorName === v.name));
      filtered.unshift(newRequest);

      safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(filtered));
      safeSetLocalStorage(`sbni_applied_${lender.id}`, 'true');
      setHasApplied(true);
      window.dispatchEvent(new Event('sbni_request_submitted'));

      // Asynchronously ingest lead into backend
      ingestLeadApi({
        lenderId: lender.id,
        type: inquiryType,
        notes: inquiryMessage,
        vendorSnapshot: newRequest,
      }).catch((err) => console.error('Background ingestLeadApi error:', err));
    } catch (e) {
      console.error('Error recording lender request:', e);
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isSubscribed = checkSubscription();
    if (!isSubscribed && !isSubscribedState) {
      if (onOpenSubscription) onOpenSubscription();
      return;
    }

    recordLenderRequest('CALL');
    if (lender.phone) {
      window.location.href = `tel:${lender.phone}`;
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isSubscribed = checkSubscription();
    if (!isSubscribed && !isSubscribedState) {
      if (onOpenSubscription) onOpenSubscription();
      return;
    }

    recordLenderRequest('WHATSAPP');
    if (lender.whatsAppUrl) {
      window.open(lender.whatsAppUrl, '_blank');
    } else if (lender.phone) {
      const cleanPhone = lender.phone.replace(/\D/g, '');
      const msg = encodeURIComponent(`Hello ${lender.institutionName}, I am interested in business financing for my shop.`);
      window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
  };

  const isSubscribed = isSubscribedState || checkSubscription();

  const minAmt = lender.minLoanAmount ? lender.minLoanAmount.toLocaleString('en-IN') : '10,000';
  const maxAmt = lender.maxLoanAmount ? lender.maxLoanAmount.toLocaleString('en-IN') : '1,00,000';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300/80 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative overflow-hidden border-l-4 border-l-[#003893]">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-100/60 transition-colors" />

      {/* Left Column: Financer Logo & Details */}
      {(() => {
        const DEFAULT_LENDER_PHOTO = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200';
        const effectiveLogo = lender.logoUrl || (lender as any).avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('sbni_lender_avatar') : null) || DEFAULT_LENDER_PHOTO;
        const displayName = lender.institutionName && !lender.institutionName.toLowerCase().includes('money financer')
          ? `${lender.institutionName} Money Financer`
          : (lender.institutionName || 'Business Money Financer');

        return (
          <div 
            onClick={handleApplyClick}
            className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0 w-full cursor-pointer z-10"
          >
            {/* Institution Brand Avatar / Logo */}
            <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300 overflow-hidden">
              <img
                src={!imgError ? effectiveLogo : DEFAULT_LENDER_PHOTO}
                alt={displayName}
                className="w-full h-full object-cover rounded-xl pointer-events-none"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Institution Information */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-heading leading-tight truncate group-hover:text-[#003893] transition-colors">
                  {displayName}
                </h3>
                <span className="badge-verified-green">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                  Verified Partner
                </span>
              </div>

              {/* Success Rate Badge */}
              <div className="flex items-center gap-2 text-xs flex-wrap pt-0.5">
                <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {lender.successRate
                      ? lender.successRate.toLowerCase().includes('success rate')
                        ? lender.successRate
                        : `${lender.successRate} Success Rate on Borrowing Money`
                      : '80% - 90% Success Rate on Borrowing Money'}
                  </span>
                </span>
              </div>

              {/* Money Range Tag & Distance */}
              <div className="flex items-center gap-2 text-xs flex-wrap pt-0.5">
                <span className="text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
                  <Coins className="w-3.5 h-3.5 text-[#003893] shrink-0" />
                  <span>Limit: ₹{minAmt} to ₹{maxAmt}</span>
                </span>

                {Number(lender.distanceKm) <= (Number(lender.lendingRadiusKm) || 50) ? (
                  <span className="text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-emerald-300 flex items-center gap-1.5 shadow-xs animate-pulse-subtle">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      {lender.distanceKm} KM away • {lender.place ? `${lender.place}, ` : ''}{lender.city} (Inside {lender.lendingRadiusKm || 50} KM Radius)
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-amber-300 flex items-center gap-1.5 shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      {lender.distanceKm} KM away • {lender.place ? `${lender.place}, ` : ''}{lender.city} ({lender.lendingRadiusKm || 50} KM Coverage • Outside Radius)
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Right Column: Apply Now, Phone Call & WhatsApp Message Buttons */}
      <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 z-10 min-w-[130px]">
        
        {/* Apply Now Button */}
        {hasApplied ? (
          <button
            type="button"
            onClick={handleApplyClick}
            className="py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Applied ✓</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplyClick}
            className="btn-sbni-blue text-xs py-2.5 px-4 font-extrabold justify-center flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl cursor-pointer"
          >
            {isSubscribed ? (
              <>
                <SendHorizontal className="w-4 h-4 text-blue-200 shrink-0" />
                <span>Apply Now</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Apply Now</span>
              </>
            )}
          </button>
        )}

        {/* Phone Call & WhatsApp Message Options - Always Visible */}
        {lender.contactUnlocked || isSubscribed ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCallClick}
              className="btn-call-outline text-xs justify-center flex-1 font-bold py-2 px-3 flex items-center gap-1 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="btn-whatsapp-outline text-xs justify-center flex-1 font-bold py-2 px-3 flex items-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenSubscription}
            className="text-[11px] font-extrabold text-blue-900 hover:text-blue-700 py-1 text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
            <span>Unlock Direct Contact</span>
          </button>
        )}
      </div>

    </div>
  );
};
