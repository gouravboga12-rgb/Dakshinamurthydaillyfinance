import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
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
}

interface Installment {
  id: string;
  due_date: string;
  status: 'Paid' | 'Unpaid';
  payment_date: string | null;
}

export default function LoanDetailsScreen({ route }: any) {
  const { loanId } = route.params;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

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

  const paidCount = installments.filter(i => i.status === 'Paid').length;
  const progress = Math.round((paidCount / installments.length) * 100);

  const detailRows = [
    { label: 'Loan Amount Approved', value: `₹${loan.approved_amount.toLocaleString('en-IN')}`, highlight: false },
    { label: 'Platform Setup Charges', value: `₹${loan.platform_charges.toLocaleString('en-IN')}`, highlight: false },
    { label: 'Net Disbursed Amount', value: `₹${loan.amount_disbursed.toLocaleString('en-IN')}`, highlight: true, isDisbursed: true },
    { label: 'Total Repayment Basis', value: `₹${loan.total_repayment.toLocaleString('en-IN')}`, highlight: false },
    { label: 'Daily Installment Amount', value: `₹${loan.daily_installment.toLocaleString('en-IN')}`, highlight: false },
    { label: 'Loan Term Duration', value: `${loan.duration_days} Days`, highlight: false },
    { label: 'Outstanding Balance', value: `₹${loan.remaining_balance.toLocaleString('en-IN')}`, highlight: true, isBalance: true },
    { label: 'Disbursal Approval Date', value: loan.approval_date ? new Date(loan.approval_date).toLocaleDateString('en-IN') : 'Pending', highlight: false },
    { label: 'Expected Completion Date', value: loan.completion_date ? new Date(loan.completion_date).toLocaleDateString('en-IN') : 'Ongoing', highlight: false },
  ];

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Premium Dark Hero Header */}
      <View style={styles.hero}>
        <View style={styles.cardGlowOverlay} />
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>Loan Reference ID</Text>
          <Text style={styles.heroId}>{loan.id}</Text>
        </View>
        <Text style={styles.heroAmount}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
        <View style={[
          styles.statusBadge,
          loan.status === 'Active' ? styles.badgeActive :
            loan.status === 'Completed' ? styles.badgeCompleted : styles.badgePending
        ]}>
          <Text style={styles.statusBadgeText}>{loan.status}</Text>
        </View>

        {/* Repayment Progress Slider */}
        {loan.status === 'Active' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Completion progress</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressSub}>{paidCount} of {installments.length} daily entries cleared</Text>
          </View>
        )}
      </View>

      {/* Loan Details Breakdown Card */}
      <View style={[COMMON_STYLES.card, { marginHorizontal: 24, padding: 22, marginTop: -16 }]}>
        <Text style={styles.sectionTitle}>Loan Breakdown</Text>
        {detailRows.map((row, idx) => (
          <View key={idx} style={[styles.detailRow, idx < detailRows.length - 1 && styles.detailRowBorder]}>
            <Text style={styles.detailLabel}>{row.label}</Text>
            <Text style={[
              styles.detailValue,
              row.highlight && styles.detailValueHighlight,
              row.isDisbursed && { color: '#10B981' },
              row.isBalance && { color: '#EF4444' },
            ]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Installments Ledger Card */}
      <View style={[COMMON_STYLES.card, { marginHorizontal: 24, padding: 22 }]}>
        <Text style={styles.sectionTitle}>Recent Cleared Installments</Text>
        {installments.slice(0, 10).map((inst, idx) => {
          const isOverdue = inst.status === 'Unpaid' && inst.due_date < new Date().toISOString().split('T')[0];
          return (
            <View key={inst.id} style={[styles.instRow, idx < 9 && styles.instRowBorder]}>
              <View style={styles.instLeft}>
                <View style={[
                  styles.dayBadgeCircle,
                  inst.status === 'Paid' ? styles.dayPaid : isOverdue ? styles.dayOverdue : styles.dayUnpaid
                ]}>
                  <Text style={[
                    styles.dayText,
                    inst.status === 'Paid' && { color: '#10B981' },
                    isOverdue && { color: '#EF4444' }
                  ]}>
                    {idx + 1}
                  </Text>
                </View>
                <View>
                  <Text style={styles.instDate}>Day {idx + 1} — {inst.due_date}</Text>
                  {inst.payment_date && (
                    <Text style={styles.instPayDate}>Collected: {new Date(inst.payment_date).toLocaleDateString('en-IN')}</Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.instBadge,
                inst.status === 'Paid' ? styles.instBadgePaid :
                  isOverdue ? styles.instBadgeOverdue : styles.instBadgeUnpaid
              ]}>
                <Text style={[
                  styles.instBadgeText,
                  inst.status === 'Paid' && { color: '#10B981' },
                  isOverdue && { color: '#EF4444' },
                  inst.status === 'Unpaid' && !isOverdue && { color: '#6B7280' },
                ]}>
                  {inst.status === 'Paid' ? 'PAID' : isOverdue ? 'LATE' : 'PENDING'}
                </Text>
              </View>
            </View>
          );
        })}
        {installments.length > 10 && (
          <Text style={styles.moreText}>+{installments.length - 10} more installments. See Repayment Log tab.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  hero: {
    backgroundColor: '#0F172A',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  cardGlowOverlay: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: { marginBottom: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroId: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, fontWeight: '600' },
  heroAmount: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginBottom: 24 },
  badgeActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeCompleted: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressPercent: { color: '#10B981', fontSize: 13, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 99 },
  progressSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  detailLabel: { color: COLORS.body, fontSize: 13, fontWeight: '600' },
  detailValue: { color: COLORS.heading, fontWeight: '800', fontSize: 14, textAlign: 'right' },
  detailValueHighlight: { color: COLORS.primary, fontSize: 15, fontWeight: '900' },

  instRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  instRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  instLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPaid: { backgroundColor: '#DCFCE7' },
  dayUnpaid: { backgroundColor: '#F1F5F9' },
  dayOverdue: { backgroundColor: '#FEF2F2' },
  dayText: { fontSize: 12, fontWeight: '800', color: COLORS.heading },
  instDate: { color: COLORS.heading, fontSize: 13, fontWeight: '700' },
  instPayDate: { color: '#10B981', fontSize: 11, marginTop: 4, fontWeight: '700' },
  instBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  instBadgePaid: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  instBadgeUnpaid: { backgroundColor: '#F1F5F9' },
  instBadgeOverdue: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  instBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  moreText: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontWeight: '500' },
});
