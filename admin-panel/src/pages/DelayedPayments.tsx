import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  AlertCircle, 
  Loader2, 
  MessageCircle, 
  Coins, 
  CalendarDays,
  Search,
  CheckCircle2
} from 'lucide-react';

interface OverduePayment {
  id: string;
  loanId: string;
  customerName: string;
  mobile: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

interface DelayedPaymentsProps {
  token: string;
}

export default function DelayedPayments({ token }: DelayedPaymentsProps) {
  const [payments, setPayments] = useState<OverduePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Paid Late history tab state
  const [activeTab, setActiveTab] = useState<'overdue' | 'late'>('overdue');
  const [latePayments, setLatePayments] = useState<any[]>([]);
  const [lateLoading, setLateLoading] = useState(false);

  const fetchOverduePayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/overdue-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setPayments(response.data);
      } else if (response.data && response.data.error) {
        setError(response.data.error);
      } else {
        setError('Received invalid data format from server.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch delayed payments list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatePayments = async () => {
    try {
      setLateLoading(true);
      const response = await api.get('/api/admin/paid-late-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setLatePayments(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLateLoading(false);
    }
  };

  useEffect(() => {
    fetchOverduePayments();
    fetchLatePayments();
  }, [token]);

  const handleMarkPaid = async (installmentId: string) => {
    if (!window.confirm('Verify that you have physically collected the cash/payment for this daily installment?')) return;
    try {
      setActionLoading(installmentId);
      await api.post('/api/admin/payments/mark-paid', {
        installmentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Repayment recorded and verified successfully!');
      // Refetch both payments list
      fetchOverduePayments();
      fetchLatePayments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record manual payment verification.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mobile.includes(searchQuery) ||
    p.loanId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLatePayments = latePayments.filter(p => 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mobile.includes(searchQuery) ||
    p.loanId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Delayed Repayments Ledger</h3>
          <p className="text-xs text-slate-500">View borrowers with overdue payments, send reminders, and view late payment logs.</p>
        </div>
        
        {payments.length > 0 && (
          <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 rounded-full">
            {payments.length} Overdue Dues
          </span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'overdue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Unpaid Overdue ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('late')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'late'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Paid Late History ({latePayments.length})
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Filter by customer, phone, or loan ref..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Tab: Overdue */}
      {activeTab === 'overdue' && (
        <>
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-16 flex flex-col justify-center items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-semibold text-slate-400">Checking overdue installments...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 text-sm flex flex-col justify-center items-center gap-3 min-h-[350px]">
              <CheckCircle2 size={44} className="text-emerald-500" />
              <h4 className="font-extrabold text-slate-700 text-sm">All Clean!</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                {searchQuery ? 'No delayed payments match your search filter.' : 'All borrowers are up to date! There are no unpaid overdue installments.'}
              </p>
            </div>
          ) : (
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-danger-DEFAULT animate-pulse" size={18} />
                  <h4 className="font-extrabold text-primary text-sm">Delayed Installments Queue</h4>
                </div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Collections</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted border-b border-slate-100 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact Number</th>
                      <th className="py-3 px-4">Installment Due</th>
                      <th className="py-3 px-4 font-mono text-center">Due Date</th>
                      <th className="py-3 px-4 text-center">Days Overdue</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredPayments.map((item) => {
                      const cleanedPhone = item.mobile.replace(/[^0-9]/g, '');
                      const shortLoanId = item.loanId.split('-')[0].toUpperCase();
                      const messageText = encodeURIComponent(
                        `Hello *${item.customerName}*, your daily installment of *₹${item.amount}* for Loan ID *DMF-${shortLoanId}* due on *${item.dueDate}* is *${item.daysOverdue} days overdue*. Please pay immediately via our mobile app to avoid extra platform charges. Thanks, Dakshinamurthy Daily Finance.`
                      );
                      const whatsappUrl = `https://api.whatsapp.com/send/?phone=91${cleanedPhone}&text=${messageText}&type=phone_number&app_absent=0`;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.customerName}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Loan ID: DMF-{shortLoanId}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.mobile}</td>
                          <td className="py-3 px-4 text-slate-900 font-black">₹{item.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-center">{item.dueDate}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                              {item.daysOverdue} days late
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right flex justify-end gap-2.5">
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle size={12} />
                              <span>WhatsApp Remind</span>
                            </a>
                            <button
                              onClick={() => handleMarkPaid(item.id)}
                              disabled={actionLoading !== null}
                              className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="animate-spin" size={11} />
                              ) : (
                                <Coins size={11} />
                              )}
                              <span>Mark Paid</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Paid Late */}
      {activeTab === 'late' && (
        <>
          {lateLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-16 flex flex-col justify-center items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-semibold text-slate-400">Loading late payments ledger...</span>
            </div>
          ) : filteredLatePayments.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 text-sm flex flex-col justify-center items-center gap-3 min-h-[350px]">
              <CheckCircle2 size={44} className="text-emerald-500" />
              <h4 className="font-extrabold text-slate-700 text-sm">No Late Payments</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                {searchQuery ? 'No paid late records match your search filter.' : 'All payments have been made on time! No late payment records found.'}
              </p>
            </div>
          ) : (
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  <h4 className="font-extrabold text-primary text-sm">Historical Late Repayments Ledger</h4>
                </div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Settled Late</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted border-b border-slate-100 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact Number</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4 font-mono text-center">Due Date</th>
                      <th className="py-3 px-4 font-mono text-center">Payment Date</th>
                      <th className="py-3 px-4 text-center">Days Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredLatePayments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">Loan ID: DMF-{item.loanId.split('-')[0].toUpperCase()}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.mobile}</td>
                        <td className="py-3 px-4 text-slate-900 font-black">₹{item.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-center">{item.dueDate}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-center">
                          {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                            {item.daysLate} days late
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
