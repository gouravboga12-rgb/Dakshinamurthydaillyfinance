import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  Coins, 
  CalendarDays, 
  BadgeAlert,
  ChevronRight,
  Loader2,
  FileCheck2
} from 'lucide-react';

interface ActiveLoan {
  id: string;
  customer_id: string;
  approved_amount: number;
  daily_installment: number;
  remaining_balance: number;
  status: string;
  customer?: {
    full_name: string;
    mobile_number: string;
  };
}

interface Installment {
  id: string;
  loan_id: string;
  due_date: string;
  status: 'Paid' | 'Unpaid';
  payment_date: string | null;
}

interface PaymentTrackingProps {
  token: string;
}

export default function PaymentTracking({ token }: PaymentTrackingProps) {
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchActiveLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/loans', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'Active', search: search || undefined }
      });
      if (Array.isArray(response.data)) {
        setActiveLoans(response.data);
      } else if (response.data && response.data.error) {
        setError(response.data.error);
      } else {
        setError('Received invalid data format from server.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch active collection loans.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstallments = async (loanId: string) => {
    try {
      setInstallmentsLoading(true);
      const response = await axios.get(`/api/admin/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstallments(response.data.installments);
    } catch (err: any) {
      alert('Failed to load installment details.');
    } finally {
      setInstallmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, [search, token]);

  const handleSelectLoan = (loan: ActiveLoan) => {
    setSelectedLoan(loan);
    fetchInstallments(loan.id);
  };

  const handleMarkPaid = async (installmentId: string) => {
    if (!window.confirm('Verify that you have physically collected the cash/payment for this daily installment?')) return;
    try {
      const response = await axios.post('/api/admin/payments/mark-paid', {
        installmentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Installment payment recorded and verified!');

      // Refresh installments
      if (selectedLoan) {
        fetchInstallments(selectedLoan.id);
        
        // Update local active loan details (like remaining balance)
        const updatedLoan = response.data.loan;
        setActiveLoans(prev => prev.map(l => l.id === updatedLoan.id ? { ...l, remaining_balance: updatedLoan.remaining_balance } : l));
        setSelectedLoan(prev => prev ? { ...prev, remaining_balance: updatedLoan.remaining_balance } : null);
        
        // If loan was completed, refetch active loans
        if (updatedLoan.status === 'Completed') {
          alert('Congratulations! This loan is now fully settled and closed.');
          setSelectedLoan(null);
          setInstallments([]);
          fetchActiveLoans();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment verification.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-fade-in">
      
      {/* Left Pane: Search and Active Loans Selector */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Repayment Collection Sheet</h3>
          <p className="text-xs text-slate-500">Collect daily payments, verify collections, and settle balances.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search active accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : activeLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No active loan accounts found.</div>
          ) : (
            activeLoans.map((l) => (
              <button
                key={l.id}
                onClick={() => handleSelectLoan(l)}
                className={`w-full text-left p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors ${
                  selectedLoan?.id === l.id ? 'bg-slate-50 border-r-4 border-blue-600' : ''
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{l.customer?.full_name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Loan ID: {l.id.slice(0, 8)}</p>
                  <div className="flex gap-4 text-xs font-semibold text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><Coins size={12} className="text-emerald-500" /> ₹{l.daily_installment}/day</span>
                    <span>Bal: ₹{l.remaining_balance}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Installments Schedule tracking */}
      <div className="lg:col-span-7">
        {selectedLoan ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden space-y-6">
            
            {/* Active Customer details panel */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
              <div>
                <h4 className="text-base font-bold">{selectedLoan.customer?.full_name}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Mobile: {selectedLoan.customer?.mobile_number}</p>
                <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Approved Loan</span>
                    <span className="text-white text-sm font-bold">₹{selectedLoan.approved_amount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Remaining Balance</span>
                    <span className="text-emerald-400 text-sm font-bold">₹{selectedLoan.remaining_balance}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Daily Installment</span>
                    <span className="text-amber-400 text-sm font-bold">₹{selectedLoan.daily_installment}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Installments schedules */}
            <div className="p-6 pt-0 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5"><CalendarDays size={16} className="text-blue-600" /> Daily installment ledger</h5>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Manual Collection Verification</span>
              </div>

              {installmentsLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {installments.map((inst, index) => {
                    const isOverdue = inst.status === 'Unpaid' && inst.due_date < new Date().toISOString().split('T')[0];
                    return (
                      <div 
                        key={inst.id} 
                        className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                          inst.status === 'Paid' 
                            ? 'bg-emerald-50/20 border-emerald-100/50' 
                            : isOverdue 
                            ? 'bg-rose-50/20 border-rose-100/50' 
                            : 'bg-slate-50/40 border-slate-150'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Day {index + 1}</span>
                            <span className="text-sm font-semibold font-mono text-slate-700">{inst.due_date}</span>
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><BadgeAlert size={10} className="mr-0.5" /> Overdue</span>
                            )}
                          </div>
                          {inst.status === 'Paid' && inst.payment_date && (
                            <span className="text-[10px] text-slate-400 font-mono block">Collected on: {new Date(inst.payment_date).toLocaleString('en-IN')}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-800">₹{selectedLoan.daily_installment}</span>
                          {inst.status === 'Paid' ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <FileCheck2 size={12} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkPaid(inst.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1"
                            >
                              <span>Mark Paid</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <Coins size={44} className="text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-500">Select active account</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Select a customer from the left list to view their daily installment ledger and record cash collections.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
