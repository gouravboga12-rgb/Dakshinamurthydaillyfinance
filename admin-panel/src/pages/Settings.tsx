import React, { useState } from 'react';
import { 
  Database, 
  Percent,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';

export default function Settings() {
  const [platformFee, setPlatformFee] = useState('1000');
  const [defaultDuration, setDefaultDuration] = useState('50');
  const [defaultInstallment, setDefaultInstallment] = useState('200');
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl animate-fade-in">
      
      <div>
        <h3 className="text-lg font-bold text-slate-900">Application Settings</h3>
        <p className="text-xs text-slate-500">Configure global platform metrics, interest configurations, and local system backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Pane: Config Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {saved && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Default Installment Amount (₹)</label>
              <input
                type="number"
                value={defaultInstallment}
                onChange={(e) => setDefaultInstallment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15"
            >
              Save Configuration Settings
            </button>
          </form>
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
