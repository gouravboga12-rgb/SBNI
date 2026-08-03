import React, { useState } from 'react';
import { User } from '../types';
import { Zap, ShieldCheck, Download, Bell, LifeBuoy, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  currentUser: User | null;
  hasActiveSubscription: boolean;
  onOpenSubscription: () => void;
  onOpenKYC: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  hasActiveSubscription,
  onOpenSubscription,
  onOpenKYC,
}) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setTicketSubmitted(false);
    }, 3000);
  };

  return (
    <div className="py-10 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-white font-heading">User Account Dashboard</h1>
              <span className="bg-cyan-500/10 text-cyan-400 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30">
                {currentUser?.role || 'VENDOR'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Account: {currentUser?.email || 'vendor@enterprise.com'} • Mobile: {currentUser?.phone || '+91 9876543210'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onOpenKYC} className="btn-secondary py-2 px-4 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Digital KYC Status</span>
            </button>
            {!hasActiveSubscription && (
              <button onClick={onOpenSubscription} className="btn-primary py-2 px-4 text-xs">
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Upgrade Subscription</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Subscription Status Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Marketplace Subscription Status</div>
                  <h3 className="text-xl font-bold text-white font-heading mt-0.5">
                    {hasActiveSubscription ? 'Monthly Growth Plan (ACTIVE)' : 'No Active Subscription'}
                  </h3>
                </div>
                {hasActiveSubscription ? (
                  <span className="badge-verified">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Unlocked
                  </span>
                ) : (
                  <span className="badge-locked">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Locked
                  </span>
                )}
              </div>

              {hasActiveSubscription ? (
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Valid Until:</span>
                    <span className="text-white font-bold">30 Days Remaining</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Invoice Ref:</span>
                    <span className="text-cyan-400 font-mono">INV-JP-994182</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-semibold">✅ Phone & WhatsApp Unlocked</span>
                    <button className="btn-secondary py-1.5 px-3 text-xs">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Invoice</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <p className="text-xs text-amber-200">
                    Without an active subscription, phone numbers and WhatsApp links for all 1,200+ lenders remain hidden.
                  </p>
                  <button onClick={onOpenSubscription} className="btn-primary w-full justify-center py-2.5 text-xs font-bold">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Purchase Subscription Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* KYC Documents Section */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-heading">Digital KYC Documents</h3>
                <button onClick={onOpenKYC} className="text-xs text-cyan-400 font-bold hover:underline">
                  + Upload Document
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold text-white">GST Registration Certificate</div>
                      <div className="text-slate-400">Ref: 27AAAAA0000A1Z5</div>
                    </div>
                  </div>
                  <span className="badge-verified">Verified</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white">Business PAN Card</div>
                      <div className="text-slate-400">Ref: ABCDE1234F</div>
                    </div>
                  </div>
                  <span className="badge-verified">Verified</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Notifications & Support Ticket) */}
          <div className="space-y-6">
            
            {/* Notifications Drawer */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-heading">In-App Notifications</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="font-bold text-cyan-400">System Marketplace Update</div>
                  <p className="text-slate-300 mt-1">
                    3 new verified NBFC lenders added in Mumbai region offering working capital finance.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="font-bold text-emerald-400">KYC Status Approved</div>
                  <p className="text-slate-300 mt-1">
                    Your GST registration certificate was verified by Just Paisa Compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Ticket Submission */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <LifeBuoy className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-heading">Contact Marketplace Support</h3>
              </div>

              {ticketSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                  ✅ Support ticket submitted! Ticket ID: TICK-88492
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Subject / Concern"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                      className="input-glass text-xs"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Describe your inquiry..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={3}
                      required
                      className="input-glass text-xs"
                    />
                  </div>
                  <button type="submit" className="btn-secondary w-full py-2 text-xs font-bold justify-center">
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
