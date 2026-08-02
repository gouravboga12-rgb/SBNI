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
} from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [role, setRole] = useState<Role>('VENDOR');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isRegister, setIsRegister] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

  const isVendor = role === 'VENDOR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      
      {/* Modal Container with Rounded Curved Top/Bottom Accent Waves */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-y-auto overflow-x-hidden">
        
        {/* Top Decorative Swoosh Accent Wave matching image.png */}
        <div
          className={`absolute top-0 left-0 w-32 h-32 rounded-br-full opacity-90 pointer-events-none transition-colors ${
            isVendor ? 'bg-gradient-to-br from-[#003893] to-[#002669]' : 'bg-gradient-to-br from-[#007a33] to-[#005724]'
          }`}
        />

        {/* Bottom Decorative Swoosh Accent Wave matching image.png */}
        <div
          className={`absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-90 pointer-events-none transition-colors ${
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

          {/* Role Switcher Tabs (Vendor Login vs Lender Login) */}
          <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setRole('VENDOR')}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isVendor
                  ? 'bg-[#003893] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" /> Vendor Login
            </button>

            <button
              onClick={() => setRole('LENDER')}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                !isVendor
                  ? 'bg-[#007a33] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Lender Login
            </button>
          </div>

          {/* Large Central Brand Logo matching image.png */}
          <div className="flex flex-col items-center justify-center pt-1 text-center space-y-3">
            <div className="flex justify-center">
              <SBNILogo imgClassName="h-20 sm:h-24 w-auto object-contain drop-shadow-sm" />
            </div>

            {/* Circular Icon Badge matching image.png */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${
                isVendor
                  ? 'bg-blue-50 border-blue-200 text-[#003893]'
                  : 'bg-emerald-50 border-emerald-200 text-[#007a33]'
              }`}
            >
              {isVendor ? (
                <Store className="w-8 h-8 stroke-[2]" />
              ) : (
                <Building2 className="w-8 h-8 stroke-[2]" />
              )}
            </div>

            {/* Screen Titles matching image.png */}
            <div>
              <h2
                className={`text-2xl font-extrabold font-heading tracking-tight ${
                  isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                }`}
              >
                {isVendor ? 'Vendor Login' : 'Lender Login'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isVendor ? 'Manage your business and grow with us' : 'Lend smarter, grow stronger'}
              </p>
            </div>
          </div>

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

          {/* Form Fields matching image.png */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Checkbox & Forgot Password Link matching image.png */}
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

            {/* Login Action Button matching image.png */}
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

          {/* OR Divider matching image.png */}
          <div className="relative flex py-1 items-center justify-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-extrabold text-slate-400">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Register Button matching image.png */}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className={`w-full py-3 px-4 rounded-xl border-2 font-extrabold text-sm flex items-center justify-center gap-2 transition-all bg-white ${
              isVendor
                ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>{isVendor ? 'New Vendor? Register Now' : 'New Lender? Register Now'}</span>
          </button>

          {/* Benefits Cards Section matching image.png */}
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
