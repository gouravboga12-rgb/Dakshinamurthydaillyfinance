import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

interface Loan {
  id: string;
  approved_amount: number;
  platform_charges: number;
  amount_disbursed: number;
  daily_installment: number;
  duration_days: number;
  total_repayment: number;
  remaining_balance: number;
  status: string;
  approval_date: string | null;
  completion_date: string | null;
  interest_rate?: number;
}

interface Installment {
  id: string;
  due_date: string;
  status: 'Paid' | 'Unpaid';
  payment_date: string | null;
}

export default function LoanDetailsScreen({ route, navigation }: any) {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [foreclosureModalVisible, setForeclosureModalVisible] = useState(false);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        const response = await api.get(`/customer/loans/${loanId}`);
        setLoan(response.data.loan);
        setInstallments(response.data.installments);
      } catch (err) {
        console.error('Loan details error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoanDetails();
  }, [loanId]);

  if (loading || !loan) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  // Ordinal suffix generator for installment scheduling
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Indian Date formatter (e.g. 26 Nov 2025)
  const formatDueDate = (dateStr: string) => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [year, month, day] = dateStr.split('-');
      return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Interest rate: read directly from database or fall back to calculation
  const interestRate = loan.interest_rate !== undefined && loan.interest_rate !== null
    ? loan.interest_rate
    : (loan.approved_amount > 0 
      ? ((loan.total_repayment + loan.platform_charges - loan.approved_amount) / loan.approved_amount) * 100 
      : 0);

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* View Fee Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={feeModalVisible}
        onRequestClose={() => setFeeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fee Details Breakdown</Text>
            
            <View style={styles.modalBreakdown}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Approved Loan Amount</Text>
                <Text style={styles.modalValue}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Downpayment & Platform Charges</Text>
                <Text style={[styles.modalValue, { color: '#EF4444' }]}>- ₹{loan.platform_charges.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.modalRow, styles.modalRowBorder]}>
                <Text style={styles.modalLabelHighlight}>Net Disbursed Amount</Text>
                <Text style={[styles.modalValueHighlight, { color: '#10B981' }]}>₹{loan.amount_disbursed.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Flat Interest Charges</Text>
                <Text style={styles.modalValue}>+ ₹{(loan.total_repayment + loan.platform_charges - loan.approved_amount).toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.modalRow, styles.modalRowBorder]}>
                <Text style={styles.modalLabelHighlight}>Total Repayment Basis</Text>
                <Text style={styles.modalValueHighlight}>₹{loan.total_repayment.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Daily Installment Amount</Text>
                <Text style={styles.modalValue}>₹{loan.daily_installment.toLocaleString('en-IN')} / Day</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Loan Term Duration</Text>
                <Text style={styles.modalValue}>{loan.duration_days} Days</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setFeeModalVisible(false)}>
              <Text style={styles.modalCloseText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Top Ref card */}
      <View style={styles.topCard}>
        <View style={styles.row}>
          <Text style={styles.refLabel}>Loan Ref no.</Text>
          <Text style={styles.refValue}>DMF-{(loan.id || '').split('-')[0].toUpperCase()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.refLabel}>Loan Given Date</Text>
          <Text style={styles.refValue}>{loan.approval_date ? formatDueDate(loan.approval_date.split('T')[0]) : 'Pending'}</Text>
        </View>

        <View style={styles.amountDivider} />

        <View style={styles.row}>
          <Text style={styles.labelApproved}>Approved Amount</Text>
          <Text style={styles.valueApproved}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.labelDisbursed}>Disbursement Amount</Text>
          <Text style={styles.valueDisbursed}>₹{loan.amount_disbursed.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.bankTransferBox}>
          <Text style={styles.bankTransferText}>Transfer to registered bank account</Text>
          <TouchableOpacity onPress={() => setFeeModalVisible(true)}>
            <Text style={styles.viewFeeText}>View Fee Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountDivider} />

        {/* Interest & Tenure */}
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Interest Rate</Text>
            <Text style={styles.rowSubLabel}>Annualised Interest Rate</Text>
          </View>
          <Text style={styles.rowValue}>{interestRate.toFixed(2)}%</Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Tenure*</Text>
            <Text style={styles.rowSubLabel}>Repayment Period</Text>
          </View>
          <Text style={styles.rowValue}>{loan.duration_days} Days</Text>
        </View>

        {/* Status indicator */}
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowSubLabel}>Current Status of Loan</Text>
          </View>
          <View style={[
            styles.statusBadge,
            loan.status === 'Active' ? styles.badgeActive :
              loan.status === 'Completed' ? styles.badgeCompleted : styles.badgePending
          ]}>
            <Text style={styles.statusBadgeText}>{loan.status}</Text>
          </View>
        </View>
      </View>

      {/* Installment Schedule */}
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>Installment Schedule</Text>
        <Text style={styles.scheduleSub}>Expected repayment timeline</Text>
      </View>

      <View style={styles.scheduleCard}>
        {installments.map((inst, idx) => {
          const isOverdue = inst.status === 'Unpaid' && inst.due_date < new Date().toISOString().split('T')[0];
          const isPaidLate = !!(inst.status === 'Paid' && inst.payment_date && inst.payment_date.substring(0, 10) > inst.due_date);
          
          return (
            <View key={inst.id} style={[styles.instRow, idx < installments.length - 1 && styles.instRowBorder]}>
              <View>
                <Text style={styles.instLabel}>{getOrdinal(idx + 1)} Installment</Text>
                <Text style={styles.instDate}>{formatDueDate(inst.due_date)}</Text>
                {inst.payment_date && (
                  <Text style={[
                    styles.instPayDate,
                    isPaidLate ? { color: '#F59E0B' } : null
                  ]}>
                    {isPaidLate ? 'Paid Late on: ' : 'Paid on: '}{formatDueDate(inst.payment_date.split('T')[0])}
                  </Text>
                )}
              </View>
              <View style={styles.instRight}>
                <Text style={styles.instAmount}>₹{loan.daily_installment.toLocaleString('en-IN')}</Text>
                <View style={[
                  styles.badgeSmall,
                  inst.status === 'Paid' 
                    ? (isPaidLate ? styles.badgePaidLate : styles.badgePaid) 
                    : (isOverdue ? styles.badgeOverdue : styles.badgeUnpaid)
                ]}>
                  <Text style={[
                    styles.badgeTextSmall,
                    inst.status === 'Paid' 
                      ? (isPaidLate ? { color: '#F59E0B' } : { color: '#10B981' }) 
                      : (isOverdue ? { color: '#EF4444' } : { color: '#6B7280' }),
                  ]}>
                    {inst.status === 'Paid' 
                      ? (isPaidLate ? 'PAID LATE' : 'PAID') 
                      : (isOverdue ? 'FAILED TO PAY' : 'PENDING')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom Action Bar — only for Active loans */}
      {loan.status === 'Active' && (
        <View style={styles.bottomBar}>
          {/* Make Payment Button */}
          <TouchableOpacity
            style={styles.makePaymentBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.makePaymentBtnText}>Make Payment</Text>
          </TouchableOpacity>

          {/* Foreclose Loan Link */}
          <TouchableOpacity
            style={styles.forecloseLinkContainer}
            onPress={() => navigation.navigate('Payment', {
              installmentId: null,
              amount: loan.remaining_balance,
              isForeclosure: true,
              loanId: loan.id,
            })}
            activeOpacity={0.7}
          >
            <Text style={styles.forecloseLinkText}>Foreclose Loan</Text>
          </TouchableOpacity>
          <Text style={styles.foreclosureChargesNote}>Pay full outstanding amount in one go</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  refLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  refValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  amountDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  labelApproved: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  valueApproved: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  labelDisbursed: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  valueDisbursed: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '800',
  },
  bankTransferBox: {
    marginTop: 8,
    marginBottom: 12,
  },
  bankTransferText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  viewFeeText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 6,
  },
  rowLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  rowValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  badgeCompleted: { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
  },
  scheduleHeader: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  scheduleSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instRow: {
    paddingVertical: 14,
  },
  instRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  instLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  instDate: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  instPayDate: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  instRight: {
    position: 'absolute',
    right: 0,
    top: 14,
    alignItems: 'flex-end',
  },
  instAmount: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeSmall: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePaid: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  badgeUnpaid: { backgroundColor: '#F3F4F6' },
  badgeOverdue: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  badgePaidLate: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  badgeTextSmall: {
    fontSize: 9,
    fontWeight: '800',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBreakdown: {
    gap: 12,
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
    marginVertical: 4,
  },
  modalLabel: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  modalValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  modalLabelHighlight: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  modalValueHighlight: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  modalCloseButton: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // ─── Bottom Action Bar ────────────────────────────────────────────────────
  bottomBar: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 40,
    alignItems: 'center',
  },
  makePaymentBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  makePaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  forecloseLinkContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  forecloseLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  foreclosureChargesNote: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },

  // ─── Foreclosure Confirmation Modal ─────────────────────────────────────
  foreclosureModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  foreclosureIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  foreclosureIcon: {
    fontSize: 40,
  },
  foreclosureModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  foreclosureModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  foreclosureAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  foreclosureAmountLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  foreclosureAmountValue: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 4,
  },
  foreclosureAmountNote: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  foreclosureWarningBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  foreclosureWarningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  foreclosureActions: {
    flexDirection: 'row',
    gap: 12,
  },
  foreclosureCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foreclosureCancelText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },
  foreclosureConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  foreclosureConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
