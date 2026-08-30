import React, { useState, useEffect } from 'react';
import {
  fetchMyReferralInfoApi,
} from '../services/api';
import { ReferralInfoData } from '../types';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Wallet,
  Users,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  X,
  Clock,
  CheckCircle2,
  History,
  MessageCircle,
  Zap,
} from 'lucide-react';

interface ReferAndEarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'VENDOR' | 'LENDER';
  userName?: string;
}

export const ReferAndEarnModal: React.FC<ReferAndEarnModalProps> = ({
  isOpen,
  onClose,
  userRole = 'VENDOR',
  userName = 'Partner',
}) => {
  const [data, setData] = useState<ReferralInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'transactions'>('referrals');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMyReferralInfoApi()
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const referralCode = data?.referralCode || 'JUSTPAISA';
  const siteUrl = window.location.origin;
  const referralLink = `${siteUrl}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Hey! Connect with 100% verified business money financers and shops on JustPaisa.\n\nSign up with my partner referral link and get welcome reward cashback in your wallet for subscription upgrades:\n👉 ${referralLink}\n\nReferral Code: ${referralCode}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join JustPaisa - FinTech Loan Marketplace',
          text: `Use my partner referral code ${referralCode} to sign up on JustPaisa and earn reward cashback for plan upgrades!`,
          url: referralLink,
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  const isLender = userRole === 'LENDER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-5 space-y-2 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/80 text-amber-900 text-xs font-extrabold shadow-xs">
            <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>JustPaisa Partner Refer & Earn Program</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Invite Partners &{' '}
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Earn Wallet Rewards
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Invite fellow shop owners and money financers to JustPaisa. When they activate a plan, you both earn instant wallet balance to use on plan upgrades!
          </p>
        </div>

        {/* ── WALLET STATS BAR ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 flex-shrink-0">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-600/15 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-100">
                Available Wallet Balance
              </span>
              <Wallet className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black font-heading">
                ₹{loading ? '...' : (data?.walletBalance || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-100 font-medium flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" /> Use balance on your next plan upgrade
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Total Rewards Earned</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 font-heading">
                ₹{loading ? '...' : (data?.totalEarned || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" /> From {data?.completedConversions || 0} active subscriptions
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Total Invited Partners</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 font-heading">
                {loading ? '...' : data?.totalInvited || 0}
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" /> Registered via your link
              </div>
            </div>
          </div>
        </div>

        {/* ── SHARE BOX ─────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-200 mb-5 flex-shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-blue-700" />
                <span>Your Exclusive Partner Invite Link</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Share this link or referral code with your friends and business contacts.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono tracking-wider">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs text-slate-700 font-mono font-medium truncate select-all">
              {referralLink}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-sbni-blue flex-1 sm:flex-initial py-2.5 px-4 text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 3-STEP "HOW IT WORKS" ─────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 flex-shrink-0">
          <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" /> How It Works
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div>
                <div className="font-extrabold text-slate-900">Share Your Link</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Send your referral link to fellow business owners or financers.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div>
                <div className="font-extrabold text-slate-900">They Subscribe</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Your friend registers and activates any verified membership plan.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div>
                <div className="font-extrabold text-slate-900">Both Earn Wallet Balance</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Instant reward credited to your wallet to discount future plan upgrades!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── REFERRALS & TRANSACTIONS ACTIVITY TABS ─────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-slate-200 mb-3 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('referrals')}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Invited Partners ({data?.referrals?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Wallet History ({data?.recentTransactions?.length || 0})
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-48 rounded-xl border border-slate-200">
            {activeTab === 'referrals' ? (
              data?.referrals && data.referrals.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Partner</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Plan / Reward</th>
                      <th className="py-2 px-3 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.referrals.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.refereeName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.refereeRole === 'LENDER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.refereeRole === 'LENDER' ? 'Financer' : 'Vendor'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status === 'COMPLETED' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plan Subscribed
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" /> Registered
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.status === 'COMPLETED' ? (
                            <span className="font-extrabold text-emerald-700">+₹{item.rewardAmount}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending plan activation</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                          {new Date(item.joinedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs font-medium">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                  You have not invited any partners yet. Share your link above to get started!
                </div>
              )
            ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {tx.description || tx.source}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-extrabold ${
                          tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs font-medium">
                <History className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                No wallet transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
