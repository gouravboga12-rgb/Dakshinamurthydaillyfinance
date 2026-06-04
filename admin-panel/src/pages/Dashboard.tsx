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
}

interface DashboardProps {
  token: string;
  setCurrentPage: (page: string) => void;
}

export default function Dashboard({ token, setCurrentPage }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchStats();
  }, [token]);

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
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-danger-light border border-danger-DEFAULT/20 text-danger-text rounded-2xl p-5 text-sm font-medium">
          {error || (stats as any).error || 'Error loading dashboard.'}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      iconBg: 'bg-info-light',
      iconColor: 'text-info-DEFAULT',
      link: 'customers',
      trend: '+2 this week',
    },
    {
      label: 'Active Loans',
      value: stats?.activeLoansCount || 0,
      icon: Wallet,
      iconBg: 'bg-success-light',
      iconColor: 'text-success-DEFAULT',
      link: 'loans',
      trend: 'Running',
    },
    {
      label: 'Pending Requests',
      value: stats?.pendingLoansCount || 0,
      icon: Coins,
      iconBg: 'bg-warning-light',
      iconColor: 'text-warning-DEFAULT',
      link: 'loans',
      trend: 'Awaiting review',
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

      {/* Metric Cards */}
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
    </div>
  );
}
