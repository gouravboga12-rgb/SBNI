import React, { useState, useEffect } from 'react';
import { Lender, VendorVerificationRequest } from '../types';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  IndianRupee,
  UploadCloud,
  CheckCircle2,
  FileText,
  AlertCircle,
  ShieldCheck,
  Send,
  CreditCard,
} from 'lucide-react';

interface LoanRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lender: Lender | null;
  onSuccess?: (request: VendorVerificationRequest) => void;
}

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  isOpen,
  onClose,
  lender,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [bankAccountDetails, setBankAccountDetails] = useState('');
  
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Auto-populate from logged in user if available
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setFormError(null);
      const storedUserStr = localStorage.getItem('sbni_user');
      if (storedUserStr) {
        try {
          const u = JSON.parse(storedUserStr);
          if (u.name) setFullName(u.name);
          if (u.phone) setPhone(u.phone);
          if (u.email) setEmail(u.email);
        } catch (e) {}
      }
    }
  }, [isOpen]);

  if (!isOpen || !lender) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your Full Name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your Phone Number.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter your Email ID.');
      return;
    }
    if (!requiredAmount.trim()) {
      setFormError('Please enter the Required Amount.');
      return;
    }
    if (!panFile) {
      setFormError('Please upload your PAN card document.');
      return;
    }
    if (!aadhaarFile) {
      setFormError('Please upload your Aadhaar card document.');
      return;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newRequest: VendorVerificationRequest = {
      id: 'req-' + Date.now(),
      vendorName: fullName,
      shopName: fullName + ' Enterprise',
      shopAddress: 'Commercial Market Area, City Center',
      city: lender.city || 'Mumbai',
      state: lender.state || 'Maharashtra',
      requestedDate: formattedDate,
      requestedTime: formattedTime,
      status: 'Pending',
      mobileNumber: phone,
      emailId: email,
      panNumber: panFile.name.replace(/\.[^/.]+$/, '').toUpperCase() || 'ABCDE1234F',
      aadhaarNumber: aadhaarFile.name ? 'XXXX-XXXX-8921' : '9876-5432-1098',
      requiredAmount: requiredAmount,
      lenderId: lender.id,
      lenderName: lender.institutionName,
      bankAccountDetails: bankAccountDetails || undefined,
      shopLicensePdf: 'license_document.pdf',
      gstCertificatePdf: 'gst_certificate.pdf',
    };

    // Save to localStorage so Lender Dashboard can read dynamic requests
    const existingStr = localStorage.getItem('sbni_vendor_requests');
    let existingList: VendorVerificationRequest[] = [];
    if (existingStr) {
      try {
        existingList = JSON.parse(existingStr);
      } catch (e) {}
    }
    const updatedList = [newRequest, ...existingList];
    localStorage.setItem('sbni_vendor_requests', JSON.stringify(updatedList));

    setSubmitted(true);
    if (onSuccess) {
      onSuccess(newRequest);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-y-auto overflow-x-hidden">
        
        {/* Top Decorative Wave */}
        <div className="absolute top-0 left-0 w-36 h-36 rounded-br-full bg-gradient-to-br from-[#003893] to-[#001f54] opacity-90 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/90 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors shadow-sm"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 relative z-10 space-y-5">

          {/* Lender Header Summary */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="w-12 h-12 rounded-2xl bg-[#003893] text-white flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
              {lender.logoUrl ? (
                <img src={lender.logoUrl} alt={lender.institutionName} className="w-full h-full object-contain p-1 rounded-2xl" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#003893] uppercase tracking-wider">Lender Partner</div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">{lender.institutionName}</h3>
              <div className="text-xs text-slate-500 font-medium">
                {lender.institutionType} • Max Loan: ₹{(lender.maxLoanAmount / 100000).toFixed(1)} Lakhs
              </div>
            </div>
          </div>

          {/* Screen Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Submit Loan Application Request
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Fill in your details below. Your loan application will be forwarded to {lender.institutionName} for verification.
            </p>
          </div>

          {/* Error Alert */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Success Screen */}
          {submitted ? (
            <div className="py-8 px-4 text-center space-y-4 bg-emerald-50/60 rounded-3xl border border-emerald-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">Loan Application Submitted!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your request for <strong className="text-emerald-700">₹{requiredAmount}</strong> has been successfully routed to <strong className="text-slate-900">{lender.institutionName}</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-xs text-left space-y-1 max-w-sm mx-auto">
                <div className="text-slate-500 font-medium">Status: <span className="font-bold text-amber-600">Pending Verification</span></div>
                <div className="text-slate-500 font-medium">Lender Contact: <span className="font-bold text-slate-900">{lender.phone}</span></div>
              </div>

              <button
                onClick={onClose}
                className="btn-sbni-blue w-full py-3 justify-center text-sm font-extrabold rounded-xl"
              >
                Done / Back to Dashboard
              </button>
            </div>
          ) : (
            /* Loan Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone Number / Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number / Mobile *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                  </div>
                </div>

                {/* Gmail / Email ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gmail / Email ID *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Required Amount Field - EXACT Label: "Required Amount" */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Amount *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    placeholder="Enter required loan amount (e.g. 250000)"
                    value={requiredAmount}
                    onChange={(e) => setRequiredAmount(e.target.value)}
                    required
                    min="1000"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                  />
                </div>
              </div>

              {/* Document Uploads Grid (PAN & Aadhaar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* PAN Card Upload */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-slate-800">PAN Card *</span>
                    {panFile ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 font-bold">Required</span>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && setPanFile(e.target.files[0])}
                      className="hidden"
                    />
                    <UploadCloud className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-slate-700 truncate">
                      {panFile ? panFile.name : 'Upload PAN Card'}
                    </div>
                    <div className="text-[9px] text-slate-400">PDF, JPG, PNG</div>
                  </label>
                </div>

                {/* Aadhaar Card Upload */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-slate-800">Aadhaar Card *</span>
                    {aadhaarFile ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-600 font-bold">Required</span>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && setAadhaarFile(e.target.files[0])}
                      className="hidden"
                    />
                    <UploadCloud className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-slate-700 truncate">
                      {aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card'}
                    </div>
                    <div className="text-[9px] text-slate-400">PDF, JPG, PNG</div>
                  </label>
                </div>
              </div>

              {/* Bank Account Details (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Bank Account Details</label>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Optional</span>
                </div>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. A/C No: 1234567890, IFSC: SBIN0001234"
                    value={bankAccountDetails}
                    onChange={(e) => setBankAccountDetails(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#003893] hover:bg-[#002669] mt-2 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Loan Application to {lender.institutionName}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
