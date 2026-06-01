import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Loader2,
  AlertCircle,
  ClipboardList
} from 'lucide-react';

interface ReportsProps {
  token: string;
}

export default function Reports({ token }: ReportsProps) {
  const [reportType, setReportType] = useState('daily_collection');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const response = await axios.get('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: reportType }
      });
      if (response.data && response.data.error) {
        setError(response.data.error);
      } else {
        setReportData(response.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate selected report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in print:p-0">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5 print:hidden">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Reports & Analytics</h3>
          <p className="text-xs text-slate-500">Extract collection data, daily profits, and portfolio summaries.</p>
        </div>
        
        {reportData && (
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Selector Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 items-end justify-between print:hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="daily_collection">Daily Collections Report</option>
              <option value="daily_profit">Daily Platform Profit Report</option>
              <option value="loan_performance">Loan Performance Summary</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date Filter</label>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500">
              <Calendar size={15} />
              <span className="font-medium text-slate-600">{new Date().toISOString().split('T')[0]} (Today)</span>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15 flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <FileSpreadsheet size={16} />
          )}
          <span>Generate Report</span>
        </button>
      </div>

      {/* Report Output Panel */}
      {error && (
        <div className="bg-rose-50 border border-rose-250 text-rose-800 rounded-xl p-4 flex gap-3 text-sm print:hidden">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm font-semibold text-slate-400">Aggregating real-time transactions...</span>
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-md p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 print:border-none print:shadow-none">
          
          {/* Report Header for Print/View */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider">{reportData.reportName}</h1>
              <p className="text-xs text-slate-500 mt-1">Generated by Dakshinamurthy Daily Finance Admin Dashboard</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Date: <span className="font-bold text-slate-700">{reportData.date || new Date().toISOString().split('T')[0]}</span></div>
              <div className="mt-0.5">Time: <span className="font-bold text-slate-700">{new Date().toLocaleTimeString('en-IN')}</span></div>
            </div>
          </div>

          {/* Daily Collection Report Content */}
          {reportType === 'daily_collection' && (
            <div className="space-y-6">
              {/* Summary card widget */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Collected</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    ₹{reportData.data?.reduce((sum: number, item: any) => sum + (item.daily_installment || 0), 0) || 0}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Installments Cleared</span>
                  <span className="text-2xl font-extrabold text-emerald-600">{reportData.data?.length || 0} Paid</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Installment ID</th>
                      <th className="py-3 px-2">Loan Reference</th>
                      <th className="py-3 px-2">Verification Date</th>
                      <th className="py-3 px-2 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {reportData.data?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400">No daily collection repayments recorded today yet.</td>
                      </tr>
                    ) : (
                      (reportData.data || []).map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-3.5 px-2 font-mono text-xs">{item.id.slice(0, 8)}...</td>
                          <td className="py-3.5 px-2 font-mono text-xs text-blue-600">{item.loan_id.slice(0, 8)}...</td>
                          <td className="py-3.5 px-2">{new Date(item.payment_date).toLocaleTimeString('en-IN')}</td>
                          <td className="py-3.5 px-2 text-right font-bold text-emerald-600">₹{item.daily_installment || 200}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Profit Report Content */}
          {reportType === 'daily_profit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Platform Earnings</span>
                  <span className="text-2xl font-extrabold text-emerald-600">₹{reportData.totalProfit || 0}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Disbursals</span>
                  <span className="text-2xl font-extrabold text-slate-900">{reportData.loansDisbursed || 0} Loans</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Disbursed Loan ID</th>
                      <th className="py-3 px-2">Customer Profile</th>
                      <th className="py-3 px-2">Approved Loan Amount</th>
                      <th className="py-3 px-2 text-right">Deducted Platform Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {reportData.details?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400">No loan approvals disbursed today.</td>
                      </tr>
                    ) : (
                      (reportData.details || []).map((item: any) => (
                        <tr key={item.loanId}>
                          <td className="py-3.5 px-2 font-mono text-xs">{item.loanId.slice(0, 8)}...</td>
                          <td className="py-3.5 px-2 font-semibold text-slate-800">{item.customerName}</td>
                          <td className="py-3.5 px-2 font-semibold">₹{item.approvedAmount}</td>
                          <td className="py-3.5 px-2 text-right font-extrabold text-emerald-600">₹{item.platformCharges}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loan Performance Summary */}
          {reportType === 'loan_performance' && reportData.metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Portfolios</span>
                  <span className="text-2xl font-extrabold text-slate-900 block mt-1">{reportData.metrics.activeCount} Loans</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fully Settled</span>
                  <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{reportData.metrics.completedCount} Loans</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Debt</span>
                  <span className="text-2xl font-extrabold text-rose-600 block mt-1">₹{reportData.metrics.totalOutstanding}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Historical Lending Aggregates</h4>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Aggregate Loans Created</span>
                  <span className="font-bold text-slate-900">{reportData.metrics.totalLoansCreated}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Pending Disbursement Requests</span>
                  <span className="font-bold text-amber-600">{reportData.metrics.pendingCount}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400 text-sm flex flex-col justify-center items-center gap-3">
          <ClipboardList size={40} className="text-slate-350" />
          <span>Configure the parameters above and click "Generate Report".</span>
        </div>
      )}

    </div>
  );
}
