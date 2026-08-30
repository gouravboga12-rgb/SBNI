import React, { useState } from 'react';
import { SBNILogo } from './SBNILogo';
import {
  Menu,
  Bell,
  UserCheck,
  Building2,
  Store,
  X,
  Home,
  Zap,
  FileText,
  LogOut,
  ChevronRight,
  User,
  Gift,
  Sparkles,
} from 'lucide-react';
import { ReferAndEarnModal } from './ReferAndEarnModal';

interface NavbarProps {
  currentRole: 'VENDOR' | 'LENDER';
  onRoleSwitch: (role: 'VENDOR' | 'LENDER') => void;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
  onOpenKYC?: () => void;
  onOpenSupport?: () => void;
  onOpenTerms: () => void;
  onNavigateHome: () => void;
  onNavigateLenders: () => void;
  onNavigateProfile?: () => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
  hasActiveSubscription: boolean;
  currentUser: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleSwitch,
  onOpenAuth,
  onOpenSubscription,
  onOpenKYC,
  onOpenSupport,
  onOpenTerms,
  onNavigateHome,
  onNavigateLenders,
  onNavigateProfile,
  onLogout,
  hasActiveSubscription,
  currentUser,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [referModalOpen, setReferModalOpen] = useState(false);

  const isVendor = currentRole === 'VENDOR';

  const handleNavClick = (action?: () => void) => {
    setDrawerOpen(false);
    if (action) action();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-22 py-2">
            
            {/* Left Side: Hamburger Menu + Big Company Logo */}
            <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 sm:p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 shrink-0"
                title="Open Navigation Menu"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div onClick={() => handleNavClick(onNavigateHome)} className="cursor-pointer min-w-0 max-w-[210px] sm:max-w-none flex items-center">
                <SBNILogo
                  imgClassName="h-12 sm:h-18 md:h-20 w-auto object-contain transition-transform hover:scale-105"
                  style={{ maxHeight: '72px' }}
                />
              </div>
            </div>

            {/* Right Side: Account Role Badge, Subscription Status & Login Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* Account Role Badge */}
              {currentUser && (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-sm"
                  style={{
                    backgroundColor: isVendor ? '#eff6ff' : '#ecfdf5',
                    borderColor: isVendor ? '#bfdbfe' : '#a7f3d0',
                    color: isVendor ? '#003893' : '#047857',
                  }}
                >
                  {isVendor ? (
                    <>
                      <Store className="w-4 h-4 text-[#003893]" />
                      <span>Small Shop / Local Startup (Vendors)</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 text-[#047857]" />
                      <span>Business Money Financer Account</span>
                    </>
                  )}
                </div>
              )}

              {/* Subscription Upgrade / Status Trigger Button */}
              <button
                onClick={onOpenSubscription}
                className={`text-[11px] sm:text-xs font-extrabold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border flex items-center gap-1 transition-all shadow-sm shrink-0 ${
                  hasActiveSubscription
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 hover:opacity-95'
                }`}
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                <span className="sm:hidden">{hasActiveSubscription ? 'Active' : 'Pay Sub'}</span>
                <span className="hidden sm:inline">{hasActiveSubscription ? '✓ Plan Active' : 'Pay Subscription'}</span>
              </button>

              {/* Notification Bell */}
              <div className="relative cursor-pointer p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
                <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  3
                </span>
              </div>

              {/* Account Login / Profile Button */}
              {currentUser ? (
                <button
                  onClick={onNavigateProfile}
                  className="text-xs font-bold p-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-50/90 hover:bg-blue-100/90 text-[#003893] border border-blue-200/90 transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer shadow-xs"
                  title="View Profile & Account Settings"
                >
                  <div className="w-5 h-5 rounded-full bg-[#003893] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                    {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[150px] truncate font-bold text-slate-800">
                    {currentUser.name || currentUser.fullName || currentUser.email || 'Profile'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="text-xs font-bold p-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Sign In / Register"
                >
                  <UserCheck className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-slate-600" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Sidebar Content */}
          <div className="relative z-10 w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Drawer Top Header with Logo and Close X Button */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <SBNILogo imgClassName="h-12 sm:h-14 w-auto object-contain" style={{ maxHeight: '52px' }} />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active User Card / Guest Login Prompt */}
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                {currentUser ? (
                  <div
                    onClick={() => handleNavClick(onNavigateProfile)}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors"
                    title="Click to view full profile"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-sm shrink-0"
                      style={{ backgroundColor: isVendor ? '#003893' : '#059669' }}
                    >
                      {currentUser.name ? currentUser.name[0] : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 text-sm truncate">{currentUser.name || currentUser.email}</div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize truncate">{currentUser.role === 'VENDOR' ? 'Small Shop / Startup' : 'Business Financer'}</span>
                        <span className="text-slate-300">•</span>
                        <span className={hasActiveSubscription ? 'text-emerald-600 font-bold shrink-0' : 'text-amber-600 font-bold shrink-0'}>
                          {hasActiveSubscription ? 'Subscribed' : 'Free Tier'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <div className="text-xs font-bold text-slate-800">Welcome to Just Paisa App</div>
                    <button
                      onClick={() => handleNavClick(onOpenAuth)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      Sign In / Register Account
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Menu Nav Items */}
              <nav className="p-4 space-y-1.5">
                
                {/* 1. Dashboard Home */}
                <button
                  onClick={() => handleNavClick(onNavigateHome)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-900 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span>Dashboard Home</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 2. My Profile & Settings */}
                {currentUser && (
                  <button
                    onClick={() => handleNavClick(onNavigateProfile)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-[#003893] text-xs font-bold transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[#003893]" />
                      <span>My Profile & Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {/* 3. Subscription Plans */}
                <button
                  onClick={() => handleNavClick(onOpenSubscription)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 text-amber-900 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Subscription Plans (5 Tiers)</span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                    {hasActiveSubscription ? 'Active' : 'Upgrade'}
                  </span>
                </button>

                {/* 4. Refer & Earn */}
                <button
                  onClick={() => {
                    if (!currentUser && onOpenAuth) {
                      handleNavClick(onOpenAuth);
                    } else {
                      setDrawerOpen(false);
                      setReferModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 text-purple-900 text-xs font-bold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span>Refer & Earn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Rewards
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>

                {/* 5. Find Nearby Lenders / Verification Requests */}
                <button
                  onClick={() => handleNavClick(onNavigateLenders)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isVendor ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Store className="w-4 h-4 text-blue-600" />}
                    <span>{isVendor ? 'Business Money Financers (Lenders)' : 'Shop / Startup Business Requests'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 6. Terms & Privacy Policy */}
                <button
                  onClick={() => handleNavClick(onOpenTerms)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Terms & Privacy Policy</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </nav>

            </div>

            {/* Bottom Drawer Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              {currentUser ? (
                <>
                  <button
                    onClick={() => handleNavClick(() => onLogout && onLogout(currentRole))}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Log Out Account</span>
                  </button>

                  <button
                    onClick={() => handleNavClick(onOpenAuth)}
                    className="w-full py-2 px-3 rounded-xl text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Switch / Login Another Account</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNavClick(onOpenAuth)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Sign In / Register</span>
                </button>
              )}

              <div className="text-[10px] text-slate-400 text-center">
                Just Paisa App v1.0 • Enterprise FinTech Platform
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Drawer Refer & Earn Modal */}
      <ReferAndEarnModal
        isOpen={referModalOpen}
        onClose={() => setReferModalOpen(false)}
        userRole={currentRole}
        userName={currentUser?.name || currentUser?.fullName || 'Partner'}
      />
    </>
  );
};
