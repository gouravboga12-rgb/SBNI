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
  Camera,
  ArrowLeft,
} from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialRole?: Role;
  initialRegister?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'VENDOR',
  initialRegister = false,
}) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [viewStep, setViewStep] = useState<'SELECT' | 'FORM'>('SELECT');

  React.useEffect(() => {
    if (isOpen) {
      setRole(initialRole || 'VENDOR');
      setIsRegister(!!initialRegister);
      setViewStep(initialRegister ? 'FORM' : 'SELECT');
      setFormError(null);
    }
  }, [isOpen, initialRole, initialRegister]);

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [liveSelfieFile, setLiveSelfieFile] = useState<File | null>(null);

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

    if (!photoFile) {
      setFormError('Please upload your passport size photo / profile photo to proceed.');
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

    if (!shopPhotoFile) {
      setFormError('Please upload your Shop / Home Business photo to proceed.');
      return;
    }

    if (!liveSelfieFile) {
      setFormError('Please upload a Live photo with person standing in front of shop or home business.');
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
      photoUploaded: true,
      avatarUrl: photoFile ? URL.createObjectURL(photoFile) : undefined,
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

        {viewStep === 'SELECT' ? (
          /* STEP 1: LANDING ACCOUNT SELECTION VIEW */
          <div className="p-6 sm:p-8 relative z-10 space-y-6">
            
            {/* Central Brand Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
              <div className="flex justify-center">
                <SBNILogo imgClassName="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Welcome to Just Paisa
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose your account type below to Login or Sign Up
                </p>
              </div>
            </div>

            {/* TOP HALF CARD: Small Shop Business */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-blue-50/40 border-2 border-blue-200/80 shadow-md space-y-4 hover:border-[#003893] transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#003893] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#003893] font-heading leading-snug">
                    Small Shop Business
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Any shop or home business can login to check nearby business financers for money
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole('VENDOR');
                    setIsRegister(false);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-xs sm:text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <User className="w-4 h-4 shrink-0" /> Login as Shop or Home Business Owner
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('VENDOR');
                    setIsRegister(true);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-white hover:bg-blue-50 text-[#003893] border-2 border-[#003893] font-extrabold text-xs sm:text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Sign Up as Shop or Home Business Owner
                </button>
              </div>
            </div>

            {/* BOTTOM HALF CARD: Business Money Financer */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-emerald-50/40 border-2 border-emerald-200/80 shadow-md space-y-4 hover:border-[#007a33] transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#007a33] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#007a33] font-heading leading-snug">
                    Business Money Financer
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Sign up as a business money financer to provide money & capital directly to verified local shops and home businesses nearby
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole('LENDER');
                    setIsRegister(false);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  <User className="w-4 h-4 shrink-0" /> Login as Money Financer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('LENDER');
                    setIsRegister(true);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#007a33] border-2 border-[#007a33] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Sign Up as Money Financer
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* STEP 2: DEDICATED FORM VIEW */
          <div className="p-6 sm:p-8 relative z-10 space-y-5">

            {/* Back Navigation Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setViewStep('SELECT');
                  setFormError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>← Back to Choose Account</span>
              </button>

              <div
                className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-xs"
                style={{
                  backgroundColor: isVendor ? '#eff6ff' : '#ecfdf5',
                  borderColor: isVendor ? '#bfdbfe' : '#a7f3d0',
                  color: isVendor ? '#003893' : '#007a33',
                }}
              >
                {isVendor ? 'Small Shop Business' : 'Business Financer'}
              </div>
            </div>

            {/* Large Central Brand Logo & Title */}
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
                      ? 'Shop / Home Business Owner Sign Up'
                      : 'Business Money Financer Registration'
                    : isVendor
                    ? 'Shop / Home Business Owner Login'
                    : 'Business Money Financer Login'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isRegister
                    ? isVendor
                      ? 'Enter your shop or home business details & verification documents to create your account'
                      : 'Sign up as a business money financer to provide money & capital to verified shop or home business owners'
                    : isVendor
                    ? 'Login as shop or home business owner to check nearby business financers for money'
                    : 'Login as business money financer to provide money & capital to verified small businesses'}
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
                        <div className="font-extrabold">Small Shop Business Demo (Ramesh Kumar - Shop Owner)</div>
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
                        <div className="font-extrabold">Business Financer Demo (Rohit Sharma - Capital Financer)</div>
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
                    <FileText className="w-4 h-4" /> Photo & KYC Document Uploads
                  </div>

                  {/* Passport / Profile Photo Upload */}
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <Camera className="w-4 h-4 text-[#003893]" />
                        Passport Size Photo / Profile Photo *
                      </span>
                      {photoFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Photo Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    <label className="border-2 border-dashed border-blue-300 hover:border-[#003893] rounded-xl p-3 text-center cursor-pointer block bg-white transition-colors shadow-inner">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])}
                        className="hidden"
                      />
                      {photoFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={URL.createObjectURL(photoFile)}
                            alt="Vendor Photo Preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#003893] shadow-md"
                          />
                          <div className="text-left">
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{photoFile.name}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold">Click to change photo</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Camera className="w-6 h-6 text-[#003893] mx-auto mb-1" />
                          <div className="text-xs font-bold text-slate-800">
                            Upload Vendor Photo (Passport Size) *
                          </div>
                          <div className="text-[9px] text-slate-400">JPG, PNG, WEBP up to 10MB</div>
                        </div>
                      )}
                    </label>
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

                  {/* Shop / Home Business Photo Upload */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">Shop / Home Business Photo *</span>
                      {shopPhotoFile ? (
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
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && setShopPhotoFile(e.target.files[0])}
                        className="hidden"
                      />
                      <Camera className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {shopPhotoFile ? shopPhotoFile.name : 'Upload Shop / Business Photo'}
                      </div>
                      <div className="text-[9px] text-slate-400">Shop Exterior / Interior Photo</div>
                    </label>
                  </div>

                  {/* Live Photo with Person in Front of Shop / Home Business */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">Live Photo in Front of Shop *</span>
                      {liveSelfieFile ? (
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
                        accept="image/*"
                        capture="user"
                        onChange={(e) => e.target.files?.[0] && setLiveSelfieFile(e.target.files[0])}
                        className="hidden"
                      />
                      <Camera className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {liveSelfieFile ? liveSelfieFile.name : 'Live Photo with Person in Front'}
                      </div>
                      <div className="text-[9px] text-slate-400">Person Standing in Front of Shop</div>
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
                  <UserPlus className="w-5 h-5" /> Complete Small Business Registration
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Financing Institution / Company *</label>
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
                  className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#007a33] hover:bg-[#005e27] mt-2 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" /> Register as Business Financer
                </button>
              </form>
            )}

            {/* Bottom Form Navigation Links (Sign Up Link below Login, or Login Link below Sign Up) */}
            <div className="pt-3 text-center border-t border-slate-200 space-y-2">
              {!isRegister ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Don't have a {isVendor ? 'Small Business (Vendor)' : 'Business Financer'} account yet?
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setFormError(null); }}
                    className={`py-2.5 px-4 rounded-xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white shadow-xs ${
                      isVendor
                        ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                        : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isVendor ? 'Sign Up as Small Business (Vendor)' : 'Sign Up as Business Financer (Lender)'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Already registered?
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setFormError(null); }}
                    className={`py-2.5 px-4 rounded-xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white shadow-xs ${
                      isVendor
                        ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                        : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>
                      {isVendor ? 'Login as Small Business (Vendor)' : 'Login as Business Financer (Lender)'}
                    </span>
                  </button>
                </div>
              )}

              {/* Direct Switch to other Role */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole(isVendor ? 'LENDER' : 'VENDOR');
                    setFormError(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  {isVendor ? 'Are you a Business Financer (Lender)? Click here' : 'Are you a Small Business (Vendor)? Click here'}
                </button>
              </div>
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
                {isVendor ? 'Benefits for Small Businesses (Vendors)' : 'Benefits for Business Financers (Lenders)'}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                {isVendor ? (
                  <>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <TrendingUp className="w-5 h-5 text-[#003893] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Grow Your Shop / Business</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <ShieldCheck className="w-5 h-5 text-[#003893] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Direct Financer Connect</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <Headphones className="w-5 h-5 text-[#003893] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Dedicated Help & Support</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <DollarSign className="w-5 h-5 text-[#007a33] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Verified Business Borrowers</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <TrendingUp className="w-5 h-5 text-[#007a33] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Attractive Financing Yields</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl shadow-xs space-y-1">
                      <ShieldCheck className="w-5 h-5 text-[#007a33] mx-auto" />
                      <div className="font-extrabold text-slate-800 leading-tight">Risk Managed Loans</div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
