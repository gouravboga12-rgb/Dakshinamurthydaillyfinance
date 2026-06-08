import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Percent,
  CheckCircle,
  ShieldCheck,
  QrCode
} from 'lucide-react';

interface SettingsProps {
  token: string;
}

export default function Settings({ token }: SettingsProps) {
  const [platformFee, setPlatformFee] = useState('1000');
  const [defaultDuration, setDefaultDuration] = useState('50');
  const [defaultInstallment, setDefaultInstallment] = useState('200');
  const [upiMobileNumber, setUpiMobileNumber] = useState('9999999999');
  const [officialUpiId, setOfficialUpiId] = useState('dakshinamurthy@ybl');
  const [saved, setSaved] = useState(false);

  // QR config states
  const [qrUrl, setQrUrl] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrSaved, setQrSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const s = response.data.settings;
      if (s) {
        if (s.upi_qr_url) setQrUrl(s.upi_qr_url);
        if (s.upi_mobile_number) setUpiMobileNumber(s.upi_mobile_number);
        if (s.platform_fee) setPlatformFee(s.platform_fee);
        if (s.default_duration) setDefaultDuration(s.default_duration);
        if (s.default_installment) setDefaultInstallment(s.default_installment);
        if (s.official_upi_id) setOfficialUpiId(s.official_upi_id);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/settings', {
        upi_mobile_number: upiMobileNumber,
        platform_fee: platformFee,
        default_duration: defaultDuration,
        default_installment: defaultInstallment,
        official_upi_id: officialUpiId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings.');
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      setQrPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrFile) return;
    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('qr', qrFile);

      const response = await axios.post('/api/admin/settings/upi-qr', formData, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      setQrUrl(response.data.upi_qr_url);
      setQrFile(null);
      setQrPreviewUrl(null);
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload QR code.');
    } finally {
      setUploadingQr(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl animate-fade-in">
      
      <div>
        <h3 className="text-lg font-bold text-slate-900">Application Settings</h3>
        <p className="text-xs text-slate-500">Configure global platform metrics, interest configurations, and local system backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Pane: Config Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Lending Guidelines Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {saved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Global configuration settings updated and saved successfully!</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Percent size={18} className="text-blue-600" />
                <h4 className="font-bold text-sm text-slate-800">Lending Guidelines</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Default Platform Charges (₹)</label>
                  <input
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Default Duration (Days)</label>
                  <input
                    type="number"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Default Installment Amount (₹)</label>
                  <input
                    type="number"
                    value={defaultInstallment}
                    onChange={(e) => setDefaultInstallment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">UPI Mobile Number for Payments</label>
                  <input
                    type="text"
                    value={upiMobileNumber}
                    onChange={(e) => setUpiMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    placeholder="e.g. 9999999999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Official UPI ID</label>
                  <input
                    type="text"
                    value={officialUpiId}
                    onChange={(e) => setOfficialUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    placeholder="e.g. dakshinamurthy@ybl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
              >
                Save Configuration Settings
              </button>
            </form>
          </div>

          {/* UPI Payment QR Config Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <QrCode size={18} className="text-blue-600" />
              <h4 className="font-bold text-sm text-slate-800">UPI Payment QR Code</h4>
            </div>

            {qrSaved && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle size={16} />
                <span>UPI Payment QR Code updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Preview current QR */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Current QR Preview</span>
                {qrUrl ? (
                  <img 
                    src={qrUrl.startsWith('http') ? qrUrl : `${window.location.origin}${qrUrl}`} 
                    alt="UPI QR Code" 
                    className="w-40 h-40 object-contain bg-white p-2 border border-slate-200 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">No QR set</div>
                )}
              </div>

              {/* Upload QR form */}
              <form onSubmit={handleUploadQr} className="flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upload New QR Code Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleQrFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2.5 bg-slate-50 cursor-pointer"
                  />
                </div>

                {qrPreviewUrl && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-700">✓ Previewing new selection...</span>
                    <button 
                      type="button" 
                      onClick={() => { setQrFile(null); setQrPreviewUrl(null); }} 
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingQr || !qrFile}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-md ${
                    uploadingQr || !qrFile 
                      ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15'
                  }`}
                >
                  {uploadingQr ? 'Uploading QR Code...' : 'Update QR Image'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Pane: DB management & Security Info */}
        <div className="space-y-6">
          
          {/* Database Backup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database size={16} className="text-blue-600" />
              <h4 className="font-bold text-sm text-slate-800">Database Storage</h4>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              If running in SQLite fallback mode, all customer records and loan logs are stored in a local SQLite file in `/backend/data/finance.db`.
            </p>

            <div className="space-y-2">
              <a
                href="/api/health"
                className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <span>Check API Health</span>
              </a>
            </div>
          </div>

          {/* Security Compliance */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <h4 className="font-bold text-sm text-white">Security Guards</h4>
            </div>
            
            <ul className="text-[10px] text-slate-400 space-y-2 list-disc pl-4 font-semibold uppercase tracking-wider">
              <li>JWT session encryption enabled</li>
              <li>Bcrypt 10 salt password encryption</li>
              <li>Strict Role-Based Admin routes guard</li>
              <li>Aadhaar storage folder locked</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
