import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Zap,
  FileText,
  HelpCircle,
  LifeBuoy,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Settings,
  Activity,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vendors' | 'lenders' | 'subscriptions' | 'cms' | 'tickets' | 'audits'
  >('overview');

  // Admin Mock States
  const [vendors, setVendors] = useState([
    { id: 'v1', name: 'Sharma Textiles', owner: 'Rajesh Sharma', city: 'Mumbai', status: 'VERIFIED', turnover: '50L - 1Cr' },
    { id: 'v2', name: 'Patel Precision Polymers', owner: 'Priya Patel', city: 'Mumbai', status: 'VERIFIED', turnover: '1Cr - 5Cr' },
    { id: 'v3', name: 'Choudhury Logistics', owner: 'Vikram Choudhury', city: 'Delhi', status: 'PENDING', turnover: '25L - 50L' },
  ]);

  const [lenders, setLenders] = useState([
    { id: 'l1', name: 'Capital Growth Finance NBFC Ltd', type: 'NBFC', city: 'Mumbai', status: 'VERIFIED', reg: 'NBFC-RBI-MH-9941' },
    { id: 'l2', name: 'First National Commercial Bank', type: 'BANK', city: 'New Delhi', status: 'VERIFIED', reg: 'BANK-RBI-IND-1002' },
    { id: 'l3', name: 'Apex Enterprise Capital Partners', type: 'FINANCIAL_INSTITUTION', city: 'Gurugram', status: 'PENDING', reg: 'FI-DL-2021-883' },
  ]);

  const [faqs, setFaqs] = useState([
    { id: 'f1', question: 'What is SBNI Money App?', category: 'General' },
    { id: 'f2', question: 'Does SBNI Money process or approve my loan?', category: 'General' },
    { id: 'f3', question: 'Why do I need a subscription plan?', category: 'Subscriptions' },
  ]);

  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion) return;
    setFaqs([...faqs, { id: 'f-' + Date.now(), question: newFaqQuestion, category: 'General' }]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const handleToggleLenderStatus = (id: string) => {
    setLenders(
      lenders.map((l) =>
        l.id === id ? { ...l, status: l.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED' } : l
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-lg text-white font-heading tracking-tight">SBNI ADMIN</div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Super Control Center</div>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'overview' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'vendors' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Vendor Management ({vendors.length})
            </button>

            <button
              onClick={() => setActiveTab('lenders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'lenders' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Lender Verification ({lenders.length})
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'subscriptions' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" /> Subscription Plans
            </button>

            <button
              onClick={() => setActiveTab('cms')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'cms' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> CMS & FAQs
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'tickets' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-4 h-4" /> Support Tickets
            </button>

            <button
              onClick={() => setActiveTab('audits')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === 'audits' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> System Audit Logs
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
          Super Admin v1.0.0 • Supabase Sync
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-heading">Super Admin Command Center</h1>
              <p className="text-xs text-slate-400">Live platform metrics & marketplace synchronization</p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">Total Revenue</div>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-heading mt-2">₹14,85,900</div>
                <div className="text-[11px] text-slate-500 mt-1">From 1,650 Subscriptions</div>
              </div>

              <div className="glass-panel p-5 border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">Registered Vendors</div>
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-2xl font-extrabold text-cyan-400 font-heading mt-2">52,410</div>
                <div className="text-[11px] text-slate-500 mt-1">Across 28 States</div>
              </div>

              <div className="glass-panel p-5 border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">Verified Lenders</div>
                  <Building2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-400 font-heading mt-2">1,250</div>
                <div className="text-[11px] text-slate-500 mt-1">Banks & NBFC Institutions</div>
              </div>

              <div className="glass-panel p-5 border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">Active Subscriptions</div>
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-heading mt-2">8,940</div>
                <div className="text-[11px] text-slate-500 mt-1">Unlocked Contact Features</div>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white font-heading mb-4">Recent Subscription Payments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Invoice Ref</th>
                      <th className="p-3">User Email</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-3 font-mono text-cyan-400">INV-SBNI-994182</td>
                      <td className="p-3">rajesh@sharmatextiles.com</td>
                      <td className="p-3">Monthly Growth Plan</td>
                      <td className="p-3 font-bold text-white">₹899</td>
                      <td className="p-3"><span className="text-emerald-400 font-bold">SUCCESS</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-cyan-400">INV-SBNI-883210</td>
                      <td className="p-3">priya@patelpolymers.in</td>
                      <td className="p-3">Quarterly Value Plan</td>
                      <td className="p-3 font-bold text-white">₹2,299</td>
                      <td className="p-3"><span className="text-emerald-400 font-bold">SUCCESS</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white font-heading">Vendor Business Management</h1>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Business Name</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Annual Turnover</th>
                      <th className="p-3">KYC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {vendors.map((v) => (
                      <tr key={v.id}>
                        <td className="p-3 font-bold text-white">{v.name}</td>
                        <td className="p-3">{v.owner}</td>
                        <td className="p-3">{v.city}</td>
                        <td className="p-3">{v.turnover}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LENDERS TAB */}
        {activeTab === 'lenders' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white font-heading">Lender Verification Center</h1>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Institution Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">RBI / Reg Ref</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {lenders.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 font-bold text-white">{l.name}</td>
                        <td className="p-3">{l.type}</td>
                        <td className="p-3 font-mono">{l.reg}</td>
                        <td className="p-3">{l.city}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleLenderStatus(l.id)}
                            className="btn-admin-primary py-1 px-3 text-[11px]"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white font-heading">Subscription Plans Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 border-slate-800">
                <h3 className="font-bold text-white text-sm">Weekly Trial</h3>
                <div className="text-xl font-bold text-cyan-400 mt-1">₹299</div>
                <div className="text-xs text-slate-400 mt-2">7 Days Contact Unlocks</div>
              </div>
              <div className="glass-panel p-5 border-cyan-500/40">
                <h3 className="font-bold text-white text-sm">Monthly Growth</h3>
                <div className="text-xl font-bold text-cyan-400 mt-1">₹899</div>
                <div className="text-xs text-slate-400 mt-2">30 Days Pan-India Access</div>
              </div>
              <div className="glass-panel p-5 border-slate-800">
                <h3 className="font-bold text-white text-sm">Quarterly Value</h3>
                <div className="text-xl font-bold text-cyan-400 mt-1">₹2,299</div>
                <div className="text-xs text-slate-400 mt-2">90 Days Continuous Access</div>
              </div>
              <div className="glass-panel p-5 border-slate-800">
                <h3 className="font-bold text-white text-sm">Annual Enterprise</h3>
                <div className="text-xl font-bold text-cyan-400 mt-1">₹6,999</div>
                <div className="text-xs text-slate-400 mt-2">365 Days Unlimited Access</div>
              </div>
            </div>
          </div>
        )}

        {/* CMS & FAQS TAB */}
        {activeTab === 'cms' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white font-heading">Dynamic CMS & FAQ Builder</h1>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white font-heading mb-4">Add Dynamic FAQ</h3>
              <form onSubmit={handleAddFaq} className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Enter Question..."
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  className="input-admin"
                />
                <textarea
                  placeholder="Enter Answer..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  rows={2}
                  className="input-admin"
                />
                <button type="submit" className="btn-admin-primary">
                  <Plus className="w-4 h-4" /> Add FAQ Item
                </button>
              </form>

              <div className="space-y-2">
                {faqs.map((f) => (
                  <div key={f.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{f.question}</div>
                      <div className="text-slate-400">{f.category}</div>
                    </div>
                    <button onClick={() => handleDeleteFaq(f.id)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUDITS TAB */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white font-heading">System Audit Logs</h1>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-2 bg-slate-900 rounded text-slate-300">
                  [2026-08-02 02:05:10] USER_SUBSCRIPTION_ACTIVE - User: rajesh@sharmatextiles.com - Plan: MONTHLY
                </div>
                <div className="p-2 bg-slate-900 rounded text-slate-300">
                  [2026-08-02 01:42:19] LENDER_KYC_VERIFIED - Institution: Capital Growth Finance NBFC Ltd
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
