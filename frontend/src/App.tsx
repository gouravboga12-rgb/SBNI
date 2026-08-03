import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { VendorDashboard } from './pages/VendorDashboard';
import { LenderDashboard } from './pages/LenderDashboard';
import { AuthModal } from './pages/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { KYCModal } from './components/KYCModal';
import { SupportModal } from './components/SupportModal';
import { TermsModal } from './components/TermsModal';
import { fetchLenders } from './services/api';
import { Lender } from './types';

export function App() {
  const [currentRole, setCurrentRole] = useState<'VENDOR' | 'LENDER'>('VENDOR');
  const [vendorActiveTab, setVendorActiveTab] = useState<'home' | 'lenders' | 'requests' | 'profile'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'VENDOR' | 'LENDER'>('VENDOR');

  const checkSubscription = (role: 'VENDOR' | 'LENDER') => {
    if (role === 'LENDER') {
      return localStorage.getItem('sbni_lender_subscribed') === 'true';
    }
    return (
      localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true'
    );
  };

  const loadData = () => {
    fetchLenders().then((res) => {
      setLenders(res.lenders);
    });
  };

  useEffect(() => {
    const isSub = checkSubscription(currentRole);
    setHasActiveSubscription(isSub);
    loadData();

    const storedUser = localStorage.getItem('sbni_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        if (u.role === 'LENDER') {
          setCurrentRole('LENDER');
        }
      } catch (e) {}
    }
  }, [currentRole]);

  const handleRoleSwitch = (role: 'VENDOR' | 'LENDER') => {
    setCurrentRole(role);
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    const role = user.role === 'LENDER' ? 'LENDER' : 'VENDOR';
    setCurrentRole(role);
    setHasActiveSubscription(checkSubscription(role));
    setAuthModalOpen(false);
    loadData();
  };

  const handleSubscriptionSuccess = () => {
    setSubModalOpen(false);
    setHasActiveSubscription(true);
    loadData();
  };

  const handleNavigateHome = () => {
    setVendorActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateLenders = () => {
    setVendorActiveTab('lenders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = (roleTarget?: 'VENDOR' | 'LENDER') => {
    const targetRole = roleTarget || currentRole;
    localStorage.removeItem('sbni_user');
    localStorage.removeItem('sbni_token');
    localStorage.removeItem('sbni_subscribed');
    localStorage.removeItem('sbni_vendor_subscribed');
    localStorage.removeItem('sbni_lender_subscribed');
    setCurrentUser(null);
    setCurrentRole(targetRole);
    setAuthRole(targetRole);
    setVendorActiveTab('home');
    setHasActiveSubscription(false);
    setAuthModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      
      {/* Top Header Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onOpenAuth={() => {
          setAuthRole(currentRole);
          setAuthModalOpen(true);
        }}
        onOpenSubscription={() => setSubModalOpen(true)}
        onOpenKYC={() => setKycModalOpen(true)}
        onOpenSupport={() => setSupportModalOpen(true)}
        onOpenTerms={() => setTermsModalOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateLenders={handleNavigateLenders}
        hasActiveSubscription={hasActiveSubscription}
        currentUser={currentUser}
      />

      {/* Main Role View Container */}
      <main className="flex-grow pb-20 lg:pb-0">
        {currentRole === 'VENDOR' ? (
          <VendorDashboard
            lenders={lenders}
            onOpenSubscription={() => setSubModalOpen(true)}
            activeTab={vendorActiveTab}
            onTabChange={setVendorActiveTab}
            onLogout={handleLogout}
          />
        ) : (
          <LenderDashboard
            onOpenSubscription={() => setSubModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialRole={authRole}
      />

      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        userRole={currentRole}
      />

      <KYCModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
      />

      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

    </div>
  );
}

export default App;
