import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Phone, AlertCircle, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, adminName: string) => void;
  onBypass: () => void;
}

export default function Login({ onLoginSuccess, onBypass }: LoginProps) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Direct post to backend API proxy /api/auth/login
      const response = await axios.post('/api/auth/login', {
        mobile_number: mobile,
        password: password
      });

      const { token, user } = response.data;
      if (user.role !== 'admin') {
        setError('Access denied. This panel is reserved for Administrators.');
        setLoading(false);
        return;
      }

      onLoginSuccess(token, user.full_name);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Authentication failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setMobile('9999999999');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl translate-x-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl shadow-blue-900/20">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Dakshinamurthy Logo" className="w-16 h-16 object-contain rounded-xl" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Dakshinamurthy Daily Finance
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Admin Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 py-8 px-4 shadow-2xl border border-slate-800/80 rounded-2xl sm:px-10 backdrop-blur-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 flex gap-3 text-rose-300 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mobile Number / Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone size={16} />
                </div>
                <input
                  id="mobile"
                  name="mobile"
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-800 bg-slate-950 text-white rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all sm:text-sm"
                  placeholder="Enter mobile or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-800 bg-slate-950 text-white rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={onBypass}
                className="w-full flex justify-center py-3 px-4 border border-slate-800 rounded-xl shadow-md text-sm font-semibold text-slate-300 bg-slate-950 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-all"
              >
                Quick Bypass (Demo Access)
              </button>
            </div>
          </form>

          {/* Admin Credentials Helper Card */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/50 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Admin Login Credentials</span>
              </div>
              {/* Owner account */}
              <div>
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Owner Account</p>
                <button
                  type="button"
                  onClick={() => { setMobile('Dakshinamurthydialyfinance@gmail.com'); setPassword('Yeshu@2414'); }}
                  className="text-left w-full bg-slate-900 hover:bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center text-xs font-medium text-slate-300 transition-colors"
                >
                  <div>
                    <div>Email: <span className="text-white font-mono">Dakshinamurthydialyfinance@gmail.com</span></div>
                    <div>Pass: <span className="text-white font-mono">Yeshu@2414</span></div>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold hover:underline shrink-0 ml-2">Auto-Fill</span>
                </button>
              </div>
              {/* System admin */}
              <div>
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">System Admin (Mobile Login)</p>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-left w-full bg-slate-900 hover:bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center text-xs font-medium text-slate-300 transition-colors"
                >
                  <div>
                    <div>Mobile: <span className="text-white font-mono">9999999999</span></div>
                    <div>Pass: <span className="text-white font-mono">admin123</span></div>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold hover:underline shrink-0 ml-2">Auto-Fill</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
