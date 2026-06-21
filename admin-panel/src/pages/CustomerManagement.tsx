import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Power, 
  UserCheck, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  Eye,
  Upload,
  CreditCard,
  Download,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string | null;
  occupation: string | null;
  shop_name: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  aadhaar_url: string | null;
  avatar_url: string | null;
  created_at: string;
  loan_count?: number;
  active_loan_count?: number;
}

interface CustomerManagementProps {
  token: string;
}

export default function CustomerManagement({ token }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected Customer Modal View
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [selectedCustLoans, setSelectedCustLoans] = useState<any[]>([]);
  const [selectedCustStats, setSelectedCustStats] = useState<any | null>(null);
  const [selectedCustLatePayments, setSelectedCustLatePayments] = useState<any[]>([]);
  const [selectedCustLoading, setSelectedCustLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'loans'>('profile');

  // Edit Customer Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editManualLateCount, setEditManualLateCount] = useState(0);
  const [editManualLateAmount, setEditManualLateAmount] = useState(0);
  const [editManualLateDates, setEditManualLateDates] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  
  // Aadhaar upload within modal
  const [aadhaarUploading, setAadhaarUploading] = useState(false);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Full-screen PDF viewer
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  // Avatar upload within modal
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Installment Expansion & Editing
  const [expandedLoans, setExpandedLoans] = useState<Record<string, boolean>>({});
  const [editingInstallment, setEditingInstallment] = useState<any | null>(null);
  const [editInstDueDate, setEditInstDueDate] = useState('');
  const [editInstStatus, setEditInstStatus] = useState<'Unpaid' | 'Paid' | 'Pending'>('Unpaid');
  const [editInstPaymentDate, setEditInstPaymentDate] = useState('');
  const [editInstLoading, setEditInstLoading] = useState(false);
  const [editInstError, setEditInstError] = useState('');

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

  const toggleLoanSchedule = (loanId: string) => {
    setExpandedLoans(prev => ({
      ...prev,
      [loanId]: !prev[loanId]
    }));
  };

  const handleOpenInstallmentEdit = (inst: any) => {
    setEditingInstallment(inst);
    setEditInstDueDate(inst.due_date);
    setEditInstStatus(inst.status);
    setEditInstPaymentDate(inst.payment_date ? inst.payment_date.substring(0, 10) : '');
    setEditInstError('');
    setEditInstLoading(false);
  };

  const handleEditInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment) return;
    setEditInstLoading(true);
    setEditInstError('');
    try {
      const payload = {
        due_date: editInstDueDate,
        status: editInstStatus,
        // Store a full ISO datetime string. If admin picked a date, use noon IST on that date.
        // If no date provided, use current UTC time. Never store just a plain date string.
        payment_date: editInstStatus === 'Paid'
          ? (editInstPaymentDate
              ? new Date(`${editInstPaymentDate}T06:30:00.000Z`).toISOString() // noon IST = 06:30 UTC
              : new Date().toISOString())
          : null
      };
      await axios.put(`/api/admin/installments/${editingInstallment.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedCust) {
        // Reload details to refresh the customer views
        const response = await axios.get(`/api/admin/customers/${selectedCust.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setSelectedCustLoans(response.data.loans || []);
          setSelectedCustStats(response.data.paymentStats || null);
          setSelectedCustLatePayments(response.data.latePaymentsList || []);
        }
      }
      setEditingInstallment(null);
      alert('Installment details updated successfully!');
    } catch (err: any) {
      const errVal = err.response?.data?.error;
      setEditInstError(typeof errVal === 'object' && errVal !== null ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal || 'Failed to update installment.'));
    } finally {
      setEditInstLoading(false);
    }
  };

  const handleResetInstallmentDelay = (installmentId: string) => {
    showConfirm(
      'Set Installment On-Time',
      'Are you sure you want to reset this installment delay to be On-Time? The payment date will be adjusted to match the due date.',
      async () => {
        closeConfirm();
        try {
          await axios.post('/api/admin/payments/reset-delays', { installmentId }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Installment reset to on-time successfully!');
          if (selectedCust) {
            const response = await axios.get(`/api/admin/customers/${selectedCust.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
              setSelectedCustLoans(response.data.loans || []);
              setSelectedCustStats(response.data.paymentStats || null);
              setSelectedCustLatePayments(response.data.latePaymentsList || []);
            }
          }
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to reset installment delay.');
        }
      }
    );
  };

  const handleResetAllLoanDelays = (loanId: string) => {
    showConfirm(
      'Reset All to On-Time',
      'Are you sure you want to reset ALL paid installments of this ledger to be On-Time? This will remove all late payment history for this ledger.',
      async () => {
        closeConfirm();
        try {
          await axios.post('/api/admin/payments/reset-delays', { loanId }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('All paid installments for this ledger have been reset to on-time!');
          if (selectedCust) {
            const response = await axios.get(`/api/admin/customers/${selectedCust.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
              setSelectedCustLoans(response.data.loans || []);
              setSelectedCustStats(response.data.paymentStats || null);
              setSelectedCustLatePayments(response.data.latePaymentsList || []);
            }
          }
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to reset ledger delays.');
        }
      }
    );
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const origin = baseUrl 
      ? (baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl)
      : 'http://localhost:8081';
    return `${origin}${path}`;
  };

  const openCustomerDetailsModal = async (cust: Customer) => {
    setSelectedCust(cust);
    setSelectedCustLoans([]);
    setSelectedCustStats(null);
    setSelectedCustLatePayments([]);
    setSelectedCustLoading(true);
    setActiveTab('profile');
    try {
      const response = await axios.get(`/api/admin/customers/${cust.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setSelectedCustLoans(response.data.loans || []);
        setSelectedCustStats(response.data.paymentStats || null);
        setSelectedCustLatePayments(response.data.latePaymentsList || []);
      }
    } catch (err) {
      console.error('Failed to load customer details & account history:', err);
    } finally {
      setSelectedCustLoading(false);
    }
  };

  const handleAadhaarUpload = async (file: File) => {
    if (!selectedCust) return;
    setAadhaarUploading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaar', file);
      const response = await axios.post(`/api/admin/customers/${selectedCust.id}/aadhaar`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUrl = response.data.aadhaar_url;
      setSelectedCust(prev => prev ? { ...prev, aadhaar_url: updatedUrl } : null);
      setCustomers(prev => prev.map(c => c.id === selectedCust.id ? { ...c, aadhaar_url: updatedUrl } : c));
      alert('Aadhaar card uploaded successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload Aadhaar card.');
    } finally {
      setAadhaarUploading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!selectedCust) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await axios.post(`/api/admin/customers/${selectedCust.id}/avatar`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUrl = response.data.avatar_url;
      setSelectedCust(prev => prev ? { ...prev, avatar_url: updatedUrl } : null);
      setCustomers(prev => prev.map(c => c.id === selectedCust.id ? { ...c, avatar_url: updatedUrl } : c));
      alert('Profile photo uploaded successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };
  
  // Create Customer Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAadhaarFile, setNewAadhaarFile] = useState<File | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: statusFilter || undefined, search: search || undefined }
      });
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      } else if (response.data && response.data.error) {
        const errVal = response.data.error;
        setError(typeof errVal === 'object' ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal));
      } else {
        setError('Received invalid data format from server.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, search, token]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
    try {
      await axios.patch(`/api/admin/customers/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
      if (selectedCust && selectedCust.id === id) {
        setSelectedCust(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update customer status.');
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete customer "${name}"?\n\nThis will also delete all their loans, installments, and notifications. This action CANNOT be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/api/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Customer "${name}" deleted successfully.`);
      setSelectedCust(null); // Close modal if open
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer.');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMobile || !newPassword) {
      setFormError('Name, Mobile Number, and Password are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('full_name', newName);
      formData.append('mobile_number', newMobile);
      if (newEmail) formData.append('email', newEmail);
      if (newOccupation) formData.append('occupation', newOccupation);
      if (newShopName) formData.append('shop_name', newShopName);
      if (newAddress) formData.append('address', newAddress);
      formData.append('password', newPassword);
      if (newAadhaarFile) {
        formData.append('aadhaar', newAadhaarFile);
      }
      if (newAvatarFile) {
        formData.append('avatar', newAvatarFile);
      }

      await axios.post('/api/admin/customers', formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      // Reset Form
      setNewName('');
      setNewMobile('');
      setNewEmail('');
      setNewOccupation('');
      setNewShopName('');
      setNewAddress('');
      setNewPassword('');
      setNewAadhaarFile(null);
      setNewAvatarFile(null);
      setShowCreateModal(false);
      fetchCustomers();
    } catch (err: any) {
      const errVal = err.response?.data?.error;
      setFormError(typeof errVal === 'object' && errVal !== null ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal || 'Failed to create customer.'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedCust) return;
    setEditName(selectedCust.full_name);
    setEditMobile(selectedCust.mobile_number);
    setEditEmail(selectedCust.email || '');
    setEditOccupation(selectedCust.occupation || '');
    setEditShopName(selectedCust.shop_name || '');
    setEditAddress(selectedCust.address || '');
    setEditManualLateCount(selectedCustStats?.manualLateCount || 0);
    setEditManualLateAmount(selectedCustStats?.manualLateAmount || 0);
    setEditManualLateDates(selectedCustStats?.manualLateDates || '');
    setEditFormError('');
    setEditFormLoading(false);
    setShowEditModal(true);
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editMobile) {
      setEditFormError('Name and Mobile Number are required.');
      return;
    }
    setEditFormLoading(true);
    setEditFormError('');
    try {
      const payload = {
        full_name: editName,
        mobile_number: editMobile,
        email: editEmail || null,
        occupation: editOccupation || null,
        shop_name: editShopName || null,
        address: editAddress || null,
        manual_late_payments_count: Number(editManualLateCount),
        manual_late_payments_amount: Number(editManualLateAmount),
        manual_late_payments_dates: editManualLateDates || null
      };
      
      const response = await axios.put(`/api/admin/customers/${selectedCust?.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = response.data.user;
      
      // Update local state
      setSelectedCust(prev => prev ? { ...prev, ...updatedUser } : null);
      setCustomers(prev => prev.map(c => c.id === updatedUser.id ? { ...c, ...updatedUser } : c));
      
      // Refetch customer details to refresh stats
      if (selectedCust) {
        const statsResponse = await axios.get(`/api/admin/customers/${selectedCust.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsResponse.data) {
          setSelectedCustStats(statsResponse.data.paymentStats || null);
          setSelectedCustLatePayments(statsResponse.data.latePaymentsList || []);
        }
      }
      
      setShowEditModal(false);
      alert('Customer details updated successfully!');
    } catch (err: any) {
      const errVal = err.response?.data?.error;
      setEditFormError(typeof errVal === 'object' && errVal !== null ? (errVal.message || errVal.code || JSON.stringify(errVal)) : String(errVal || 'Failed to update customer details.'));
    } finally {
      setEditFormLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">

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

      {pdfViewerUrl && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <span className="text-white font-bold text-sm">{pdfViewerUrl.split('/').pop()}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Download button inside PDF viewer */}
              <a
                href={pdfViewerUrl}
                download={pdfViewerUrl.split('/').pop()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Download size={13} /> Download
              </a>
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <X size={14} /> Close PDF
              </button>
            </div>
          </div>

          {/* PDF fills the rest */}
          <iframe
            src={pdfViewerUrl}
            title="Aadhaar PDF Viewer"
            className="flex-1 w-full border-0"
            style={{ height: 'calc(100vh - 52px)' }}
          />
        </div>
      )}

      <div className="space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Customer Management</h3>
          <p className="text-xs text-slate-500">Approve registrations, manage profiles, and review credentials.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
        >
          <UserPlus size={16} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Table & Data list */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-500 font-semibold">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No customers matched your filter configurations.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Occupation / Shop</th>
                  <th className="px-6 py-4">Ledger Status</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {c.avatar_url ? (
                          <img
                            src={getImageUrl(c.avatar_url)}
                            alt={c.full_name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200/50 bg-slate-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase border border-slate-200/50">
                            {c.full_name.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <button
                            onClick={() => openCustomerDetailsModal(c)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left block"
                          >
                            {c.full_name}
                          </button>
                          <div className="flex gap-2 items-center text-[10px] font-semibold text-slate-400 mt-0.5">
                            <span className="font-mono">ID: {c.id.slice(0, 8)}</span>
                            {c.loan_count !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                Ledgers: {c.loan_count} ({c.active_loan_count || 0} active)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-700 block">{c.mobile_number}</span>
                        {c.email && <span className="text-xs text-slate-400 block">{c.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-700 block">{c.occupation || 'N/A'}</span>
                        {c.shop_name && <span className="text-xs text-slate-400 block">{c.shop_name}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(c.active_loan_count || 0) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Live
                        </span>
                      ) : (c.loan_count || 0) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                          Closed / Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200">
                          No Ledgers
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        c.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : c.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : c.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1.5 items-center">
                          {/* View Profile button - always visible */}
                          <button
                            onClick={() => openCustomerDetailsModal(c)}
                            title="View Customer Profile & Aadhaar"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          {/* Aadhaar badge */}
                          {c.aadhaar_url && (
                            <span title="Aadhaar uploaded" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <CreditCard size={14} />
                            </span>
                          )}
                          {c.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'approved')}
                              title="Approve Customer"
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'rejected')}
                              title="Reject Customer"
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'deactivated')}
                            title="Deactivate Customer"
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors"
                          >
                            <Power size={14} />
                          </button>
                        )}
                        {c.status === 'deactivated' && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'approved')}
                            title="Activate Customer"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.full_name)}
                          title="Delete Customer"
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Customer Profile View Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                {selectedCust.avatar_url ? (
                  <img
                    src={getImageUrl(selectedCust.avatar_url)}
                    alt={selectedCust.full_name}
                    className="h-16 w-16 rounded-full object-cover border-2 border-slate-700 bg-white"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-xl uppercase">
                    {selectedCust.full_name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold">{selectedCust.full_name}</h4>
                  <p className="text-xs text-slate-300 font-mono mt-1">UUID: {selectedCust.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCust(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Profile & Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('loans')}
                className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'loans'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Account History</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'loans' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedCustLoading ? '...' : selectedCustLoans.length}
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'profile' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Phone size={16} className="text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Mobile Number</span>
                        <span className="font-semibold text-slate-700">{selectedCust.mobile_number}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Mail size={16} className="text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Address</span>
                        <span className="font-semibold text-slate-700">{selectedCust.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Briefcase size={16} className="text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Occupation</span>
                        <span className="font-semibold text-slate-700">{selectedCust.occupation || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <MapPin size={16} className="text-blue-600" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Address</span>
                        <span className="font-semibold text-slate-700">{selectedCust.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const paidOnTime = selectedCustStats?.paidOnTime || 0;
                    const paidLate = selectedCustStats?.paidLate || 0;
                    const overdueUnpaid = selectedCustStats?.overdueUnpaid || 0;
                    const complianceTotal = paidOnTime + paidLate + overdueUnpaid;
                    const complianceScore = complianceTotal > 0 ? Math.round((paidOnTime / complianceTotal) * 100) : 100;
                    
                    let recStatus = 'Good';
                    if (overdueUnpaid > 0 || complianceScore < 75) {
                      recStatus = 'High Risk';
                    } else if (complianceScore < 90 || paidLate > 0) {
                      recStatus = 'Caution';
                    }

                    return selectedCustStats ? (
                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Ledger Score & Payment Compliance
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Compliance Score Card */}
                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Compliance Score</span>
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className="text-3xl font-black text-slate-900">{complianceScore}%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-2 font-medium">On-time payment ratio</span>
                          </div>

                          {/* Payment Stats Breakdown Card */}
                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between sm:col-span-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Repayment History</span>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100/50">
                                <span className="text-[9px] font-bold text-emerald-600 block uppercase">On-Time</span>
                                <span className="text-lg font-extrabold text-emerald-700">{selectedCustStats.paidOnTime}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100/50">
                                <span className="text-[9px] font-bold text-amber-600 block uppercase">Paid Late</span>
                                <span className="text-lg font-extrabold text-amber-700">{selectedCustStats.paidLate}</span>
                              </div>
                              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100/50">
                                <span className="text-[9px] font-bold text-rose-600 block uppercase">Overdue</span>
                                <span className="text-lg font-extrabold text-rose-700">{selectedCustStats.overdueUnpaid}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Card */}
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                          recStatus === 'Good'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : recStatus === 'Caution'
                            ? 'bg-amber-50 border-amber-200 text-amber-850'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <div className="shrink-0 mt-0.5">
                            {recStatus === 'Good' && <CheckCircle2 size={18} className="text-emerald-600" />}
                            {recStatus === 'Caution' && <AlertCircle size={18} className="text-amber-600" />}
                            {recStatus === 'High Risk' && <XCircle size={18} className="text-rose-600" />}
                          </div>
                          <div>
                            <h6 className="text-xs font-bold uppercase tracking-wider">
                              Recommendation: {
                                recStatus === 'Good' 
                                  ? 'Approved (Excellent Record)' 
                                  : recStatus === 'Caution'
                                  ? 'Approve with Caution'
                                  : 'High Risk (Not Recommended)'
                              }
                            </h6>
                            <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                              {recStatus === 'Good' && 'This customer has an excellent track record of making on-time payments. Standard ledger approval is recommended.'}
                              {recStatus === 'Caution' && `This customer has some late payments (${selectedCustStats.paidLate}). Monitor collections closely if a new ledger is approved.`}
                              {recStatus === 'High Risk' && `This customer is currently high risk due to ${selectedCustStats.overdueUnpaid > 0 ? `${selectedCustStats.overdueUnpaid} overdue unpaid installment(s)` : `low compliance score of ${complianceScore}%`}. Creating a new ledger is not recommended.`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Display manual late overrides details if set */}
                        {(selectedCustStats.manualLateCount > 0 || selectedCustStats.manualLateAmount > 0) && (
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
                            <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">Manual Overrides Entered:</span>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold">Manual Late Payments:</span>
                                <span className="font-semibold">{selectedCustStats.manualLateCount} time(s)</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold">Manual Late Amount:</span>
                                <span className="font-semibold">₹{selectedCustStats.manualLateAmount}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detailed Payment Delay Dates */}
                        {((selectedCustLatePayments && selectedCustLatePayments.length > 0) || (selectedCustStats.manualLateDates)) && (
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-650 space-y-2">
                            <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">Detailed Payment Delay Dates:</span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {selectedCustLatePayments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-900">
                                  <span>📅 Due: {p.dueDate} | Paid: {p.paymentDate}</span>
                                  <span className="font-bold">{p.daysLate} days delay</span>
                                </div>
                              ))}
                              {selectedCustStats.manualLateDates && (
                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                                  <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Legacy Late Payment Dates / Details:</span>
                                  <p className="whitespace-pre-line font-mono text-xs">{selectedCustStats.manualLateDates}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}

                  {/* Profile Photo Attachment Viewer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        Profile Photo
                      </h5>
                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {avatarUploading ? 'Uploading...' : selectedCust.avatar_url ? 'Replace Photo' : 'Upload Photo'}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
                      />
                    </div>

                    {selectedCust.avatar_url ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-3 flex items-center gap-4">
                        <img
                          src={getImageUrl(selectedCust.avatar_url)}
                          alt="Profile avatar"
                          className="h-16 w-16 rounded-full object-cover border border-slate-200 bg-white"
                        />
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-700 block">Active Avatar</span>
                          <span>Image successfully registered and loaded.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                        <p className="text-xs text-slate-400 font-semibold">No profile photo uploaded yet.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Click "Upload Photo" above to add it.</p>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Attachment Viewer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={13} /> Aadhaar Card
                      </h5>
                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={() => aadhaarInputRef.current?.click()}
                        disabled={aadhaarUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {aadhaarUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {aadhaarUploading ? 'Uploading...' : selectedCust.aadhaar_url ? 'Replace' : 'Upload Aadhaar'}
                      </button>
                      <input
                        ref={aadhaarInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAadhaarUpload(f); e.target.value = ''; }}
                      />
                    </div>

                    {selectedCust.aadhaar_url ? (() => {
                      const rawUrl = selectedCust.aadhaar_url!;
                      const fullUrl = getImageUrl(rawUrl);
                      const filename = rawUrl.split('/').pop() || 'aadhaar';
                      const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(filename);
                      return (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                          {/* Filename bar */}
                          <div className="px-3 py-2 flex items-center gap-2.5 text-slate-600 text-xs font-semibold border-b border-slate-100">
                            <FileText size={15} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate flex-1">{filename}</span>
                            {/* Download button — always shown */}
                            <a
                              href={fullUrl}
                              download={filename}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                              title="Download Aadhaar"
                            >
                              <Download size={11} /> Download
                            </a>
                            {/* Open full-screen button — PDF only */}
                            {!isImage && (
                              <button
                                type="button"
                                onClick={() => setPdfViewerUrl(fullUrl)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
                              >
                                📄 View PDF
                              </button>
                            )}
                          </div>

                          {/* Inline viewer — image */}
                          {isImage && (
                            <div className="bg-white p-3">
                              <img
                                src={fullUrl}
                                alt="Aadhaar Card"
                                className="w-full rounded-lg object-contain"
                                style={{ maxHeight: '400px' }}
                                onError={(e: any) => {
                                  e.target.style.display = 'none';
                                  (e.target.nextSibling as HTMLElement).style.display = 'flex';
                                }}
                              />
                              <div style={{ display: 'none' }} className="p-4 items-center justify-center text-xs text-rose-500 font-semibold">
                                ⚠️ Could not load Aadhaar image.
                              </div>
                            </div>
                          )}

                          {/* PDF preview placeholder */}
                          {!isImage && (
                            <div className="bg-slate-100 flex flex-col items-center justify-center gap-3 py-8">
                              <div className="text-4xl">📄</div>
                              <p className="text-sm font-semibold text-slate-600">{filename}</p>
                              <p className="text-xs text-slate-400">Click "View PDF" above to open full-screen</p>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                        <CreditCard size={28} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">No Aadhaar document uploaded yet.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Click "Upload Aadhaar" above to add it.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {selectedCustLoading ? (
                    <div className="py-12 flex flex-col justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-blue-600" size={24} />
                      <span className="text-xs font-bold text-slate-500">Loading account history...</span>
                    </div>
                  ) : selectedCustLoans.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No account records found for this customer.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        return selectedCustLoans.map((l) => (
                          <div key={l.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-slate-800">
                                  Approved Balance: ₹{l.approved_amount}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Ledger Ref ID: DMF-{l.id.split('-')[0].toUpperCase()} | Net Account Value: ₹{l.amount_disbursed}
                                </span>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                l.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : l.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : l.status === 'Completed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {l.status === 'Active' ? 'Live' : l.status === 'Completed' ? 'Closed / Completed' : l.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-500">
                              <div>
                                <span className="font-semibold block text-slate-400 text-[10px] uppercase">Settlement Basis</span>
                                <span className="font-bold text-slate-700">₹{l.total_repayment}</span>
                              </div>
                              <div>
                                <span className="font-semibold block text-slate-400 text-[10px] uppercase">Daily Installment</span>
                                <span className="font-bold text-slate-700">₹{l.daily_installment} / {l.duration_days} Days</span>
                              </div>
                              <div>
                                <span className="font-semibold block text-slate-400 text-[10px] uppercase">Remaining Balance</span>
                                <span className="font-bold text-slate-900">₹{l.remaining_balance}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Requested: {new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                              {l.approval_date && (
                                <span>Approved: {new Date(l.approval_date).toLocaleDateString('en-IN')}</span>
                              )}
                            </div>

                            {/* Repayment Schedule Accordion Toggle */}
                            <div className="border-t border-slate-200/60 pt-2.5">
                              <button
                                type="button"
                                onClick={() => toggleLoanSchedule(l.id)}
                                className="w-full flex items-center justify-between text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline py-1 transition-all"
                              >
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {expandedLoans[l.id] ? 'Hide Repayment Details' : 'View Repayment Details & Delay Schedule'}
                                </span>
                                {expandedLoans[l.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              {expandedLoans[l.id] && (
                                <div className="mt-2.5 space-y-2 max-h-[260px] overflow-y-auto pr-1 bg-white p-2.5 rounded-xl border border-slate-200">
                                  {l.installments && l.installments.some((inst: any) => {
                                    const isPaid = inst.status === 'Paid';
                                    const payDateOnly = inst.payment_date ? inst.payment_date.substring(0, 10) : '';
                                    return isPaid && payDateOnly && payDateOnly > inst.due_date;
                                  }) && (
                                    <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-2 rounded-xl mb-1.5 sticky top-0 z-10 shadow-sm">
                                      <span className="text-[10px] font-bold text-amber-850 pl-1">Late payments detected on this ledger.</span>
                                      <button
                                        type="button"
                                        onClick={() => handleResetAllLoanDelays(l.id)}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                                      >
                                        <Check size={10} />
                                        <span>Reset All to On-Time</span>
                                      </button>
                                    </div>
                                  )}
                                  {l.installments && l.installments.length > 0 ? (
                                    l.installments.map((inst: any, idx: number) => {
                                      const isPaid = inst.status === 'Paid';
                                      const isPending = inst.status === 'Pending';
                                      const payDateOnly = inst.payment_date ? inst.payment_date.substring(0, 10) : '';
                                      const isLate = isPaid && payDateOnly && payDateOnly > inst.due_date;
                                      const isOverdue = !isPaid && inst.due_date < todayStr;
                                      
                                      let delayDays = 0;
                                      if (isLate) {
                                        const dueTime = new Date(inst.due_date).getTime();
                                        const payTime = new Date(payDateOnly).getTime();
                                        delayDays = Math.max(1, Math.ceil((payTime - dueTime) / (1000 * 60 * 60 * 24)));
                                      }

                                      return (
                                        <div 
                                          key={inst.id} 
                                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                                            isLate 
                                              ? 'bg-amber-50/45 border-amber-100 hover:bg-amber-50' 
                                              : isOverdue 
                                              ? 'bg-rose-50/45 border-rose-100 hover:bg-rose-50'
                                              : isPaid 
                                              ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-55/60'
                                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-slate-700">Daily Installment #{idx + 1}</span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold border uppercase ${
                                                isLate 
                                                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                                  : isOverdue
                                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                                  : isPaid
                                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                  : isPending
                                                  ? 'bg-amber-50 text-amber-700 border-amber-150'
                                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                                              }`}>
                                                {isLate ? `Paid Late (${delayDays}d)` : isOverdue ? 'Overdue' : inst.status}
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                                              <div>Due: {new Date(inst.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                              {isPaid && inst.payment_date && (
                                                <div className="text-emerald-700 font-semibold">
                                                  Paid on: {new Date(inst.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                              )}
                                              {isPending && (
                                                <div className="text-amber-655 font-semibold animate-pulse">
                                                  Proof submitted, waiting verification.
                                                </div>
                                              )}
                                            </div>
                                            {isLate && (
                                              <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                                                ⚠️ Delay of {delayDays} day(s) detected.
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex gap-1.5 self-end sm:self-center">
                                            {isLate && (
                                              <button
                                                type="button"
                                                onClick={() => handleResetInstallmentDelay(inst.id)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                                              >
                                                <Check size={10} />
                                                <span>Set On-Time</span>
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleOpenInstallmentEdit(inst)}
                                              className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg font-bold text-[10px] transition-colors"
                                            >
                                              <Edit size={10} />
                                              <span>Edit Repayment</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-[10px] text-slate-400 text-center py-4 font-bold">No installment records generated yet.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (selectedCust) {
                    handleDeleteCustomer(selectedCust.id, selectedCust.full_name);
                  }
                }}
                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-xl text-xs font-bold transition-all"
              >
                Delete Customer
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCust(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h4 className="text-lg font-bold">Onboard New Customer</h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="9998887776"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Occupation</label>
                    <input
                      type="text"
                      value={newOccupation}
                      onChange={(e) => setNewOccupation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Merchant"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Shop / Company Name</label>
                  <input
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Grand Spices Ltd."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address</label>
                  <textarea
                    rows={2}
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Enter complete customer address details"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Profile Photo (Optional) (PNG, JPG, JPEG)</label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewAvatarFile(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Aadhaar Card (PDF, PNG, JPG)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewAadhaarFile(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Login Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Set customer portal password"
                  />
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
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-750 transition-all"
                >
                  {formLoading ? 'Creating...' : 'Onboard Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h4 className="text-lg font-bold">Edit Customer Profile</h4>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditCustomer}>
              <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                {editFormError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{editFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Occupation</label>
                    <input
                      type="text"
                      value={editOccupation}
                      onChange={(e) => setEditOccupation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Shop / Company Name</label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address</label>
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Legacy Compliance Overrides */}
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Legacy Repayment Compliance Overrides</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manual Late Count</label>
                      <input
                        type="number"
                        min="0"
                        value={editManualLateCount}
                        onChange={(e) => setEditManualLateCount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manual Late Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editManualLateAmount}
                        onChange={(e) => setEditManualLateAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manual Late Payment Dates / Logs</label>
                    <textarea
                      rows={2}
                      value={editManualLateDates}
                      onChange={(e) => setEditManualLateDates(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      placeholder="e.g. Paid late on 12 May 2026, 15 May 2026"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">These numbers are added directly to the compliance tracking scores for past offline history.</p>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-750 transition-all"
                >
                  {editFormLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Installment Repayment Modal */}
      {editingInstallment && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Edit Installment Repayment</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {editingInstallment.id.split('-')[0].toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setEditingInstallment(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditInstallment}>
              <div className="p-5 space-y-4">
                {editInstError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 text-rose-800 text-xs">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{editInstError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editInstDueDate}
                    onChange={(e) => setEditInstDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repayment Status</label>
                  <select
                    value={editInstStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setEditInstStatus(newStatus);
                      if (newStatus === 'Paid' && !editInstPaymentDate) {
                        setEditInstPaymentDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  >
                    <option value="Unpaid">Unpaid / Unsettled</option>
                    <option value="Paid">Paid / Settled</option>
                    <option value="Pending">Pending Verification</option>
                  </select>
                </div>

                {editInstStatus === 'Paid' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual Payment Date</label>
                    <input
                      type="date"
                      required
                      value={editInstPaymentDate}
                      onChange={(e) => setEditInstPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] text-slate-500">If the payment date is later than the due date, this installment will automatically count as Paid Late.</p>
                      <button
                        type="button"
                        onClick={() => setEditInstPaymentDate(editInstDueDate)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline bg-transparent border-0 cursor-pointer p-0"
                      >
                        Set On-Time
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingInstallment(null)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editInstLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-all"
                >
                  {editInstLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
