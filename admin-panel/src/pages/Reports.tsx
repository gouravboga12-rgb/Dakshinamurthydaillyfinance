import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Loader2,
  AlertCircle,
  ClipboardList,
  TrendingDown,
  Clock,
  Coins,
  Users,
  Eye,
  X
} from 'lucide-react';

interface ReportsProps {
  token: string;
}

export default function Reports({ token }: ReportsProps) {
  const [reportType, setReportType] = useState('daily_collection');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

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
              <option value="portfolio_outstanding">Portfolio Risk & Outstanding Balance</option>
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

          {/* Portfolio Risk & Outstanding Balance Report */}
          {reportType === 'portfolio_outstanding' && reportData.metrics && (
            <div className="space-y-8">
              {/* Summary cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-rose-50/60 border border-rose-100 p-5 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Losses (Overdue)</span>
                    <TrendingDown size={18} />
                  </div>
                  <div className="text-2xl font-extrabold text-rose-700">
                    ₹{reportData.metrics.totalLosses || 0}
                  </div>
                  <p className="text-[10px] text-rose-500 font-medium">Missed/unpaid past due payments</p>
                </div>

                <div className="bg-amber-50/60 border border-amber-100 p-5 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex justify-between items-center text-amber-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Verification</span>
                    <Clock size={18} />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-700">
                    ₹{reportData.metrics.totalPending || 0}
                  </div>
                  <p className="text-[10px] text-amber-500 font-medium">Pending admin verification</p>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Outstanding Debt</span>
                    <Coins size={18} />
                  </div>
                  <div className="text-2xl font-extrabold text-blue-700">
                    ₹{reportData.metrics.totalOutstanding || 0}
                  </div>
                  <p className="text-[10px] text-blue-500 font-medium">Active principal outstanding</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-1 shadow-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active/Total Members</span>
                    <Users size={18} />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {reportData.metrics.activeMembers || 0} / {reportData.metrics.totalMembers || 0}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Unique borrower counts</p>
                </div>
              </div>

              {/* Detailed tables inside sub-sections */}
              <div className="space-y-8">
                
                {/* 1. Borrowers Ledgers */}
                <div className="bg-slate-50/30 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Users size={14} className="text-slate-500" />
                      Detailed Borrowers Ledger ({reportData.membersDetails?.length || 0} Members)
                    </h4>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3">Borrower Name</th>
                          <th className="py-3 px-3">Mobile</th>
                          <th className="py-3 px-3 text-center">Active Loans</th>
                          <th className="py-3 px-3 text-right">Approved Amt</th>
                          <th className="py-3 px-3 text-right">Paid Amt</th>
                          <th className="py-3 px-3 text-right">Outstanding Bal</th>
                          <th className="py-3 px-3 text-right text-rose-600">Overdue (Losses)</th>
                          <th className="py-3 px-3 text-right text-amber-600">Pending (Awaiting)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {reportData.membersDetails?.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-slate-400">No member details available.</td>
                          </tr>
                        ) : (
                          (reportData.membersDetails || []).map((m: any) => (
                            <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">{m.name}</td>
                              <td className="py-3 px-3 text-slate-500">{m.mobile}</td>
                              <td className="py-3 px-3 text-center font-bold">{m.activeLoans}</td>
                              <td className="py-3 px-3 text-right font-medium">₹{m.totalApproved}</td>
                              <td className="py-3 px-3 text-right text-emerald-600 font-semibold">₹{m.totalPaid}</td>
                              <td className="py-3 px-3 text-right text-blue-600 font-bold">₹{m.remainingBalance}</td>
                              <td className="py-3 px-3 text-right text-rose-600 font-bold">₹{m.overdueAmount} <span className="text-[10px] text-rose-400">({m.overdueCount})</span></td>
                              <td className="py-3 px-3 text-right text-amber-600 font-bold">₹{m.pendingAmount} <span className="text-[10px] text-amber-400">({m.pendingCount})</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Overdue Payments (Losses) */}
                <div className="bg-rose-50/20 border border-rose-100/60 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-rose-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <TrendingDown size={14} />
                    Missed & Overdue Payments / Losses Details ({reportData.losses?.length || 0} Records)
                  </h4>
                  <div className="overflow-x-auto bg-white rounded-xl border border-rose-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-rose-100 bg-rose-50/30 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                          <th className="py-3 px-3">Customer Profile</th>
                          <th className="py-3 px-3">Loan Reference</th>
                          <th className="py-3 px-3">Due Date</th>
                          <th className="py-3 px-3 text-center">Days Overdue</th>
                          <th className="py-3 px-3 text-right">Amount Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50 text-xs text-slate-700">
                        {reportData.losses?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">Great! No active overdue/missed payments recorded.</td>
                          </tr>
                        ) : (
                          (reportData.losses || []).map((item: any) => (
                            <tr key={item.id} className="hover:bg-rose-50/10 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                <div>{item.customerName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{item.mobile}</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px] text-blue-600">{item.loanId.slice(0, 8)}...</td>
                              <td className="py-3 px-3 font-medium text-slate-600">{item.dueDate}</td>
                              <td className="py-3 px-3 text-center">
                                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  {item.daysOverdue} days late
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-extrabold text-rose-600">₹{item.amount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Awaiting Verification (Pending) */}
                <div className="bg-amber-50/20 border border-amber-100/60 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} />
                    Awaiting Verification Payments ({reportData.pendingPayments?.length || 0} Records)
                  </h4>
                  <div className="overflow-x-auto bg-white rounded-xl border border-amber-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-amber-100 bg-amber-50/30 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          <th className="py-3 px-3">Customer Profile</th>
                          <th className="py-3 px-3">Loan Reference</th>
                          <th className="py-3 px-3">Submitted Timestamp</th>
                          <th className="py-3 px-3">Transaction ID</th>
                          <th className="py-3 px-3 text-right">Amount</th>
                          <th className="py-3 px-3 text-center">Receipt Proof</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50 text-xs text-slate-700">
                        {reportData.pendingPayments?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">All pending payments have been cleared.</td>
                          </tr>
                        ) : (
                          (reportData.pendingPayments || []).map((item: any) => (
                            <tr key={item.id} className="hover:bg-amber-50/10 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                <div>{item.customerName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{item.mobile}</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px] text-blue-600">{item.loanId.slice(0, 8)}...</td>
                              <td className="py-3 px-3 text-slate-500">
                                {item.paymentDate ? new Date(item.paymentDate).toLocaleString('en-IN') : 'N/A'}
                              </td>
                              <td className="py-3 px-3 font-mono font-medium text-slate-600">{item.transactionId || 'Cash Collection'}</td>
                              <td className="py-3 px-3 text-right font-extrabold text-amber-600">₹{item.amount}</td>
                              <td className="py-3 px-3 text-center">
                                {item.proofUrl ? (
                                  <button
                                    onClick={() => {
                                      const rawUrl = item.proofUrl;
                                      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `http://localhost:8081${rawUrl}`;
                                      setProofModalUrl(fullUrl);
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    <span>View Receipt</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No receipt</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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
