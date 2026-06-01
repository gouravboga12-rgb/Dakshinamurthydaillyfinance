import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

interface Loan {
  id: string;
  approved_amount: number;
  daily_installment: number;
  remaining_balance: number;
  status: string;
  created_at: string;
}

interface Installment {
  id: string;
  loan_id: string;
  due_date: string;
  status: 'Paid' | 'Unpaid';
  payment_date: string | null;
}

export default function PaymentHistoryScreen({ navigation }: any) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await api.get('/customer/loans');
        setLoans(response.data);
        if (response.data.length > 0) {
          loadInstallments(response.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const loadInstallments = async (loan: Loan) => {
    setSelectedLoan(loan);
    try {
      const response = await api.get(`/customer/loans/${loan.id}`);
      setInstallments(response.data.installments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHowToRepay = () => {
    Alert.alert(
      'How to Repay?',
      `repayment instructions:\n\n` +
      `1. Hand over cash directly to our collection agent during daily field visits.\n` +
      `2. Daily cutoff time is 5:00 PM.\n` +
      `3. Always check the active status dot on your dashboard immediately after payment is collected.\n` +
      `4. For digital support or questions, click the WhatsApp button on the bottom right of the screen.`,
      [{ text: 'Got it' }]
    );
  };

  const handleLenderDetails = () => {
    Alert.alert(
      'Lender Details',
      `Office Name: Dakshinamurthy Finance\n` +
      `Registration: Reg No. 1290/DF/HYD\n` +
      `Address: Main Street, Corporate Plaza, Hyderabad - 500001\n` +
      `Timings: Mon - Sat, 9:00 AM - 6:00 PM\n` +
      `Email: support@dailyfinance.com`,
      [{ text: 'Close' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loans.length === 0 || !selectedLoan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>No Active Loans</Text>
        <Text style={styles.emptySubtitle}>
          Installment details will appear here as soon as an administrator sets up an active loan.
        </Text>
      </View>
    );
  }

  const nextDue = installments.find(i => i.status === 'Unpaid')?.due_date || '—';

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Black Banner Section matching image copy 4.png */}
      <View style={styles.blackBanner}>
        {/* Loan Balance Info Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardHeader}>
            <View style={styles.walletIconCircle}>
              <Text style={styles.walletIcon}>💳</Text>
            </View>
            <View>
              <Text style={styles.amountLabel}>Outstanding Balance</Text>
              <Text style={styles.loanAmount}>
                ₹{selectedLoan.remaining_balance.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.loanIdText}>
                ID: KB{selectedLoan.id.slice(0, 10).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.dateLabelRow}>
            <Text style={styles.dueOnLabel}>Due on</Text>
            <Text style={styles.dueDateValue}>{nextDue}</Text>
          </View>
        </View>

        {/* Horizontal Navigation Boxes */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBox}
            onPress={() => navigation.navigate('PaymentHistoryDetail')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionLabel}>Payment history</Text>
            <Text style={styles.arrowText}>❯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBox}
            onPress={handleHowToRepay}
            activeOpacity={0.8}
          >
            <Text style={styles.actionLabel}>How to Repay?</Text>
            <Text style={styles.arrowText}>❯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBox}
            onPress={handleLenderDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.actionLabel}>Lender details</Text>
            <Text style={styles.arrowText}>❯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Installments List */}
      <View style={styles.listContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Repayment Ledger</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PaymentHistoryDetail')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllLink}>View All ›</Text>
          </TouchableOpacity>
        </View>
        {installments.map((inst, idx) => {
          const isOverdue =
            inst.status === 'Unpaid' &&
            inst.due_date < new Date().toISOString().split('T')[0];
          const isPaid = inst.status === 'Paid';
          return (
            <View key={inst.id} style={styles.installmentCard}>
              <View style={styles.rowLeft}>
                <View style={[
                  styles.calcIconBox,
                  isPaid && styles.calcIconBoxPaid,
                  isOverdue && styles.calcIconBoxOverdue,
                ]}>
                  <Text style={styles.calcEmoji}>
                    {isPaid ? '✓' : isOverdue ? '⚠' : '⏳'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.installAmount}>
                    ₹{selectedLoan.daily_installment.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.installDate}>
                    Day {idx + 1} — {inst.due_date}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text
                  style={[
                    styles.statusText,
                    isPaid && styles.statusPaid,
                    isOverdue && styles.statusOverdue,
                    !isPaid && !isOverdue && styles.statusPending,
                  ]}
                >
                  {isPaid ? 'PAID' : isOverdue ? 'LATE' : 'PENDING'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Full Payment History CTA */}
        <TouchableOpacity
          style={styles.historyCtaButton}
          onPress={() => navigation.navigate('PaymentHistoryDetail')}
          activeOpacity={0.85}
        >
          <Text style={styles.historyCtaEmoji}>📋</Text>
          <Text style={styles.historyCtaText}>View Full Payment History</Text>
          <Text style={styles.historyCtaArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },

  blackBanner: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: { fontSize: 20 },
  amountLabel: { color: COLORS.body, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  loanAmount: { color: COLORS.heading, fontSize: 28, fontWeight: '900', marginTop: 2 },
  loanIdText: { color: COLORS.placeholder, fontSize: 11, fontFamily: 'monospace', marginTop: 2, fontWeight: '700' },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  dueOnLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  dueDateValue: { color: COLORS.heading, fontSize: 13, fontWeight: '800' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.08)',
  },
  actionLabel: { color: COLORS.heading, fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  arrowText: { color: COLORS.secondary, fontSize: 11, fontWeight: '900' },

  listContainer: { paddingHorizontal: 24, paddingTop: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: { color: COLORS.heading, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  viewAllLink: { color: COLORS.secondary, fontSize: 13, fontWeight: '800' },
  installmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  calcIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcIconBoxPaid: {
    backgroundColor: '#D1FAE5',
  },
  calcIconBoxOverdue: {
    backgroundColor: '#FEE2E2',
  },
  calcEmoji: { fontSize: 16 },
  installAmount: { color: COLORS.primary, fontSize: 15, fontWeight: '900' },
  installDate: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  rowRight: {},
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPaid: { color: '#10B981', backgroundColor: '#DCFCE7' },
  statusPending: { color: '#6B7280', backgroundColor: '#F3F4F6' },
  statusOverdue: { color: '#EF4444', backgroundColor: '#FEF2F2' },

  historyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  historyCtaEmoji: { fontSize: 18 },
  historyCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', flex: 1, textAlign: 'center' },
  historyCtaArrow: { color: COLORS.secondary, fontSize: 20, fontWeight: '900' },
});
