import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import api from '../utils/api';
import COLORS from '../utils/theme';

interface Installment {
  id: string;
  loan_id: string;
  due_date: string;
  status: string;
  payment_date: string | null;
  // Simulated fields
  amount?: number;
  method?: string;
  isFailed?: boolean;
}

interface Loan {
  id: string;
  daily_installment: number;
  approved_amount: number;
  status: string;
}

export default function PaymentHistoryDetailScreen({ route, navigation }: any) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const loanId = route?.params?.loanId;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/customer/loans');
        if (response.data.length > 0) {
          const targetLoan = loanId 
            ? response.data.find((l: any) => l.id === loanId) 
            : response.data.find((l: any) => l.status === 'Active' || l.status === 'Pending') || response.data[0];

          if (targetLoan) {
            setLoan(targetLoan);
            const detailResponse = await api.get(`/customer/loans/${targetLoan.id}`);
            const allInstallments: Installment[] = detailResponse.data.installments;

            // Enrich with display data: amount, method, and simulate one "failed" entry
            const enriched = allInstallments.map((inst, idx) => ({
              ...inst,
              amount: targetLoan.daily_installment,
              method: 'UPI',
              // Simulate a failed entry at index 5 for demo purposes
              isFailed: inst.status === 'Paid' && idx === 5,
            }));

            // Show paid + 1 failed simulation, reverse so newest first
            const displayable = enriched
              .filter(i => i.status === 'Paid')
              .reverse();

            setInstallments(displayable);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [loanId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment history</Text>
        <View style={{ width: 40 }} />
      </View>

      {installments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>No Payments Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your paid installments will appear here once recorded by the collection agent.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary pill */}
          <View style={styles.summaryPill}>
            <Text style={styles.summaryText}>
              {installments.length} payment{installments.length !== 1 ? 's' : ''} recorded
            </Text>
          </View>

          {/* Timeline List */}
          <View style={styles.timelineContainer}>
            {installments.map((inst, idx) => {
              const isFailed = inst.isFailed || false;
              const isLast = idx === installments.length - 1;
              const dateToShow = inst.payment_date
                ? formatDate(inst.payment_date)
                : formatDate(inst.due_date);

              return (
                <View key={inst.id} style={styles.timelineRow}>
                  {/* Left: vertical line + icon */}
                  <View style={styles.timelineLeft}>
                    {/* Connector line above icon (except first) */}
                    {idx !== 0 && <View style={styles.lineAbove} />}

                    {/* Status icon */}
                    <View style={[
                      styles.iconCircle,
                      isFailed ? styles.iconCircleFailed : styles.iconCircleSuccess
                    ]}>
                      {isFailed ? (
                        <Text style={styles.iconTextFailed}>⚠</Text>
                      ) : (
                        <Text style={styles.iconTextSuccess}>✓</Text>
                      )}
                    </View>

                    {/* Connector line below icon (except last) */}
                    {!isLast && <View style={styles.lineBelow} />}
                  </View>

                  {/* Right: card */}
                  <View style={[
                    styles.paymentCard,
                    isFailed && styles.paymentCardFailed,
                  ]}>
                    {/* Top row: amount + badge + date */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardLeft}>
                        <Text style={[
                          styles.amountText,
                          isFailed && styles.amountTextFailed
                        ]}>
                          ₹{inst.amount?.toLocaleString('en-IN') || '—'}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          isFailed ? styles.badgeFailed : styles.badgeSuccess
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            isFailed ? styles.badgeTextFailed : styles.badgeTextSuccess
                          ]}>
                            {isFailed ? 'Failed' : 'Success'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardRight}>
                        <Text style={styles.dateText}>{dateToShow}</Text>
                        <Text style={styles.methodText}>{inst.method || 'Cash'}</Text>
                      </View>
                    </View>

                    {/* Failed message */}
                    {isFailed && (
                      <View style={styles.failedMsgBox}>
                        <Text style={styles.failedMsgText}>
                          We have not received the amount. If the amount has been debited from your bank, please check with your bank
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loaderText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#CA8A04',
    fontWeight: '800',
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },

  /* Scroll */
  scrollContent: {
    paddingBottom: 48,
    paddingTop: 8,
  },

  summaryPill: {
    alignSelf: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    marginVertical: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  /* Timeline */
  timelineContainer: {
    paddingHorizontal: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  /* Timeline Left column */
  timelineLeft: {
    width: 60,
    alignItems: 'center',
  },
  lineAbove: {
    width: 2,
    flex: 0,
    height: 16,
    backgroundColor: '#D1D5DB',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleSuccess: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  iconCircleFailed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  iconTextSuccess: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '900',
  },
  iconTextFailed: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '900',
  },
  lineBelow: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: '#D1D5DB',
  },

  /* Payment Card */
  paymentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 16,
    marginBottom: 12,
    marginTop: 4,
    padding: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentCardFailed: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  amountTextFailed: {
    color: '#374151',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextSuccess: {
    color: '#10B981',
  },
  badgeTextFailed: {
    color: '#EF4444',
  },

  cardRight: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* Failed message */
  failedMsgBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  failedMsgText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
