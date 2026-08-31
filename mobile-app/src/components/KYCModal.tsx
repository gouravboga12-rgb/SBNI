import React, { useState } from 'react';
import { ShieldCheck, UploadCloud, X, CheckCircle2, FileText } from 'lucide-react';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose }) => {
  const [docType, setDocType] = useState('GST_CERTIFICATE');
  const [docNumber, setDocNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('https://storage.sbnimoney.com/kyc/sample_gst.pdf');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Digital KYC Verification</h2>
            <p className="text-xs text-slate-400">Upload business credentials for verified lender trust badge</p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">KYC Document Uploaded!</h3>
            <p className="text-xs text-slate-300">Verification in progress by JustPaisa Compliance Team.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="input-glass text-sm bg-slate-900"
              >
                <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                <option value="PAN">PAN Card (Business / Proprietor)</option>
                <option value="AADHAAR">Aadhaar Card (Owner Verification)</option>
                <option value="BUSINESS_PROOF">Shop & Establishment / MSME Udyam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Registration Number</label>
              <input
                type="text"
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                required
                className="input-glass text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Upload Digital File (PDF / JPG)</label>
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-900/50 transition-colors">
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-xs text-slate-300 font-medium">Click to select or drag PDF file here</div>
                <div className="text-[10px] text-slate-500 mt-1">Maximum file size: 5 MB</div>
              </div>
            </div>

            <button type="submit" className="btn-emerald w-full py-3 justify-center text-sm font-bold mt-2">
              Submit Document for Verification
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
