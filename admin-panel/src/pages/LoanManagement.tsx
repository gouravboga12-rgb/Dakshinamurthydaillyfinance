import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  Check, 
  X, 
  Eye, 
  Lock,
  Calculator,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Loan {
  id: string;
  customer_id: string;
  approved_amount: number;
  platform_charges: number;
  amount_disbursed: number;
  daily_installment: number;
  duration_days: number;
  total_repayment: number;
  remaining_balance: number;
  status: 'Pending' | 'Active' | 'Completed' | 'Rejected';
  approval_date: string | null;
  completion_date: string | null;
  created_at: string;
  customer?: {
    id: string;
    full_name: string;
    mobile_number: string;
  };
}

interface Customer {
  id: string;
  full_name: string;
  mobile_number: string;
  status: string;
}

interface LoanManagementProps {
  token: string;
}

export default function LoanManagement({ token }: LoanManagementProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // Selected Loan for Detail View Modal
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any | null>(null);

  // New Loan Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formCustId, setFormCustId] = useState('');
  const [formApprovedAmount, setFormApprovedAmount] = useState('');
  const [formPlatformCharges, setFormPlatformCharges] = useState('');
  const [formDailyInstallment, setFormDailyInstallment] = useState('');
  const [formDurationDays, setFormDurationDays] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/loans', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter || undefined, search: search || undefined, sort: sortOrder || undefined }
      });
      if (Array.isArray(response.data)) {
        setLoans(response.data);
      } else if (response.data && response.data.error) {
        setError(response.data.error);
      } else {
        setError('Received invalid data format from server.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch loans data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleCustomers = async () => {
    try {
      const response = await axios.get('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'approved' }
      });
      setCustomers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, search, sortOrder, token]);

  useEffect(() => {
    if (showCreateModal) {
      fetchEligibleCustomers();
    }
  }, [showCreateModal]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to Approve and Activate this loan? This will generate daily installments.')) return;
    try {
      await axios.post(`/api/admin/loans/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Loan approved successfully.');
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve loan.');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to Reject this loan request?')) return;
    try {
      await axios.post(`/api/admin/loans/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Loan request rejected.');
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject loan.');
    }
  };

  const handleCloseLoan = async (id: string) => {
    if (!window.confirm('Are you sure you want to Close this loan manually? Remaining balance will be set to zero.')) return;
    try {
      await axios.post(`/api/admin/loans/${id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Loan marked as Completed.');
      fetchLoans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to close loan.');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await axios.get(`/api/admin/loans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedLoanDetails(response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load loan installments.');
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustId || !formApprovedAmount || !formPlatformCharges || !formDailyInstallment || !formDurationDays) {
      setFormError('Please fill in all parameters.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await axios.post('/api/admin/loans', {
        customer_id: formCustId,
        approved_amount: Number(formApprovedAmount),
        platform_charges: Number(formPlatformCharges),
        daily_installment: Number(formDailyInstallment),
        duration_days: Number(formDurationDays)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear Form
      setFormCustId('');
      setFormApprovedAmount('');
      setFormPlatformCharges('');
      setFormDailyInstallment('');
      setFormDurationDays('');
      setShowCreateModal(false);
      fetchLoans();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to disburse loan.');
    } finally {
      setFormLoading(false);
    }
  };

  // Calculations for display
  const dispApproved = Number(formApprovedAmount) || 0;
  const dispCharges = Number(formPlatformCharges) || 0;
  const dispNetDisburse = Math.max(0, dispApproved - dispCharges);
  const dispDuration = Number(formDurationDays) || 0;
  const dispDaily = Number(formDailyInstallment) || 0;
  const dispTotalRepayment = dispApproved; // Repayment basis is Approved Amount
  const projectedRepaymentAmt = dispDuration * dispDaily;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Loan Portfolio & Disbursals</h3>
          <p className="text-xs text-slate-500">Create loans, configure platforms/installments, and review approvals.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
        >
          <Plus size={16} />
          <span>New Loan Disbursal</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, mobile, loan ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-row gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Loan Statuses</option>
            <option value="Pending">Pending Approval</option>
            <option value="Active">Active Collection</option>
            <option value="Completed">Completed / Settled</option>
            <option value="Rejected">Rejected Requests</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">Sort: Default (Newest)</option>
            <option value="highest">Approved: High to Low</option>
            <option value="lowest">Approved: Low to High</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-500 font-semibold">{error}</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No loan portfolios matched your current filter guidelines.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Loan ID / Customer</th>
                  <th className="px-6 py-4">Approved (Repay)</th>
                  <th className="px-6 py-4">Upfront Fee</th>
                  <th className="px-6 py-4">Disbursed (Net)</th>
                  <th className="px-6 py-4">Daily Installment</th>
                  <th className="px-6 py-4">Balance Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{l.customer?.full_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Loan ID: {l.id.slice(0, 8)} | Mobile: {l.customer?.mobile_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{l.approved_amount}</td>
                    <td className="px-6 py-4 text-rose-500 font-semibold">₹{l.platform_charges}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">₹{l.amount_disbursed}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-700 block">₹{l.daily_installment}</span>
                        <span className="text-[10px] text-slate-400 block">{l.duration_days} Daily Cycles</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">₹{l.remaining_balance}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        l.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : l.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : l.status === 'Completed'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => handleViewDetails(l.id)}
                          title="View Schedules"
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        
                        {l.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(l.id)}
                              title="Approve Loan"
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(l.id)}
                              title="Reject Loan"
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {l.status === 'Active' && (
                          <button
                            onClick={() => handleCloseLoan(l.id)}
                            title="Force Settle Loan"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <Lock size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </div>

      {/* View Loan Schedules Modal */}
      {selectedLoanDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold">Installment Ledger: {selectedLoanDetails.customer?.full_name}</h4>
                <p className="text-xs text-slate-300 font-mono mt-1">Loan: {selectedLoanDetails.loan?.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLoanDetails(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-3 uppercase tracking-wider">
                <span>Due Date</span>
                <span>Installment Amount</span>
                <span>Status / Payment Date</span>
              </div>
              
              {selectedLoanDetails.installments?.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No installments generated yet (Loan is Pending approval).</div>
              ) : (
                selectedLoanDetails.installments.map((inst: any) => (
                  <div key={inst.id} className="grid grid-cols-3 gap-4 items-center text-sm border-b border-slate-50 pb-2 text-slate-700">
                    <span className="font-mono text-slate-500">{inst.due_date}</span>
                    <span className="font-bold text-slate-800">₹{selectedLoanDetails.loan?.daily_installment}</span>
                    <div>
                      {inst.status === 'Paid' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Date: {new Date(inst.payment_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Unpaid</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLoanDetails(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h4 className="text-lg font-bold">New Loan Disbursal Sheet</h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLoan}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Select *</label>
                  <select
                    required
                    value={formCustId}
                    onChange={(e) => setFormCustId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">-- Choose Approved Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.mobile_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Approved Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formApprovedAmount}
                      onChange={(e) => setFormApprovedAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. 10000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upfront Platform Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formPlatformCharges}
                      onChange={(e) => setFormPlatformCharges(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Daily Installment (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formDailyInstallment}
                      onChange={(e) => setFormDailyInstallment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. 200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Duration (Days) *</label>
                    <input
                      type="number"
                      required
                      value={formDurationDays}
                      onChange={(e) => setFormDurationDays(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

                {/* Real-time Disbursal/Repayment Calculations panel */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Calculator size={13} className="text-blue-600" />
                    <span>Real-time loan disburse ledger</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Platform upfront deductions</span>
                    <span className="font-semibold text-rose-500">- ₹{dispCharges}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Net disburse output (Given to client)</span>
                    <span className="font-extrabold text-emerald-600 text-sm">₹{dispNetDisburse}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2">
                    <span className="text-slate-500 font-bold">Total repayment target basis</span>
                    <span className="font-extrabold text-slate-800 text-sm">₹{dispTotalRepayment}</span>
                  </div>
                  {projectedRepaymentAmt > 0 && projectedRepaymentAmt !== dispTotalRepayment && (
                    <div className="text-[10px] text-amber-600 font-medium">
                      ⚠️ Note: Daily (₹{dispDaily}) x Duration ({dispDuration} days) = ₹{projectedRepaymentAmt} projected aggregate payments. (Repayment target basis is approved ₹{dispTotalRepayment}).
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                >
                  {formLoading ? 'Disbursing...' : 'Create Loan Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
