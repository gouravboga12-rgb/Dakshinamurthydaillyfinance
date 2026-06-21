import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  AlertCircle,
  Edit,
  ChevronDown,
  AlertTriangle
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

  // Custom confirmation modal (replaces window.confirm — blocked in HTTPS deployed environments)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, open: false }));
  }, []);
  
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
  const [formInterestPct, setFormInterestPct] = useState('10'); // Default to 10%
  const [formInterestPctOption, setFormInterestPctOption] = useState('10');
  const [formInterestAmt, setFormInterestAmt] = useState('0');
  const [formPlatformCharges, setFormPlatformCharges] = useState('1000');
  const [formDailyInstallment, setFormDailyInstallment] = useState('');
  const [formDurationDays, setFormDurationDays] = useState('50');
  const [formStartDate, setFormStartDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Approval Customize Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalLoanId, setApprovalLoanId] = useState('');
  const [approvalCustomerName, setApprovalCustomerName] = useState('');
  const [approvalCustomerMobile, setApprovalCustomerMobile] = useState('');
  const [approvalApprovedAmt, setApprovalApprovedAmt] = useState('');
  const [approvalInterestPct, setApprovalInterestPct] = useState('10'); // Default to 10%
  const [approvalInterestPctOption, setApprovalInterestPctOption] = useState('10');
  const [approvalInterestAmt, setApprovalInterestAmt] = useState('0');
  const [approvalPlatformCharges, setApprovalPlatformCharges] = useState('');
  const [approvalDailyInstallment, setApprovalDailyInstallment] = useState('');
  const [approvalDurationDays, setApprovalDurationDays] = useState('');
  const [approvalFormError, setApprovalFormError] = useState('');
  const [approvalFormLoading, setApprovalFormLoading] = useState(false);
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [approvalLoan, setApprovalLoan] = useState<Loan | null>(null);
  const [approvalDate, setApprovalDate] = useState('');

  // Default settings loaded from database
  const [defaultPlatformFee, setDefaultPlatformFee] = useState('1000');
  const [defaultDurationVal, setDefaultDurationVal] = useState('50');

  // Customer Dropdown States
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
  const [custSearchQuery, setCustSearchQuery] = useState('');
  const custDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (custDropdownRef.current && !custDropdownRef.current.contains(event.target as Node)) {
        setIsCustDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        const errVal = response.data.error;
        setError(typeof errVal === 'object' ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal));
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

  const fetchDefaultSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.settings) {
        const s = response.data.settings;
        setDefaultPlatformFee(s.platform_fee || '1000');
        setDefaultDurationVal(s.default_duration || '50');
      }
    } catch (err) {
      console.error('Failed to load default settings', err);
    }
  };

  useEffect(() => {
    fetchDefaultSettings();
  }, [token]);

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, search, sortOrder, token]);

  // Get local IST date string (YYYY-MM-DD) to avoid UTC offset issues
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (showCreateModal) {
      fetchEligibleCustomers();
      setFormDurationDays(defaultDurationVal);
      setFormPlatformCharges(defaultPlatformFee);
      setFormInterestPct('10');
      setFormInterestPctOption('10');
      setFormStartDate(getLocalDateString()); // Default to today (IST)
    }
  }, [showCreateModal, defaultDurationVal, defaultPlatformFee]);

  // Dynamic calculations for Create Loan modal
  useEffect(() => {
    const amt = Number(formApprovedAmount) || 0;
    const pct = Number(formInterestPct) || 0;
    const interestAmt = Math.round(amt * (pct / 100));
    setFormInterestAmt(String(interestAmt));
  }, [formApprovedAmount, formInterestPct]);

  useEffect(() => {
    const amt = Number(formApprovedAmount) || 0;
    const interestAmt = Number(formInterestAmt) || 0;
    const charges = Number(formPlatformCharges) || 0;
    const dur = Number(formDurationDays) || 0;
    // Total repayment = (approved_amount + interest) - platform_charges
    // Platform fee is deducted from both disbursement and repayment target
    const totalRepay = (amt + interestAmt) - charges;
    if (totalRepay > 0 && dur > 0) {
      setFormDailyInstallment(String(Math.round(totalRepay / dur)));
    } else {
      setFormDailyInstallment('');
    }
  }, [formApprovedAmount, formInterestAmt, formPlatformCharges, formDurationDays]);

  // Dynamic calculations for Approval Customize modal
  useEffect(() => {
    const amt = Number(approvalApprovedAmt) || 0;
    const pct = Number(approvalInterestPct) || 0;
    const interestAmt = Math.round(amt * (pct / 100));
    setApprovalInterestAmt(String(interestAmt));
  }, [approvalApprovedAmt, approvalInterestPct]);

  useEffect(() => {
    const amt = Number(approvalApprovedAmt) || 0;
    const interestAmt = Number(approvalInterestAmt) || 0;
    const charges = Number(approvalPlatformCharges) || 0;
    const dur = Number(approvalDurationDays) || 0;
    // Total repayment = (approved_amount + interest) - platform_charges
    const totalRepay = (amt + interestAmt) - charges;
    if (totalRepay > 0 && dur > 0) {
      setApprovalDailyInstallment(String(Math.round(totalRepay / dur)));
    } else {
      setApprovalDailyInstallment('');
    }
  }, [approvalApprovedAmt, approvalInterestAmt, approvalPlatformCharges, approvalDurationDays]);

  const openApproveModal = (loan: Loan) => {
    setApprovalLoanId(loan.id);
    setApprovalCustomerName(loan.customer?.full_name || 'Customer');
    setApprovalCustomerMobile(loan.customer?.mobile_number || '');
    setApprovalApprovedAmt(String(loan.approved_amount));
    setApprovalPlatformCharges(String(loan.platform_charges));
    setApprovalDailyInstallment(String(loan.daily_installment));
    setApprovalDurationDays(String(loan.duration_days));
    setIsEditingActive(loan.status === 'Active');
    setApprovalLoan(loan);
    setApprovalDate(loan.approval_date ? loan.approval_date.substring(0, 10) : getLocalDateString()); // Use local IST date, not UTC
    
    // Calculate existing interest rate: interest = total_repayment - (approved_amount - platform_charges)
    // i.e. interest = total_repayment + platform_charges - approved_amount
    const interestAmt = loan.total_repayment + loan.platform_charges - loan.approved_amount;
    const interestPct = loan.approved_amount > 0 ? Math.round((interestAmt / loan.approved_amount) * 100) : 0;
    
    // Default interest percentage to calculated value if editing active, or 0 if pending
    const initialPct = loan.status === 'Active' ? interestPct : 0;
    const isStandardPct = ['0', '5', '10', '11', '15', '20'].includes(String(initialPct));
    
    setApprovalInterestPct(String(initialPct));
    setApprovalInterestPctOption(isStandardPct ? String(initialPct) : 'custom');
    setApprovalFormError('');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalApprovedAmt || !approvalPlatformCharges || !approvalDailyInstallment || !approvalDurationDays) {
      setApprovalFormError('Please fill in all parameters.');
      return;
    }

    setApprovalFormLoading(true);
    setApprovalFormError('');
    const approvedAmt = Number(approvalApprovedAmt) || 0;
    const interestAmt = Number(approvalInterestAmt) || 0;
    const charges = Number(approvalPlatformCharges) || 0;
    // Total repayment = (approved_amount + interest) - platform_charges
    const totalRepay = (approvedAmt + interestAmt) - charges;

    try {
      if (isEditingActive) {
        const currentPaid = approvalLoan ? (approvalLoan.total_repayment - approvalLoan.remaining_balance) : 0;
        const newRemainingBalance = Math.max(0, totalRepay - currentPaid);

        await axios.put(`/api/admin/loans/${approvalLoanId}`, {
          approved_amount: approvedAmt,
          platform_charges: Number(approvalPlatformCharges),
          daily_installment: Number(approvalDailyInstallment),
          duration_days: Number(approvalDurationDays),
          total_repayment: totalRepay,
          remaining_balance: newRemainingBalance,
          approval_date: approvalDate,
          interest_rate: Number(approvalInterestPct) || 0
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Ledger details updated successfully.');
      } else {
        await axios.post(`/api/admin/loans/${approvalLoanId}/approve`, {
          approved_amount: approvedAmt,
          platform_charges: Number(approvalPlatformCharges),
          amount_disbursed: approvedAmt - Number(approvalPlatformCharges),
          daily_installment: Number(approvalDailyInstallment),
          duration_days: Number(approvalDurationDays),
          total_repayment: totalRepay,
          approval_date: approvalDate,
          interest_rate: Number(approvalInterestPct) || 0
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Ledger approved and activated successfully.');
      }
      setShowApproveModal(false);
      fetchLoans();
    } catch (err: any) {
      const errVal = err.response?.data?.error;
      setApprovalFormError(typeof errVal === 'object' && errVal !== null ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal || (isEditingActive ? 'Failed to update ledger.' : 'Failed to approve ledger.')));
    } finally {
      setApprovalFormLoading(false);
    }
  };

  const handleReject = (id: string) => {
    showConfirm(
      'Reject Ledger Request',
      'Are you sure you want to Reject this ledger request?',
      async () => {
        closeConfirm();
        try {
          await axios.post(`/api/admin/loans/${id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Ledger request rejected.');
          fetchLoans();
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to reject loan.');
        }
      }
    );
  };

  const handleCloseLoan = (id: string) => {
    showConfirm(
      'Force Settle Loan',
      'Are you sure you want to Close this loan manually? Remaining balance will be set to zero.',
      async () => {
        closeConfirm();
        try {
          await axios.post(`/api/admin/loans/${id}/close`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Loan marked as Completed.');
          fetchLoans();
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to close loan.');
        }
      }
    );
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
    const approvedAmt = Number(formApprovedAmount) || 0;
    const interestAmt = Number(formInterestAmt) || 0;
    const charges = Number(formPlatformCharges) || 0;
    // Total repayment = (approved_amount + interest) - platform_charges
    const totalRepay = (approvedAmt + interestAmt) - charges;

    try {
      await axios.post('/api/admin/loans', {
        customer_id: formCustId,
        approved_amount: approvedAmt,
        platform_charges: Number(formPlatformCharges),
        daily_installment: Number(formDailyInstallment),
        duration_days: Number(formDurationDays),
        total_repayment: totalRepay,
        interest_rate: Number(formInterestPct) || 0,
        start_date: formStartDate || getLocalDateString() // Pass start date for installment generation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear Form
      setFormCustId('');
      setFormApprovedAmount('');
      setFormPlatformCharges(defaultPlatformFee);
      setFormDailyInstallment('');
      setFormDurationDays(defaultDurationVal);
      setFormStartDate('');
      setShowCreateModal(false);
      fetchLoans();
    } catch (err: any) {
      const errVal = err.response?.data?.error;
      setFormError(typeof errVal === 'object' && errVal !== null ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal || 'Failed to disburse loan.'));
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
  const dispInterestPct = Number(formInterestPct) || 0;
  const dispInterestAmt = Number(formInterestAmt) || 0;
  // Total repayment = (approved + interest) - platform_charges
  const dispTotalRepayment = (dispApproved + dispInterestAmt) - dispCharges;
  const projectedRepaymentAmt = dispDuration * dispDaily;

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
    c.mobile_number.includes(custSearchQuery)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Payments & Dues Ledger</h3>
          <p className="text-xs text-slate-500">Create daily ledger records, configure platforms/installments, and review approvals.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
        >
          <Plus size={16} />
          <span>New Ledger Account</span>
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
            placeholder="Search by customer name, mobile, ledger ID..."
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
            <option value="">All Ledger Statuses</option>
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
          <div className="p-12 text-center text-slate-400 text-sm">No ledger portfolios matched your current filter guidelines.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Ledger ID / Customer</th>
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
                        <span className="text-[10px] text-slate-400 block font-mono">Ledger ID: DMF-{l.id.split('-')[0].toUpperCase()} | Mobile: {l.customer?.mobile_number}</span>
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
                              onClick={() => openApproveModal(l)}
                              title="Edit & Approve"
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => openApproveModal(l)}
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
                          <>
                            <button
                              onClick={() => openApproveModal(l)}
                              title="Edit Loan Parameters"
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleCloseLoan(l.id)}
                              title="Force Settle Loan"
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <Lock size={14} />
                            </button>
                          </>
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
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Loan ID: DMF-{selectedLoanDetails.loan?.id.split('-')[0].toUpperCase()}
                  {selectedLoanDetails.loan?.approval_date && (
                    <span className="ml-3 font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      Loan Given Date: {new Date(selectedLoanDetails.loan.approval_date).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </p>
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
              <h4 className="text-lg font-bold">New Ledger Account Sheet</h4>
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

                <div className="space-y-1 relative" ref={custDropdownRef}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Select *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustDropdownOpen(!isCustDropdownOpen);
                      setCustSearchQuery('');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left flex justify-between items-center"
                  >
                    <span className={formCustId ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                      {formCustId 
                        ? (() => {
                            const selectedCust = customers.find(c => c.id === formCustId);
                            return selectedCust ? `${selectedCust.full_name} (${selectedCust.mobile_number})` : '-- Choose Approved Customer --';
                          })()
                        : '-- Choose Approved Customer --'
                      }
                    </span>
                    <span className="text-slate-400">
                      <ChevronDown size={16} />
                    </span>
                  </button>

                  {isCustDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search customer by name or mobile..."
                          value={custSearchQuery}
                          onChange={(e) => setCustSearchQuery(e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 max-h-48 divide-y divide-slate-50">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">No customers found</div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormCustId(c.id);
                                setIsCustDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors hover:bg-slate-50 ${
                                formCustId === c.id ? 'bg-blue-50/50 text-blue-700 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <span>{c.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.mobile_number}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Approved Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formApprovedAmount}
                    onChange={(e) => setFormApprovedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    placeholder="e.g. 10000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Charges / Interest (%)</label>
                    <div className="flex gap-2">
                      <select
                        value={formInterestPctOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormInterestPctOption(val);
                          if (val !== 'custom') {
                            setFormInterestPct(val);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="11">11%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="custom">Custom %</option>
                      </select>
                      {formInterestPctOption === 'custom' && (
                        <input
                          type="number"
                          required
                          value={formInterestPct}
                          onChange={(e) => setFormInterestPct(e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          placeholder="%"
                          min="0"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upfront Platform Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formPlatformCharges}
                      onChange={(e) => setFormPlatformCharges(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ledger Start Date (Disbursal) *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                {/* Real-time Disbursal/Repayment Calculations panel */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Calculator size={13} className="text-blue-600" />
                    <span>Real-time loan disburse ledger</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Approved Principal</span>
                    <span className="font-semibold text-slate-800">₹{dispApproved}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Charges / Interest ({dispInterestPct}%)</span>
                    <span className="font-semibold text-blue-600">+ ₹{dispInterestAmt}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Downpayment & Platform charges</span>
                    <span className="font-semibold text-rose-500">- ₹{dispCharges}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2">
                    <span className="text-slate-500 font-bold">Net disburse output (Given to client)</span>
                    <span className="font-extrabold text-emerald-600 text-sm">₹{dispNetDisburse}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
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

      {/* Approve & Customize Loan Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold">{isEditingActive ? 'Edit Active Ledger' : 'Approve & Customize Ledger'}</h4>
                <p className="text-xs text-slate-300 font-mono mt-0.5">Customer: {approvalCustomerName} ({approvalCustomerMobile})</p>
              </div>
              <button 
                onClick={() => setShowApproveModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit}>
              <div className="p-6 space-y-4">
                {approvalFormError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{approvalFormError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Approved Balance (₹) *</label>
                  <input
                    type="number"
                    required
                    value={approvalApprovedAmt}
                    onChange={(e) => setApprovalApprovedAmt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    placeholder="e.g. 10000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ledger Start Date (Disbursal) *</label>
                  <input
                    type="date"
                    required
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Charges / Interest (%)</label>
                    <div className="flex gap-2">
                      <select
                        value={approvalInterestPctOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApprovalInterestPctOption(val);
                          if (val !== 'custom') {
                            setApprovalInterestPct(val);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="11">11%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="custom">Custom %</option>
                      </select>
                      {approvalInterestPctOption === 'custom' && (
                        <input
                          type="number"
                          required
                          value={approvalInterestPct}
                          onChange={(e) => setApprovalInterestPct(e.target.value)}
                          className="w-24 px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          placeholder="%"
                          min="0"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upfront Platform Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      value={approvalPlatformCharges}
                      onChange={(e) => setApprovalPlatformCharges(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
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
                      value={approvalDailyInstallment}
                      onChange={(e) => setApprovalDailyInstallment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      placeholder="e.g. 200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Duration (Days) *</label>
                    <input
                      type="number"
                      required
                      value={approvalDurationDays}
                      onChange={(e) => setApprovalDurationDays(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

                {/* Real-time ledger calculations */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Calculator size={13} className="text-blue-600" />
                    <span>Calculated Ledger Summary</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Approved Balance</span>
                    <span className="font-semibold text-slate-800">₹{Number(approvalApprovedAmt) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Charges / Interest ({Number(approvalInterestPct) || 0}%)</span>
                    <span className="font-semibold text-blue-600">+ ₹{Number(approvalInterestAmt) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Downpayment & Platform charges (Deducted)</span>
                    <span className="font-semibold text-rose-500">- ₹{Number(approvalPlatformCharges) || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-2">
                    <span className="text-slate-500 font-bold">Net Account Value (Given to client)</span>
                    <span className="font-extrabold text-emerald-600 text-sm">₹{Math.max(0, (Number(approvalApprovedAmt) || 0) - (Number(approvalPlatformCharges) || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Total settlement target basis</span>
                    <span className="font-extrabold text-slate-800 text-sm">₹{((Number(approvalApprovedAmt) || 0) + (Number(approvalInterestAmt) || 0)) - (Number(approvalPlatformCharges) || 0)}</span>
                  </div>
                  {(Number(approvalDailyInstallment) || 0) * (Number(approvalDurationDays) || 0) > 0 && 
                   (Number(approvalDailyInstallment) || 0) * (Number(approvalDurationDays) || 0) !== 
                   ((Number(approvalApprovedAmt) || 0) + (Number(approvalInterestAmt) || 0)) && (
                    <div className="text-[10px] text-amber-600 font-medium">
                      ⚠️ Note: Daily (₹{approvalDailyInstallment}) x Duration ({approvalDurationDays} days) = ₹{(Number(approvalDailyInstallment) || 0) * (Number(approvalDurationDays) || 0)} projected aggregate payments. (Settlement target basis is approved ₹{(Number(approvalApprovedAmt) || 0) + (Number(approvalInterestAmt) || 0)}).
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                 <button
                  type="submit"
                  disabled={approvalFormLoading}
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                    isEditingActive 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/15' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15'
                  }`}
                >
                  {approvalFormLoading 
                    ? (isEditingActive ? 'Saving...' : 'Approving...') 
                    : (isEditingActive ? 'Save Changes' : 'Confirm & Approve')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Confirm Modal ─────────────────────────────────────────── */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-slate-600 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={closeConfirm}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-md shadow-rose-500/20"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
