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
  status: 'Paid' | 'Unpaid' | 'Pending';
  payment_date: string | null;
}

export default function PaymentHistoryScreen({ navigation }: any) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'closed'>('ongoing');

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await api.get('/customer/loans');
        setLoans(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  useEffect(() => {
    const ongoingLoans = loans.filter(l => l.status === 'Active' || l.status === 'Pending');
    const closedLoans = loans.filter(l => l.status === 'Completed' || l.status === 'Rejected');
    const currentTabLoans = activeTab === 'ongoing' ? ongoingLoans : closedLoans;

    if (currentTabLoans.length > 0) {
      // Pre-select the first loan in the list if selected one is not in the list
      if (!selectedLoan || !currentTabLoans.some(l => l.id === selectedLoan.id)) {
        loadInstallments(currentTabLoans[0]);
      }
    } else {
      setSelectedLoan(null);
      setInstallments([]);
    }
  }, [activeTab, loans]);

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
    navigation.navigate('HowToRepay');
  };

  const handleLenderDetails = () => {
    navigation.navigate('Support');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>No Loan History</Text>
        <Text style={styles.emptySubtitle}>
          You do not have any ongoing or past loan records.
        </Text>
      </View>
    );
  }

  const ongoingLoans = loans.filter(l => l.status === 'Active' || l.status === 'Pending');
  const closedLoans = loans.filter(l => l.status === 'Completed' || l.status === 'Rejected');
  const currentTabLoans = activeTab === 'ongoing' ? ongoingLoans : closedLoans;
  const nextDue = (installments || []).find(i => i?.status === 'Unpaid')?.due_date || '—';

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Tabs Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('ongoing')}
          style={[styles.tabButton, activeTab === 'ongoing' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.tabTextActive]}>
            Ongoing Loans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('closed')}
          style={[styles.tabButton, activeTab === 'closed' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
            Closed Loans
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Multiple Loan picker scroll */}
      {currentTabLoans.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.loanSelectorScroll}
          contentContainerStyle={styles.loanSelectorContent}
        >
          {currentTabLoans.map((l) => (
            <TouchableOpacity
              key={l.id}
              onPress={() => loadInstallments(l)}
              style={[
                styles.loanSelectorBadge,
                selectedLoan?.id === l.id && styles.loanSelectorBadgeActive
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.loanSelectorText,
                selectedLoan?.id === l.id && styles.loanSelectorTextActive
              ]}>
                KB{l.id.slice(0, 6).toUpperCase()} (₹{l.approved_amount})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!selectedLoan ? (
        <View style={styles.tabEmptyContainer}>
          <Text style={styles.tabEmptyIcon}>📄</Text>
          <Text style={styles.tabEmptyTitle}>
            No {activeTab === 'ongoing' ? 'Ongoing' : 'Closed'} Loans
          </Text>
          <Text style={styles.tabEmptySubtitle}>
            There are no {activeTab === 'ongoing' ? 'active or pending' : 'completed or rejected'} loans in this section.
          </Text>
        </View>
      ) : (
        <>
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
                    ₹{Number(selectedLoan?.remaining_balance || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.loanIdText}>
                    Ref No: DMF-{(selectedLoan?.id || '').split('-')[0].toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.dateLabelRow}>
                <Text style={styles.dueOnLabel}>Due on</Text>
                <Text style={styles.dueDateValue}>{nextDue}</Text>
              </View>
            </View>

            {/* Loan Details quick link */}
            <TouchableOpacity
              style={styles.loanDetailsLink}
              onPress={() => navigation.navigate('LoanDetails', { loanId: selectedLoan.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.loanDetailsLinkIcon}>📋</Text>
              <Text style={styles.loanDetailsLinkText}>View Loan Details</Text>
              <Text style={styles.loanDetailsLinkArrow}>❯</Text>
            </TouchableOpacity>

            {/* Horizontal/Grid Navigation Boxes */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBox, { width: '48%' }]}
                onPress={() => navigation.navigate('PaymentHistoryDetail', { loanId: selectedLoan.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.actionLabel}>Payment history</Text>
                <Text style={styles.arrowText}>❯</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBox, { width: '48%' }]}
                onPress={handleHowToRepay}
                activeOpacity={0.8}
              >
                <Text style={styles.actionLabel}>How to Repay?</Text>
                <Text style={styles.arrowText}>❯</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBox,
                  { width: selectedLoan.status === 'Active' ? '48%' : '100%' }
                ]}
                onPress={handleLenderDetails}
                activeOpacity={0.8}
              >
                <Text style={styles.actionLabel}>Lender details</Text>
                <Text style={styles.arrowText}>❯</Text>
              </TouchableOpacity>

              {selectedLoan.status === 'Active' && (
                <TouchableOpacity
                  style={[styles.actionBox, styles.forecloseActionBox, { width: '48%' }]}
                  onPress={() => navigation.navigate('Payment', {
                    installmentId: null,
                    amount: selectedLoan.remaining_balance,
                    isForeclosure: true,
                    loanId: selectedLoan.id,
                  })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionLabel, styles.forecloseActionLabel]}>Foreclose Loan</Text>
                  <Text style={styles.arrowText}>❯</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Daily Installments List */}
          <View style={styles.listContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Repayment Ledger</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PaymentHistoryDetail', { loanId: selectedLoan.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllLink}>View All ›</Text>
              </TouchableOpacity>
            </View>
            {(installments || []).map((inst, idx) => {
              const isPaid = inst?.status === 'Paid';
              const payDateOnly = inst?.payment_date ? inst.payment_date.substring(0, 10) : '';
              const isPaidLate = !!(isPaid && payDateOnly && payDateOnly > inst.due_date);
              const isOverdue =
                inst?.status === 'Unpaid' &&
                inst?.due_date < new Date().toISOString().split('T')[0];
              const isPending = inst?.status === 'Pending';
              
              let delayDays = 0;
              if (isPaidLate) {
                const dueTime = new Date(inst.due_date).getTime();
                const payTime = new Date(payDateOnly).getTime();
                delayDays = Math.max(1, Math.ceil((payTime - dueTime) / (1000 * 60 * 60 * 24)));
              }

              return (
                <View key={inst?.id || idx} style={styles.installmentCard}>
                  <View style={styles.rowLeft}>
                    <View style={[
                      styles.calcIconBox,
                      isPaidLate && styles.calcIconBoxPaidLate,
                      !isPaidLate && isPaid && styles.calcIconBoxPaid,
                      isOverdue && styles.calcIconBoxOverdue,
                    ]}>
                      <Text style={styles.calcEmoji}>
                        {isPaid ? '✓' : isOverdue ? '⚠' : '⏳'}
                      </Text>
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.installAmount}>
                        ₹{Number(selectedLoan?.daily_installment || 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.installDate}>
                        Day {idx + 1} — Due: {inst?.due_date || '—'}
                      </Text>
                      {isPaid && inst?.payment_date && (
                        <Text style={[styles.installSubDate, isPaidLate && { color: '#D97706' }]}>
                          Paid: {payDateOnly} {isPaidLate ? `(${delayDays}d late)` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text
                      style={[
                        styles.statusText,
                        isPaidLate && styles.statusPaidLate,
                        !isPaidLate && isPaid && styles.statusPaid,
                        isOverdue && styles.statusOverdue,
                        isPending && styles.statusPending,
                        !isPaid && !isOverdue && !isPending && styles.statusUpcoming,
                      ]}
                    >
                      {isPaidLate ? 'PAID LATE' : isPaid ? 'PAID' : isOverdue ? 'FAILED' : 'PENDING'}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Full Payment History CTA */}
            <TouchableOpacity
              style={styles.historyCtaButton}
              onPress={() => navigation.navigate('PaymentHistoryDetail', { loanId: selectedLoan.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.historyCtaEmoji}>📋</Text>
              <Text style={styles.historyCtaText}>View Full Payment History</Text>
              <Text style={styles.historyCtaArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBox: {
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
  forecloseActionBox: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  forecloseActionLabel: {
    color: '#EF4444',
  },

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
  calcIconBoxPaidLate: {
    backgroundColor: '#FEF3C7',
  },
  calcIconBoxOverdue: {
    backgroundColor: '#FEE2E2',
  },
  calcEmoji: { fontSize: 16 },
  installAmount: { color: COLORS.primary, fontSize: 15, fontWeight: '900' },
  installDate: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  installSubDate: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  rowRight: {},
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPaid: { color: '#10B981', backgroundColor: '#DCFCE7' },
  statusPaidLate: { color: '#D97706', backgroundColor: '#FEF3C7' },
  statusPending: { color: '#6B7280', backgroundColor: '#F3F4F6' },
  statusOverdue: { color: '#EF4444', backgroundColor: '#FEF2F2' },
  statusUpcoming: { color: '#9CA3AF', backgroundColor: '#F9FAFB' },

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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  loanSelectorScroll: {
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  loanSelectorContent: {
    gap: 8,
    paddingRight: 40,
  },
  loanSelectorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loanSelectorBadgeActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  loanSelectorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  loanSelectorTextActive: {
    color: '#2563EB',
  },
  tabEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  tabEmptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  tabEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  tabEmptySubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  loanDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC800',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  loanDetailsLinkIcon: {
    fontSize: 16,
  },
  loanDetailsLinkText: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  loanDetailsLinkArrow: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
});
