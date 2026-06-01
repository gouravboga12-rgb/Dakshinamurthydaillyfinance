import React from 'react';
import { Calendar, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customer Management',
  loans: 'Loans & Disbursals',
  payments: 'Repayments Tracker',
  reports: 'Reports & Analytics',
  settings: 'Settings',
};

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pageLabel = PAGE_LABELS[title] || title;

  return (
    <header className="h-[68px] bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10"
      style={{ boxShadow: '0 1px 0 #E8E2D9, 0 2px 8px rgba(13,27,42,0.04)' }}
    >
      {/* Title & Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl border border-border bg-background hover:bg-slate-50 transition-colors text-primary"
        >
          <Menu size={18} />
        </button>

        <div className="h-6 w-1 rounded-full hidden sm:block" style={{ background: 'linear-gradient(180deg,#F0C040,#D4A017)' }} />
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-primary capitalize leading-tight">{pageLabel}</h2>
          <p className="text-[9px] sm:text-[10px] text-muted font-medium mt-0.5">Dakshinamurthy Daily Finance · Control Panel</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Full Date for desktop */}
        <div className="hidden md:flex items-center gap-2 bg-brand-pale border border-brand/20 text-primary px-3.5 py-2 rounded-xl text-xs font-semibold">
          <Calendar size={13} className="text-brand" />
          <span className="text-muted">{todayStr}</span>
        </div>

        {/* Short Date for mobile */}
        <div className="flex md:hidden items-center gap-1.5 bg-brand-pale border border-brand/20 text-primary px-2.5 py-1.5 rounded-xl text-[10px] font-bold">
          <Calendar size={11} className="text-brand" />
          <span className="text-muted">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Online status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success-light text-success-text text-[10px] sm:text-xs font-bold border border-success-DEFAULT/20">
          <span className="h-1.5 w-1.5 rounded-full bg-success-DEFAULT animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
