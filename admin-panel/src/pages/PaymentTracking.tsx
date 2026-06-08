import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Search, 
  Coins, 
  CalendarDays, 
  BadgeAlert,
  ChevronRight,
  Loader2,
  FileCheck2,
  X
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
  pendingCount?: number;
}

interface Installment {
  id: string;
  loan_id: string;
  due_date: string;
  status: 'Paid' | 'Unpaid' | 'Pending';
  payment_date: string | null;
  transaction_id?: string;
  proof_url?: string;
  collection_mode?: 'cash' | 'upi'; // inferred: upi if transaction_id present, else cash
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
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  const [showPendingOnly, setShowPendingOnly] = useState(false);

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

  const fetchActiveLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/loans', {
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
      const response = await api.get(`/api/admin/loans/${loanId}`, {
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
      const response = await api.post('/api/admin/payments/mark-paid', {
        installmentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Installment payment recorded and verified!');

      // Refresh installments
      if (selectedLoan) {
        // Find if we are updating active loan pendingCount
        const updatedLoan = response.data.loan;
        
        // Refresh local details
        fetchInstallments(selectedLoan.id);
        fetchActiveLoans(); // Auto-refresh left panel counts
        
        setSelectedLoan(prev => prev ? { 
          ...prev, 
          remaining_balance: updatedLoan.remaining_balance,
          pendingCount: Math.max(0, (prev.pendingCount || 0) - 1)
        } : null);
        
        // If loan was completed, refetch active loans
        if (updatedLoan.status === 'Completed') {
          alert('Congratulations! This loan is now fully settled and closed.');
          setSelectedLoan(null);
          setInstallments([]);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment verification.');
    }
  };

  const filteredLoans = activeLoans.filter(l => {
    if (showPendingOnly) {
      return (l.pendingCount || 0) > 0;
    }
    return true;
  });

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

        <div className="flex gap-3">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              showPendingOnly
                ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>⏳ Pending Only</span>
            {activeLoans.filter(l => (l.pendingCount || 0) > 0).length > 0 && (
              <span className={`h-2 w-2 rounded-full ${showPendingOnly ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {showPendingOnly ? 'No accounts require payment approvals.' : 'No active loan accounts found.'}
            </div>
          ) : (
            filteredLoans.map((l) => (
              <button
                key={l.id}
                onClick={() => handleSelectLoan(l)}
                className={`w-full text-left p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors ${
                  selectedLoan?.id === l.id ? 'bg-slate-50 border-r-4 border-blue-600' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-sm">{l.customer?.full_name}</h4>
                    {l.pendingCount && l.pendingCount > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 border border-amber-250 text-amber-800 animate-pulse">
                        ⏳ {l.pendingCount} Pending
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Loan ID: DMF-{l.id.split('-')[0].toUpperCase()}</p>
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
            
             <div className="bg-slate-900 p-6 text-white flex justify-between items-start relative overflow-hidden">
              {/* Subtle background glow for pending loans */}
              {selectedLoan.pendingCount && selectedLoan.pendingCount > 0 ? (
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none animate-pulse" />
              ) : null}
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-base font-bold">{selectedLoan.customer?.full_name}</h4>
                  {selectedLoan.pendingCount && selectedLoan.pendingCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 border border-amber-400 animate-bounce">
                      ⏳ {selectedLoan.pendingCount} Action Required
                    </span>
                  ) : null}
                </div>
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

              {/* Foreclosure Request Banner — shown if all Pending share same UTR */}
              {(() => {
                const pendingInsts = installments.filter(i => i.status === 'Pending');
                const unpaidInsts = installments.filter(i => i.status === 'Unpaid');
                const totalRemaining = installments.filter(i => i.status !== 'Paid');
                const isForeclosure = pendingInsts.length > 0 &&
                  unpaidInsts.length === 0 &&
                  pendingInsts.every(i => i.transaction_id === pendingInsts[0].transaction_id);
                if (!isForeclosure) return null;
                return (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-red-700">🔒 FORECLOSURE REQUEST</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full border border-red-200">Full Loan Closure</span>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">
                          Customer has submitted payment proof to close the loan in one payment.
                        </p>
                        <p className="text-[11px] text-red-500 mt-1 font-mono">
                          UTR: {pendingInsts[0].transaction_id} · {pendingInsts.length} installments pending
                        </p>
                        <p className="text-sm font-black text-red-800 mt-1">
                          Total: ₹{selectedLoan.remaining_balance.toLocaleString('en-IN')}
                        </p>
                      </div>
                      {pendingInsts[0].proof_url && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawUrl = pendingInsts[0].proof_url!;
                            const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                            setProofModalUrl(fullUrl);
                          }}
                          className="shrink-0 px-3 py-1.5 text-xs font-bold bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          👁️ View Proof
                        </button>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Approve foreclosure? This will mark all ${pendingInsts.length} remaining installments as paid and close the loan permanently.`)) return;
                        try {
                          await api.post(`/api/admin/loans/${selectedLoan.id}/approve-foreclosure`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert('Foreclosure approved! Loan has been successfully settled and closed.');
                          setSelectedLoan(null);
                          setInstallments([]);
                          fetchActiveLoans();
                        } catch (e: any) {
                          console.error(e);
                          alert(e.response?.data?.error || 'Failed to approve foreclosure.');
                        }
                      }}
                      className="mt-3 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      ✅ Approve Foreclosure — Close Loan Now
                    </button>
                  </div>
                );
              })()}

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
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                          inst.status === 'Paid' 
                            ? 'bg-emerald-50/20 border-emerald-100/50' 
                            : inst.status === 'Pending'
                            ? 'bg-amber-50/25 border-amber-200/60 shadow-sm shadow-amber-500/5'
                            : isOverdue 
                            ? 'bg-rose-50/20 border-rose-100/50' 
                            : 'bg-slate-50/40 border-slate-150'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Day {index + 1}</span>
                            <span className="text-sm font-semibold font-mono text-slate-700">{inst.due_date}</span>
                            {inst.status === 'Pending' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending Approval</span>
                            )}
                            {inst.status === 'Paid' && !inst.transaction_id && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">💵 Cash Collected</span>
                            )}
                            {inst.status === 'Paid' && inst.transaction_id && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">📱 UPI Payment</span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><BadgeAlert size={10} className="mr-0.5" /> Overdue</span>
                            )}
                          </div>

                          {inst.status === 'Paid' && inst.payment_date && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {inst.transaction_id ? '✅ Verified on:' : '📋 Collected on:'} {new Date(inst.payment_date).toLocaleString('en-IN')}
                            </span>
                          )}

                          {/* Show UTR + Proof for Pending submissions */}
                          {inst.status === 'Pending' && inst.transaction_id && (
                            <div className="text-[10px] text-slate-500 font-bold mt-1">
                              UTR/Txn ID: <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{inst.transaction_id}</span>
                              {inst.proof_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawUrl = inst.proof_url!;
                                    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                                    setProofModalUrl(fullUrl);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 underline ml-2 inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 font-bold"
                                >
                                  👁️ View Proof Screenshot
                                </button>
                              )}
                            </div>
                          )}

                          {/* Show UTR + Proof for already-approved UPI payments */}
                          {inst.status === 'Paid' && inst.transaction_id && (
                            <div className="text-[10px] text-slate-500 font-bold mt-1">
                              UTR/Txn ID: <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{inst.transaction_id}</span>
                              {inst.proof_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawUrl = inst.proof_url!;
                                    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                                    setProofModalUrl(fullUrl);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-800 underline ml-2 inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 font-bold"
                                >
                                  📷 View Proof Screenshot
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span className="text-sm font-bold text-slate-800">₹{selectedLoan.daily_installment}</span>
                          {inst.status === 'Paid' ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <FileCheck2 size={12} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkPaid(inst.id)}
                              className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 ${
                                inst.status === 'Pending'
                                  ? 'bg-amber-500 hover:bg-amber-600'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              <span>{inst.status === 'Pending' ? 'Approve Payment' : 'Mark Paid'}</span>
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
