import React, { useState } from 'react';
import { SBNILogo } from '../components/SBNILogo';
import {
  X,
  User,
  Lock,
  Store,
  Building2,
  TrendingUp,
  ShieldCheck,
  Headphones,
  DollarSign,
  UserPlus,
  Eye,
  EyeOff,
  Zap,
  MapPin,
  Upload,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialRole?: Role;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'VENDOR',
}) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [isRegister, setIsRegister] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialRole) {
      setRole(initialRole);
      setIsRegister(false);
      setFormError(null);
    }
  }, [isOpen, initialRole]);

  // Login Form States
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Vendor Registration Specific Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  
  // File Uploads
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // Registration Passwords with Eye Toggles
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isVendor = role === 'VENDOR';

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: 'usr-' + Date.now(),
      name: role === 'VENDOR' ? 'Ramesh Kumar' : 'Rohit Sharma',
      email: emailOrPhone.includes('@') ? emailOrPhone : (role === 'VENDOR' ? 'vendor@sbnimoney.com' : 'lender@sbnimoney.com'),
      phone: emailOrPhone.includes('@') ? '+91 98765 43210' : emailOrPhone,
      role,
      isVerified: true,
      hasActiveSubscription: false,
    };

    localStorage.setItem('sbni_user', JSON.stringify(user));
    onAuthSuccess(user);
    onClose();
  };

  // Handle Vendor Registration Submit
  const handleVendorRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (regPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please verify your re-entered password.');
      return;
    }

    if (!panFile) {
      setFormError('Please upload your PAN card document to proceed.');
      return;
    }

    if (!aadhaarFile) {
      setFormError('Please upload your Aadhaar card document to proceed.');
      return;
    }

    const user = {
      id: 'usr-vendor-' + Date.now(),
      name: fullName || 'New Vendor',
      email: email,
      phone: phone,
      businessName: businessName,
      address: address,
      role: 'VENDOR',
      isVerified: true,
      hasActiveSubscription: false,
      panUploaded: true,
      aadhaarUploaded: true,
      licenseUploaded: !!licenseFile,
    };

    localStorage.setItem('sbni_user', JSON.stringify(user));
    onAuthSuccess(user);
    onClose();
  };

  // Demo Quick Logins
  const handleQuickVendorLogin = () => {
    const user = {
      id: 'usr-vendor-1',
      name: 'Ramesh Kumar',
      email: 'vendor@sbnimoney.com',
      phone: '+91 98765 43210',
      role: 'VENDOR' as const,
      isVerified: true,
      hasActiveSubscription: false,
    };
    localStorage.setItem('sbni_user', JSON.stringify(user));
    onAuthSuccess(user);
    onClose();
  };

  const handleQuickLenderLogin = () => {
    const user = {
      id: 'usr-lender-1',
      name: 'Rohit Sharma',
      email: 'lender@sbnimoney.com',
      phone: '+91 98200 11223',
      role: 'LENDER' as const,
      isVerified: true,
      hasActiveSubscription: false,
    };
    localStorage.setItem('sbni_user', JSON.stringify(user));
    onAuthSuccess(user);
    onClose();
  };

  const passwordsMatch = regPassword.length > 0 && confirmPassword.length > 0 && regPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && regPassword !== confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      
      {/* Modal Container */}
      <div className={`relative w-full ${isRegister && isVendor ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300`}>
        
        {/* Top Decorative Swoosh Accent Wave */}
        <div
          className={`absolute top-0 left-0 w-36 h-36 rounded-br-full opacity-90 pointer-events-none transition-colors ${
            isVendor ? 'bg-gradient-to-br from-[#003893] to-[#002669]' : 'bg-gradient-to-br from-[#007a33] to-[#005724]'
          }`}
        />

        {/* Bottom Decorative Swoosh Accent Wave */}
        <div
          className={`absolute bottom-0 right-0 w-36 h-36 rounded-tl-full opacity-90 pointer-events-none transition-colors ${
            isVendor ? 'bg-gradient-to-br from-[#003893] to-[#001f54]' : 'bg-gradient-to-br from-[#007a33] to-[#00471d]'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/90 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors shadow-sm"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 relative z-10 space-y-5">

          {/* Role Switcher Tabs */}
          <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => { setRole('VENDOR'); setFormError(null); }}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isVendor
                  ? 'bg-[#003893] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" /> Vendor Account
            </button>

            <button
              onClick={() => { setRole('LENDER'); setFormError(null); }}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                !isVendor
                  ? 'bg-[#007a33] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Lender Account
            </button>
          </div>

          {/* Large Central Brand Logo & Badge */}
          <div className="flex flex-col items-center justify-center pt-1 text-center space-y-2">
            <div className="flex justify-center">
              <SBNILogo imgClassName="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
            </div>

            {/* Screen Title */}
            <div>
              <h2
                className={`text-2xl font-extrabold font-heading tracking-tight ${
                  isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                }`}
              >
                {isRegister
                  ? isVendor
                    ? 'Vendor Business Sign Up'
                    : 'Lender Registration'
                  : isVendor
                  ? 'Vendor Login'
                  : 'Lender Login'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isRegister
                  ? isVendor
                    ? 'Enter your business details & documents to create your vendor profile'
                    : 'Register your lending institution'
                  : isVendor
                  ? 'Manage your business and grow with us'
                  : 'Lend smarter, grow stronger'}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* LOGIN FORM MODE */}
          {!isRegister && (
            <>
              {/* Quick One-Click Demo Login Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> 1-Click Quick Demo Login
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Ready Demo
                  </span>
                </div>

                {isVendor ? (
                  <button
                    type="button"
                    onClick={handleQuickVendorLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#003893] hover:bg-[#002d78] text-white text-xs font-bold flex items-center justify-between transition-all shadow-sm"
                  >
                    <div className="text-left">
                      <div className="font-extrabold">Vendor Demo (Ramesh Kumar)</div>
                      <div className="text-[10px] text-blue-100 font-normal">vendor@sbnimoney.com • Pass: vendor123</div>
                    </div>
                    <span className="bg-white/20 px-2.5 py-1 rounded text-[10px] font-bold">Login →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickLenderLogin}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#007a33] hover:bg-[#006329] text-white text-xs font-bold flex items-center justify-between transition-all shadow-sm"
                  >
                    <div className="text-left">
                      <div className="font-extrabold">Lender Demo (Rohit Sharma)</div>
                      <div className="text-[10px] text-emerald-100 font-normal">lender@sbnimoney.com • Pass: lender123</div>
                    </div>
                    <span className="bg-white/20 px-2.5 py-1 rounded text-[10px] font-bold">Login →</span>
                  </button>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Mobile / Email Input */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter Mobile Number / Email"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox & Forgot Password Link */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`rounded border-slate-300 focus:ring-0 ${
                        isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                      }`}
                    />
                    <span>Remember me</span>
                  </label>

                  <a
                    href="#forgot"
                    className={`font-bold hover:underline ${
                      isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                    }`}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Login Action Button */}
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all ${
                    isVendor
                      ? 'bg-[#003893] hover:bg-[#002669]'
                      : 'bg-[#007a33] hover:bg-[#005e27]'
                  }`}
                >
                  Login
                </button>
              </form>
            </>
          )}

          {/* VENDOR REGISTER FORM MODE */}
          {isRegister && isVendor && (
            <form onSubmit={handleVendorRegisterSubmit} className="space-y-4">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <User className="w-4 h-4" /> Personal & Contact Details
                </div>

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
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
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

                  {/* Email ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email ID *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Shop & Business Details */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <Store className="w-4 h-4" /> Shop / Business Information
                </div>

                {/* Shop / Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Business Name *</label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Kumar General & Retail Store"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                  </div>
                </div>

                {/* Manual Address Input Text Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      placeholder="Enter complete shop/business address manually (Plot/Shop No., Street, Area, City, Pincode)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Document Uploads */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <FileText className="w-4 h-4" /> KYC Document Uploads
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {panFile ? panFile.name : 'Upload PAN Card'}
                      </div>
                      <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 10MB</div>
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
                      <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card'}
                      </div>
                      <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 10MB</div>
                    </label>
                  </div>
                </div>

                {/* Business License Upload (Optional) */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-slate-800">Business License / GST</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && setLicenseFile(e.target.files[0])}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                    <div className="text-[11px] font-bold text-slate-700 truncate">
                      {licenseFile ? licenseFile.name : 'Upload Shop License / Trade License (Optional)'}
                    </div>
                    <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 10MB</div>
                  </label>
                </div>
              </div>

              {/* Section 4: Passwords */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                  <Lock className="w-4 h-4" /> Account Security & Password
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password Enter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Create Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showRegPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Re-enter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Re-enter Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-colors ${
                          passwordsMismatch
                            ? 'border-rose-400 focus:border-rose-500'
                            : passwordsMatch
                            ? 'border-emerald-400 focus:border-emerald-500'
                            : 'border-slate-300 focus:border-[#003893]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Password Verification Match Status Indicator */}
                {confirmPassword.length > 0 && (
                  <div className="text-[11px] font-bold flex items-center gap-1.5 pt-0.5">
                    {passwordsMatch ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Password matches correctly!
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Passwords do not match yet.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#003893] hover:bg-[#002669] mt-4 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Complete Vendor Registration
              </button>
            </form>
          )}

          {/* LENDER REGISTER FORM MODE */}
          {isRegister && !isVendor && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name / Contact Officer *</label>
                <input
                  type="text"
                  placeholder="Enter Contact Officer Name"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lending Institution Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Capital Finance NBFC Ltd."
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 98200 11223"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email ID *</label>
                  <input
                    type="email"
                    placeholder="lender@institution.com"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Re-enter Password *</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#007a33] hover:bg-[#005e27] mt-2"
              >
                Register as Lender
              </button>
            </form>
          )}

          {/* Mode Switch Toggle Button (Login vs Register) */}
          <div className="pt-2 text-center border-t border-slate-200">
            <button
              onClick={() => { setIsRegister(!isRegister); setFormError(null); }}
              className={`py-2 px-4 rounded-xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white ${
                isVendor
                  ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                  : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isRegister
                  ? 'Already have an account? Login Here'
                  : isVendor
                  ? 'New Vendor? Register Business Account'
                  : 'New Lender? Register Institution'}
              </span>
            </button>
          </div>

          {/* Benefits Cards Section */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isVendor
                ? 'bg-blue-50/70 border-blue-100'
                : 'bg-emerald-50/70 border-emerald-100'
            }`}
          >
            <div
              className={`text-xs font-extrabold text-center mb-3 ${
                isVendor ? 'text-[#003893]' : 'text-[#007a33]'
              }`}
            >
              {isVendor ? 'Benefits for Vendors' : 'Benefits for Lenders'}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              {isVendor ? (
                <>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <TrendingUp className="w-5 h-5 text-[#003893] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Grow Your Business</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <ShieldCheck className="w-5 h-5 text-[#003893] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Secure Transactions</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <Headphones className="w-5 h-5 text-[#003893] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Dedicated Support</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <DollarSign className="w-5 h-5 text-[#007a33] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Safe & Secure Investments</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <TrendingUp className="w-5 h-5 text-[#007a33] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Attractive Returns</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                    <ShieldCheck className="w-5 h-5 text-[#007a33] mx-auto" />
                    <div className="font-extrabold text-slate-800 leading-tight">Low Risk Portfolio</div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
