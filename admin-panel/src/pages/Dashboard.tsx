import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Users, 
  Wallet, 
  Coins, 
  AlertCircle, 
  TrendingUp, 
  BadgeAlert,
  ArrowRight,
  Loader2,
  IndianRupee,
  X,
  Check,
  Eye,
  Clock,
  CheckCircle2,
  CircleDollarSign,
  CalendarDays
} from 'lucide-react';

interface Stats {
  totalCustomers: number;
  activeLoansCount: number;
  completedLoansCount: number;
  pendingLoansCount: number;
  todayCollection: number;
  todayRevenue: number;
  todayProfit: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  outstandingAmount: number;
  overduePaymentsCount: number;
  pendingPaymentsCount?: number;
  pendingPaymentsList?: any[];
  totalDisbursedAmount?: number;
  todayDisbursedAmount?: number;
  todayDisbursedCount?: number;
}

interface DashboardProps {
  token: string;
  setCurrentPage: (page: string) => void;
}

export default function Dashboard({ token, setCurrentPage }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProofModalUrl(null);
      }
    };
    if (proofModalUrl) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [proofModalUrl]);

  const handleApprove = async (installmentId: string) => {
    if (!window.confirm('Approve this payment installment?')) return;
    try {
      await api.post('/api/admin/payments/mark-paid', { installmentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payment approved and verified successfully!');
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve payment.');
    }
  };

  const handleReject = async (installmentId: string) => {
    if (!window.confirm('Reject this payment proof? This will mark the installment status back to Unpaid.')) return;
    try {
      await api.post('/api/admin/payments/reject', { installmentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payment proof rejected and reverted to Unpaid.');
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject payment.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-brand" size={36} />
          <p className="text-sm text-muted font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || (stats as any).error) {
    const errVal = error || (stats as any).error;
    const errMsg = typeof errVal === 'object' ? (errVal.message || errVal.code || JSON.stringify(errVal)) : errVal;
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-danger-light border border-danger-DEFAULT/20 text-danger-text rounded-2xl p-5 text-sm font-medium">
          {errMsg || 'Error loading dashboard.'}
        </div>
      </div>
    );
  }

  const hasPendingPayments = (stats?.pendingPaymentsCount || 0) > 0;

  const metricCards = [
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      iconBg: 'bg-info-light',
      iconColor: 'text-info-DEFAULT',
      link: 'customers',
      trend: 'Registered members',
    },
    {
      label: 'Active Loans',
      value: stats?.activeLoansCount || 0,
      icon: Wallet,
      iconBg: 'bg-success-light',
      iconColor: 'text-success-DEFAULT',
      link: 'loans',
      trend: 'Earning interest',
    },
    {
      label: 'Awaiting Approvals',
      value: stats?.pendingPaymentsCount || 0,
      icon: Coins,
      iconBg: hasPendingPayments ? 'bg-amber-100 animate-pulse' : 'bg-warning-light',
      iconColor: 'text-warning-DEFAULT',
      link: 'payments',
      trend: hasPendingPayments ? 'Action required' : 'All clear',
    },
    {
      label: 'Overdue Payments',
      value: stats?.overduePaymentsCount || 0,
      icon: AlertCircle,
      iconBg: 'bg-danger-light',
      iconColor: 'text-danger-DEFAULT',
      link: 'payments',
      trend: 'Needs follow-up',
    },
  ];

  const disbursalCards = [
    {
      label: 'Pending Requests',
      value: stats?.pendingLoansCount || 0,
      icon: Clock,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      link: 'loans',
      trend: 'Awaiting disbursal',
    },
    {
      label: 'Completed Loans',
      value: stats?.completedLoansCount || 0,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      link: 'loans',
      trend: 'Fully repaid & closed',
    },
    {
      label: 'Total Capital Disbursed',
      value: `₹${(stats?.totalDisbursedAmount || 0).toLocaleString('en-IN')}`,
      icon: CircleDollarSign,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      link: 'loans',
      trend: 'Total loan volume',
    },
    {
      label: "Today's Disbursals",
      value: `${stats?.todayDisbursedCount || 0} (₹${(stats?.todayDisbursedAmount || 0).toLocaleString('en-IN')})`,
      icon: CalendarDays,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      link: 'loans',
      trend: 'Disbursals approved today',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">

      {/* Hero Banner */}
      <div className="card-navy p-7">
        {/* Decorative glow orb */}
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4A017 0%, transparent 70%)' }}
        />
        <div className="absolute right-10 top-0 bottom-0 flex items-center opacity-[0.07] pointer-events-none">
          <TrendingUp size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-6 rounded-full" style={{ background: 'linear-gradient(90deg,#F0C040,#D4A017)' }} />
            <span className="text-brand text-[10px] font-extrabold uppercase tracking-widest">
              Control Dashboard
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white leading-tight">
            Dakshinamurthy Daily Finance
          </h3>
          <p className="text-white/50 text-sm max-w-xl mt-2 leading-relaxed">
            Track customer registrations, disburse loans, monitor outstanding collections and daily profitability in real-time.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setCurrentPage('loans')}
              className="btn-gold text-xs"
            >
              Manage Loans <ArrowRight size={13} />
            </button>
            <button
              onClick={() => setCurrentPage('customers')}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors"
            >
              View Customers
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards - Primary Operations */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primary Operations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="card-surface p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                onClick={() => setCurrentPage(card.link)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all"
                  />
                </div>
                <p className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-3xl font-black text-primary mb-2">{card.value}</p>
                <p className="text-[11px] font-semibold text-muted">{card.trend}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Cards - Disbursals & Pipeline Overview */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Disbursals & Pipeline Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {disbursalCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="card-surface p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                onClick={() => setCurrentPage(card.link)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-muted opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all"
                  />
                </div>
                <p className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-3xl font-black text-primary mb-2">{card.value}</p>
                <p className="text-[11px] font-semibold text-muted">{card.trend}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Payment Approvals Feed */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="text-warning-DEFAULT animate-pulse" size={20} />
            <h4 className="font-extrabold text-primary text-sm">
              Pending Payment Approvals ({(stats as any)?.pendingPaymentsCount || 0})
            </h4>
          </div>
          {hasPendingPayments ? (
            <button
              onClick={() => setCurrentPage('payments')}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] text-brand hover:text-brand-light font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-amber-500/10 active:scale-95"
            >
              <span>View More</span>
              <ArrowRight size={10} />
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/40 text-[9px] text-muted font-extrabold uppercase tracking-wider rounded-lg">
              Live Queue
            </span>
          )}
        </div>

        {!(stats as any)?.pendingPaymentsList || (stats as any).pendingPaymentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-2xl mb-2">✅</span>
            <h5 className="font-bold text-success-text text-sm">All payments verified!</h5>
            <p className="text-[10px] text-muted mt-0.5">No pending installment verifications in the queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted border-b border-slate-100 uppercase tracking-widest text-[9px] font-extrabold">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Installment Amount</th>
                    <th className="py-3 px-4">UTR/Txn ID</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Proof</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {(stats as any).pendingPaymentsList.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.customerName}</td>
                      <td className="py-3 px-4 text-slate-900 font-black">₹{item.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {item.transactionId || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.dueDate}</td>
                      <td className="py-3 px-4 text-center">
                        {item.proofUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rawUrl = item.proofUrl;
                              const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                              setProofModalUrl(fullUrl);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-brand hover:text-brand-muted bg-brand/10 hover:bg-brand/15 rounded-lg border border-brand/20 transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            👁️ View Proof
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted">No screenshot</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-0.5"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all flex items-center gap-0.5"
                        >
                          ❌ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasPendingPayments && (
              <div className="pt-3.5 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setCurrentPage('payments')}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-[11px] font-extrabold text-blue-600 hover:text-blue-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <span>View all pending verifications in Repayments Tracker</span>
                  <ArrowRight size={12} className="text-blue-500" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Today's Performance */}
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-primary text-sm">Today's Performance</h4>
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold text-success-text bg-success-light border border-success-DEFAULT/20 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border border-border bg-background space-y-1">
              <span className="text-[9px] font-extrabold text-muted uppercase tracking-wider block">Collections</span>
              <span className="text-xl font-black text-primary block">₹{(stats?.todayCollection || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="rounded-xl p-4 border border-brand/25 bg-brand-pale space-y-1">
              <span className="text-[9px] font-extrabold text-brand-muted uppercase tracking-wider block">Profit</span>
              <span className="text-xl font-black text-brand block">₹{(stats?.todayProfit || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted font-semibold">Monthly Revenue</span>
              <span className="font-extrabold text-primary">₹{(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: '65%', background: 'linear-gradient(90deg, #F0C040, #D4A017)' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>Platform fees + Collections</span>
              <span className="font-bold text-brand">65% of target</span>
            </div>
          </div>
        </div>

        {/* Portfolio Status */}
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-primary text-sm">Portfolio Status</h4>
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold text-danger-text bg-danger-light border border-danger-DEFAULT/20 rounded-full uppercase tracking-wider">
              Risk Tracker
            </span>
          </div>

          <div className="rounded-xl p-4 border border-border bg-background space-y-1">
            <span className="text-[9px] font-extrabold text-muted uppercase tracking-wider block">
              Outstanding Capital
            </span>
            <div className="flex items-baseline gap-1">
              <IndianRupee size={18} className="text-primary font-black" />
              <span className="text-2xl font-black text-primary">
                {(stats?.outstandingAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-danger-light border border-danger-DEFAULT/20">
            <BadgeAlert size={18} className="shrink-0 text-danger-DEFAULT mt-0.5" />
            <div>
              <h5 className="text-xs font-extrabold text-danger-text leading-tight">Overdue Payment Alert</h5>
              <p className="text-[10px] text-danger-DEFAULT/80 mt-0.5 leading-relaxed">
                {stats?.overduePaymentsCount || 0} daily payments are overdue. Initiate collection follow-ups immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Collection Trend Chart */}
        <div className="card-surface p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-extrabold text-primary text-sm">Collection Trends</h4>
              <span className="text-[10px] font-semibold text-muted">Past 7 Days</span>
            </div>
            <div className="h-36 w-full">
              <svg viewBox="0 0 300 120" className="w-full h-full">
                {/* Grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#E8E2D9" strokeWidth="1" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#E8E2D9" strokeWidth="1" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#E8E2D9" strokeWidth="1" />

                {/* Gradient fill */}
                <defs>
                  <linearGradient id="goldChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#D4A017" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#D4A017" stopOpacity="0.0"  />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 90 Q 50 40 90 70 T 170 30 T 250 50 L 250 100 L 10 100 Z"
                  fill="url(#goldChartGrad)"
                />

                {/* Trend line */}
                <path
                  d="M 10 90 Q 50 40 90 70 T 170 30 T 250 50"
                  fill="none"
                  stroke="#D4A017"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {[
                  { cx: 10,  cy: 90 },
                  { cx: 90,  cy: 70 },
                  { cx: 170, cy: 30 },
                  { cx: 250, cy: 50 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="5"
                    fill={i === 3 ? '#16A34A' : '#D4A017'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted font-extrabold px-1 uppercase tracking-widest pt-3 border-t border-border">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span className="text-success-DEFAULT">Today</span>
          </div>
        </div>

      </div>

      {/* Proof Modal */}
      {proofModalUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setProofModalUrl(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] cursor-default animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-950 text-sm sm:text-base">Payment Proof Screenshot</h3>
              <button 
                type="button"
                onClick={() => setProofModalUrl(null)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-slate-50 min-h-[250px] sm:min-h-[300px]">
              <img 
                src={proofModalUrl} 
                alt="Payment Proof" 
                className="max-w-full max-h-[55vh] object-contain rounded-lg border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Failed+to+load+image';
                }}
              />
            </div>
            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setProofModalUrl(null)} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
