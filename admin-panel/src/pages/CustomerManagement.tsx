import React, { useEffect, useRef, useState } from 'react';
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
  Eye,
  Upload,
  CreditCard
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
  created_at: string;
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
  
  // Aadhaar upload within modal
  const [aadhaarUploading, setAadhaarUploading] = useState(false);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  const handleAadhaarUpload = async (file: File) => {
    if (!selectedCust) return;
    setAadhaarUploading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaar', file);
      const response = await axios.post(`/api/admin/customers/${selectedCust.id}/aadhaar`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
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
        setError(response.data.error);
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

      await axios.post('/api/admin/customers', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
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
      setShowCreateModal(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create customer.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase border border-slate-200/50">
                          {c.full_name.slice(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedCust(c)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left block"
                          >
                            {c.full_name}
                          </button>
                          <span className="text-[10px] font-semibold text-slate-400 block font-mono">ID: {c.id.slice(0, 8)}</span>
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
                            onClick={() => setSelectedCust(c)}
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
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold">{selectedCust.full_name}</h4>
                <p className="text-xs text-slate-300 font-mono mt-1">UUID: {selectedCust.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCust(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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

              {/* Aadhaar Attachment Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={13} /> Aadhaar Card
                  </h5>
                  {/* Upload button */}
                  <button
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
                  const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                  const filename = rawUrl.split('/').pop() || 'aadhaar';
                  const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(filename);
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      {isImage ? (
                        <div className="relative">
                          <img
                            src={fullUrl}
                            alt="Aadhaar Card"
                            className="w-full max-h-64 object-contain bg-white"
                            onError={(e: any) => { e.target.style.display = 'none'; (e.target.nextSibling as HTMLElement).style.display = 'flex'; }}
                          />
                          <div style={{display:'none'}} className="p-4 items-center justify-center text-xs text-rose-500 font-semibold">
                            ⚠️ Could not load image. <a href={fullUrl} target="_blank" rel="noreferrer" className="underline ml-1">Open directly</a>
                          </div>
                        </div>
                      ) : null}
                      <div className="p-3 flex items-center justify-between border-t border-slate-100">
                        <div className="flex items-center gap-2.5 text-slate-600 text-xs font-semibold">
                          <FileText size={16} className="text-slate-400" />
                          <span className="truncate max-w-[200px]">{filename}</span>
                        </div>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
                        >
                          {isImage ? '🔍 View Full' : '📄 Open PDF'}
                        </a>
                      </div>
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
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCust(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Close
              </button>
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

    </div>
  );
}
