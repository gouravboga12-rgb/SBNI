import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { VendorDashboard } from './pages/VendorDashboard';
import { LenderDashboard } from './pages/LenderDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './pages/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { KYCModal } from './components/KYCModal';
import { SupportModal } from './components/SupportModal';
import { TermsModal } from './components/TermsModal';
import {
  fetchLenders,
  fetchCurrentUser,
  checkSubscriptionStatus,
  logoutUser,
  getToken,
  safeSetLocalStorage,
} from './services/api';
import { Lender } from './types';

export function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  );
  const [currentRole, setCurrentRole] = useState<'VENDOR' | 'LENDER'>('VENDOR');
  const [vendorActiveTab, setVendorActiveTab] = useState<'home' | 'lenders' | 'requests' | 'profile'>('home');
  const [lenderActiveTab, setLenderActiveTab] = useState<'home' | 'businesses' | 'reports' | 'profile'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'VENDOR' | 'LENDER'>('VENDOR');
  const [authSubscribeIntent, setAuthSubscribeIntent] = useState<boolean>(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Listen for admin route changes and capture referral query param
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('referral');
      if (ref && ref.trim()) {
        localStorage.setItem('sbni_referral_code', ref.trim().toUpperCase());
      }
    } catch {}

    const handleLocationCheck = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handleLocationCheck);
    return () => window.removeEventListener('popstate', handleLocationCheck);
  }, []);

  // On mount: restore session from JWT token (AWS-verified)
  useEffect(() => {
    const initSession = async () => {
      setIsLoadingUser(true);
      const token = getToken();

      if (token) {
        // Verify token with AWS backend
        const user = await fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          const role = user.role === 'LENDER' ? 'LENDER' : 'VENDOR';
          setCurrentRole(role);

          // Check real subscription status from AWS & local state
          const isSubscribedLocally = localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
                                      localStorage.getItem('sbni_subscribed') === 'true';
          const subStatus = await checkSubscriptionStatus();
          const isSub = subStatus.isActive || isSubscribedLocally;

          setHasActiveSubscription(isSub);
          if (isSub) {
            safeSetLocalStorage('sbni_subscribed', 'true');
            safeSetLocalStorage('sbni_vendor_subscribed', 'true');
            safeSetLocalStorage('sbni_lender_subscribed', 'true');
            window.dispatchEvent(new Event('sbni_subscription_updated'));
          }
        } else {
          // Token invalid/expired — clear it
          logoutUser();
          setCurrentUser(null);
          setHasActiveSubscription(false);
        }
      } else {
        // Check local mock subscription fallback if any
        const isSubscribedLocally = localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
                                    localStorage.getItem('sbni_subscribed') === 'true';
        setHasActiveSubscription(isSubscribedLocally);
      }

      setIsLoadingUser(false);
    };

    initSession();
  }, []);

  // Listen for live profile updates across Vendor and Financer dashboards
  useEffect(() => {
    const handleProfileSync = () => {
      try {
        const token = getToken();
        const u = localStorage.getItem('sbni_user');
        if (token && u) {
          setCurrentUser(JSON.parse(u));
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener('sbni_vendor_profile_updated', handleProfileSync);
    window.addEventListener('sbni_lender_profile_updated', handleProfileSync);
    window.addEventListener('sbni_auth_changed', handleProfileSync);
    window.addEventListener('storage', handleProfileSync);
    return () => {
      window.removeEventListener('sbni_vendor_profile_updated', handleProfileSync);
      window.removeEventListener('sbni_lender_profile_updated', handleProfileSync);
      window.removeEventListener('sbni_auth_changed', handleProfileSync);
      window.removeEventListener('storage', handleProfileSync);
    };
  }, []);

  // Listen for subscription status updates across tabs / events
  useEffect(() => {
    const syncSubStatus = async () => {
      const isSubscribedLocally =
        localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
        localStorage.getItem('sbni_subscribed') === 'true' ||
        localStorage.getItem('sbni_lender_subscribed') === 'true';
      const token = getToken();
      if (token) {
        const subStatus = await checkSubscriptionStatus();
        setHasActiveSubscription(subStatus.isActive || isSubscribedLocally);
      } else {
        setHasActiveSubscription(isSubscribedLocally);
      }
    };

    window.addEventListener('sbni_subscription_updated', syncSubStatus);
    window.addEventListener('sbni_auth_changed', syncSubStatus);
    window.addEventListener('storage', syncSubStatus);
    return () => {
      window.removeEventListener('sbni_subscription_updated', syncSubStatus);
      window.removeEventListener('sbni_auth_changed', syncSubStatus);
      window.removeEventListener('storage', syncSubStatus);
    };
  }, []);

  // Load lenders from AWS whenever role changes
  const loadLenders = async () => {
    try {
      let lat = 17.3850;
      let lng = 78.4867;
      const vp = localStorage.getItem('sbni_vendor_profile');
      if (vp) {
        const parsed = JSON.parse(vp);
        if (parsed.latitude) lat = Number(parsed.latitude);
        if (parsed.longitude) lng = Number(parsed.longitude);
      }
      const res = await fetchLenders({ userLat: lat, userLng: lng });
      if (res.lenders) {
        setLenders(res.lenders);
      }
    } catch (e) {
      console.error('Failed to load lenders in App:', e);
    }
  };

  useEffect(() => {
    loadLenders();
  }, [currentRole]);

  const handleRoleSwitch = (role: 'VENDOR' | 'LENDER') => {
    if (!currentUser) {
      setCurrentRole(role);
    }
  };

  const handleOpenSubscription = () => {
    if (!currentUser) {
      // If logged out: ask whether to login as Small Shop Business or Business Money Financer
      setAuthSubscribeIntent(true);
      setAuthRole(currentRole);
      setAuthModalOpen(true);
    } else {
      setSubModalOpen(true);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);
    const role = user.role === 'LENDER' ? 'LENDER' : 'VENDOR';
    setCurrentRole(role);
    setAuthModalOpen(false);

    // Check real subscription status from AWS after login
    const isSubscribedLocally = localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
                                localStorage.getItem('sbni_subscribed') === 'true';
    const subStatus = await checkSubscriptionStatus();
    const isSub = subStatus.isActive || isSubscribedLocally;

    setHasActiveSubscription(isSub);
    if (isSub) {
      safeSetLocalStorage('sbni_subscribed', 'true');
      safeSetLocalStorage('sbni_vendor_subscribed', 'true');
      safeSetLocalStorage('sbni_lender_subscribed', 'true');
      window.dispatchEvent(new Event('sbni_subscription_updated'));
    }
    loadLenders();

    // If user clicked subscribe while logged out, proceed to subscription modal after successful login
    if (authSubscribeIntent) {
      setAuthSubscribeIntent(false);
      setSubModalOpen(true);
    }
  };

  const handleSubscriptionSuccess = async () => {
    setSubModalOpen(false);
    setHasActiveSubscription(true);
    safeSetLocalStorage('sbni_subscribed', 'true');
    safeSetLocalStorage('sbni_vendor_subscribed', 'true');
    safeSetLocalStorage('sbni_lender_subscribed', 'true');
    window.dispatchEvent(new Event('sbni_subscription_updated'));
    loadLenders();
  };

  const handleNavigateHome = () => {
    setVendorActiveTab('home');
    setLenderActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateLenders = () => {
    if (!currentUser) {
      setAuthSubscribeIntent(false);
      setAuthRole('VENDOR');
      setAuthModalOpen(true);
      return;
    }
    if (!hasActiveSubscription) {
      setSubModalOpen(true);
      return;
    }
    setVendorActiveTab('lenders');
    setLenderActiveTab('businesses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateProfile = () => {
    if (currentRole === 'VENDOR') {
      setVendorActiveTab('profile');
    } else {
      setLenderActiveTab('profile');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = (roleTarget?: 'VENDOR' | 'LENDER') => {
    const targetRole = roleTarget || currentRole;
    // Clear all auth data from localStorage and memory
    logoutUser();
    localStorage.removeItem('sbni_subscribed');
    localStorage.removeItem('sbni_vendor_subscribed');
    localStorage.removeItem('sbni_lender_subscribed');

    setCurrentUser(null);
    setHasActiveSubscription(false);
    setCurrentRole(targetRole);
    setAuthRole(targetRole);
    setAuthSubscribeIntent(false);
    setVendorActiveTab('home');
    setLenderActiveTab('home');
    setAuthModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAdminRoute) {
    return (
      <AdminDashboard
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // Loading state
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#003893] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Connecting to JustPaisa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">

      {/* Top Header Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onOpenAuth={() => {
          setAuthSubscribeIntent(false);
          setAuthRole(currentRole);
          setAuthModalOpen(true);
        }}
        onOpenSubscription={handleOpenSubscription}
        onOpenKYC={() => setKycModalOpen(true)}
        onOpenSupport={() => setSupportModalOpen(true)}
        onOpenTerms={() => setTermsModalOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateLenders={handleNavigateLenders}
        onNavigateProfile={handleNavigateProfile}
        onLogout={handleLogout}
        hasActiveSubscription={hasActiveSubscription}
        currentUser={currentUser}
      />

      {/* Main Role View Container */}
      <main className="flex-grow pb-20 lg:pb-0">
        {currentRole === 'VENDOR' ? (
          <VendorDashboard
            lenders={lenders}
            onOpenSubscription={handleOpenSubscription}
            hasActiveSubscription={hasActiveSubscription}
            activeTab={vendorActiveTab}
            onTabChange={setVendorActiveTab}
            onLogout={handleLogout}
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthSubscribeIntent(false);
              setAuthRole('VENDOR');
              setAuthModalOpen(true);
            }}
          />
        ) : (
          <LenderDashboard
            onOpenSubscription={handleOpenSubscription}
            activeTab={lenderActiveTab}
            onTabChange={setLenderActiveTab}
            onLogout={handleLogout}
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthSubscribeIntent(false);
              setAuthRole('LENDER');
              setAuthModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthSubscribeIntent(false);
        }}
        onAuthSuccess={handleAuthSuccess}
        initialRole={authRole}
        subscribeIntent={authSubscribeIntent}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        userRole={currentRole}
      />

      {/* KYC Modal */}
      <KYCModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      {/* Terms Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

    </div>
  );
}

export default App;
