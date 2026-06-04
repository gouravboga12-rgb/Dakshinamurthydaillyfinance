import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface DashboardSummary {
  hasActiveLoan: boolean;
  loan: {
    id: string;
    approved_amount: number;
    platform_charges: number;
    amount_disbursed: number;
    daily_installment: number;
    remaining_balance: number;
    status: string;
    approval_date: string | null;
  } | null;
  installmentsCount: number;
  paidInstallmentsCount: number;
  pendingInstallmentsCount?: number;
  remainingInstallmentsCount: number;
  progressPercentage: number;
  paidAmount: number;
  nextDue: string | null;
  nextDueInstallmentId?: string | null;
  dueTodayAmount: number;
  unreadNotificationsCount: number;
}

export default function DashboardScreen({ navigation }: any) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);

  // Apply Modal State
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState('Daily Finance Loan');
  const [requestAmount, setRequestAmount] = useState('10000');
  const [requestDuration, setRequestDuration] = useState('50');
  const [requestLoading, setRequestLoading] = useState(false);
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/customer/dashboard');
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  // Handle Pay Installment Simulation
  const handlePayInstallment = async () => {
    if (!summary?.loan) return;
    setPaying(true);
    try {
      await api.post('/customer/pay');
      if (Platform.OS === 'web') {
        alert(`Repayment Successful! 🎉\n\nSuccessfully paid daily installment of ₹${summary.loan.daily_installment}.\nYour outstanding loan balance has been updated.`);
        fetchDashboard();
      } else {
        Alert.alert(
          'Repayment Successful! 🎉',
          `Successfully paid daily installment of ₹${summary.loan.daily_installment}.\nYour outstanding loan balance has been updated.`,
          [{ text: 'Great', onPress: fetchDashboard }]
        );
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        alert('Payment Error: Failed to complete repayment simulator.');
      } else {
        Alert.alert('Payment Error', 'Failed to complete repayment simulator.');
      }
    } finally {
      setPaying(false);
    }
  };

  // Open Apply Form
  const openApplyModal = (loanType: string = 'Daily Finance Loan') => {
    setSelectedLoanType(loanType);
    setRequestAmount('10000');
    setIsCustomAmount(false);
    setApplyModalVisible(true);
  };

  // Handle Submit Loan Application
  const handleSubmitLoan = async () => {
    const amt = parseFloat(requestAmount);
    const dur = parseInt(requestDuration);
    
    if (isNaN(amt) || amt <= 0) {
      if (Platform.OS === 'web') {
        alert('Invalid Amount: Please enter a valid loan amount.');
      } else {
        Alert.alert('Invalid Amount', 'Please enter a valid loan amount.');
      }
      return;
    }
    if (isNaN(dur) || dur <= 0) {
      if (Platform.OS === 'web') {
        alert('Invalid Duration: Please enter a valid duration in days.');
      } else {
        Alert.alert('Invalid Duration', 'Please enter a valid duration in days.');
      }
      return;
    }

    setRequestLoading(true);
    try {
      await api.post('/customer/request-loan', {
        amount: amt,
        duration_days: dur,
        type: selectedLoanType,
      });

      setApplyModalVisible(false);
      if (Platform.OS === 'web') {
        alert('Application Received\n\nWe received your application. Thank you for applying! We will get back to you soon.');
        fetchDashboard();
      } else {
        Alert.alert(
          'Application Received',
          'We received your application. Thank you for applying! We will get back to you soon.',
          [{ text: 'Great', onPress: fetchDashboard }]
        );
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        alert('Error: Failed to submit loan request.');
      } else {
        Alert.alert('Error', 'Failed to submit loan request.');
      }
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Connecting to platform...</Text>
      </View>
    );
  }

  const loan = summary?.loan;
  const progress = summary?.progressPercentage || 0;
  
  // User name initials for top avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CU';

  return (
    <ScrollView
      style={COMMON_STYLES.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* KreditBee styled Header Bar matching image copy 3.png */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImageHeader as any} 
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTextBrand}>DAKSHINAMURTHY</Text>
            <Text style={styles.logoTextSub}>DAILY FINANCE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerActionBtn}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.reload();
              } else {
                onRefresh();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            {(summary?.unreadNotificationsCount || 0) > 0 && (
              <View style={styles.headerBadge} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* 2. Repayment Due Card (KreditBee Yellow Button style) */}
      {summary?.hasActiveLoan && loan && (
        <View style={styles.repaymentDueCard}>
          <Text style={styles.repaymentHeader}>Repayment Tracker</Text>
          
          {loan.status === 'Pending' ? (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingAmount}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
              <Text style={styles.pendingStatusText}>Proposal Submitted (Pending Admin Review)</Text>
            </View>
          ) : (
            <>
              <View style={styles.balanceInfoContainer}>
                <Text style={styles.balanceLabel}>Current Amount to be Paid</Text>
                <Text style={styles.balanceAmount}>₹{loan.remaining_balance.toLocaleString('en-IN')}</Text>
                <Text style={styles.repaymentDetailText}>
                  {summary.paidInstallmentsCount} of {summary.installmentsCount} installments paid
                </Text>
                {(summary.pendingInstallmentsCount || 0) > 0 && (
                  <Text style={styles.verificationNoticeText}>
                    ⏳ Your installment repayment is pending verification by the administrator. Please wait.
                  </Text>
                )}
              </View>

              {(summary.pendingInstallmentsCount || 0) > 0 ? (
                <TouchableOpacity
                  style={[styles.payYellowButton, styles.pendingVerificationButton]}
                  disabled={true}
                  activeOpacity={1}
                >
                  <Text style={styles.pendingVerificationButtonText}>Verification Pending ⏳</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.payYellowButton}
                  onPress={() => {
                    if (summary.nextDueInstallmentId) {
                      navigation.navigate('Payment', {
                        installmentId: summary.nextDueInstallmentId,
                        amount: loan.daily_installment
                      });
                    } else {
                      Alert.alert('Info', 'No unpaid installment due at the moment.');
                    }
                  }}
                  disabled={paying}
                  activeOpacity={0.9}
                >
                  {paying ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={styles.payButtonText}>Pay Installment: ₹{loan.daily_installment}</Text>
                  )}
                </TouchableOpacity>
              )}
              <View style={styles.repaymentFooter}>
                <Text style={styles.activeLoanCountText}>Active Loans: 1</Text>
                <View style={styles.footerCalendarRow}>
                  <Text style={styles.calendarEmoji}>📅</Text>
                  <Text style={styles.dueDateText}>on {summary.nextDue || 'today'}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* 3. Unified Daily Finance Loan Apply Card */}
      {!summary?.hasActiveLoan && (
        <View style={styles.loanApplySection}>
          <Text style={styles.sectionHeader}>Daily Finance Loan</Text>

          <View style={styles.applyCard}>
            <View style={styles.cardTopBar}>
              <Text style={styles.applyCardTitle}>Daily Installment Loan</Text>
              <View style={styles.applyCardTag}>
                <Text style={styles.applyCardTagText}>⚡ INSTANT DISBURSAL</Text>
              </View>
            </View>
            <View style={styles.cardDetailsRow}>
              <View style={styles.loanIconCircle}>
                <Text style={styles.loanIconEmoji}>📅</Text>
              </View>
              <View style={styles.loanLimitInfo}>
                <Text style={styles.limitLabel}>AVAILABLE LIMITS</Text>
                <Text style={styles.limitAmount}>₹5,000 - ₹20,000+</Text>
                <Text style={styles.limitTenure}>Flexible daily terms (up to 100 days)</Text>
              </View>
              <TouchableOpacity
                style={styles.applyYellowButton}
                onPress={() => openApplyModal('Daily Finance Loan')}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loanFeaturesRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Instant Disbursal</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Daily Tracker</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Zero Collateral</Text>
              </View>
            </View>
          </View>
        </View>
      )}



      {/* Loan Proposal Application Modal */}
      <Modal
        visible={applyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request {selectedLoanType}</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Requested Amount (INR) *</Text>
                <View style={styles.amountPillsRow}>
                  {['5000', '10000', '20000'].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.amountPill,
                        !isCustomAmount && requestAmount === amt && styles.activeAmountPill
                      ]}
                      onPress={() => {
                        setRequestAmount(amt);
                        setIsCustomAmount(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.amountPillText,
                        !isCustomAmount && requestAmount === amt && styles.activeAmountPillText
                      ]}>
                        ₹{parseInt(amt).toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.amountPill,
                      isCustomAmount && styles.activeAmountPill
                    ]}
                    onPress={() => {
                      setIsCustomAmount(true);
                      setRequestAmount('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.amountPillText,
                      isCustomAmount && styles.activeAmountPillText
                    ]}>
                      More
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCustomAmount && (
                  <TextInput
                    style={[COMMON_STYLES.input, { marginTop: 10 }]}
                    keyboardType="numeric"
                    value={requestAmount}
                    onChangeText={setRequestAmount}
                    placeholder="Enter custom amount (e.g. 15000)"
                    placeholderTextColor={COLORS.placeholder}
                  />
                )}
              </View>

              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Duration Term (Days) *</Text>
                <TextInput
                  style={COMMON_STYLES.input}
                  keyboardType="numeric"
                  value={requestDuration}
                  onChangeText={setRequestDuration}
                  placeholder="e.g. 50"
                />
                <Text style={styles.helperText}>Daily repayments will adjust based on term length</Text>
              </View>

              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Purpose / Business Type</Text>
                <TextInput
                  style={COMMON_STYLES.input}
                  placeholder="e.g. Shop Inventory, Fruits vendor, Personal Needs"
                />
              </View>

              <TouchableOpacity
                style={[COMMON_STYLES.button, { marginTop: 12 }]}
                onPress={handleSubmitLoan}
                disabled={requestLoading}
              >
                {requestLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={COMMON_STYLES.buttonText}>Submit Loan Application</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: { color: COLORS.muted, fontSize: 14, marginTop: 8 },

  headerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImageHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  logoTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  logoTextBrand: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  logoTextSub: {
    color: COLORS.secondary,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
      default: {
        elevation: 1,
      }
    }),
  },
  headerBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },

  upiCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiIconEmoji: { fontSize: 20 },
  upiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upiTitle: { color: COLORS.heading, fontSize: 14, fontWeight: '800' },
  cashbackBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cashbackText: { color: '#EF4444', fontSize: 9, fontWeight: '800' },
  upiSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  yellowArrow: { color: COLORS.secondary, fontSize: 14, fontWeight: '900' },

  repaymentDueCard: {
    backgroundColor: '#0F172A',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  repaymentHeader: { 
    color: 'rgba(255, 255, 255, 0.45)', 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1.2, 
    textTransform: 'uppercase', 
    marginBottom: 16 
  },
  payYellowButton: {
    backgroundColor: '#FFC800',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#FFC800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  payButtonText: { color: '#0F172A', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  repaymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeLoanCountText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  footerCalendarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calendarEmoji: { fontSize: 12 },
  dueDateText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  pendingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pendingAmount: { color: COLORS.heading, fontSize: 24, fontWeight: '900' },
  pendingStatusText: { color: '#F59E0B', fontSize: 12, fontWeight: '800', marginTop: 6 },

  loanApplySection: { paddingHorizontal: 24, paddingTop: 20 },
  sectionHeader: { color: COLORS.heading, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  applyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  applyCardTitle: { color: COLORS.heading, fontSize: 14, fontWeight: '900' },
  applyCardTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applyCardTagText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanIconEmoji: { fontSize: 22 },
  loanLimitInfo: { flex: 1, marginLeft: 16 },
  limitLabel: { color: COLORS.placeholder, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  limitAmount: { color: COLORS.heading, fontSize: 18, fontWeight: '900', marginTop: 1 },
  limitTenure: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  applyYellowButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  loanFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureBullet: {
    color: COLORS.secondary,
    fontWeight: '900',
    fontSize: 14,
  },
  featureText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  amountPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  amountPill: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAmountPill: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  amountPillText: {
    color: COLORS.body,
    fontSize: 12,
    fontWeight: '800',
  },
  activeAmountPillText: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  subCardSection: { paddingHorizontal: 24, paddingTop: 10 },
  sectionSubHeader: { color: COLORS.heading, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 12 },
  subCardRow: { flexDirection: 'row', gap: 12 },
  subCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subCircleBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBadgeEmoji: { fontSize: 14 },
  subCardText: { color: COLORS.heading, fontSize: 12, fontWeight: '800' },
  yellowChevron: { color: COLORS.secondary, fontSize: 12, fontWeight: '900' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: COLORS.heading, fontSize: 18, fontWeight: '900' },
  closeBtn: { color: COLORS.muted, fontSize: 18, fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  modalScroll: { gap: 16, paddingBottom: 24 },
  helperText: { color: COLORS.placeholder, fontSize: 11, fontWeight: '600', marginTop: 4 },
  balanceInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  balanceLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  repaymentDetailText: {
    color: COLORS.placeholder,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  pendingVerificationButton: {
    backgroundColor: '#374151',
    shadowColor: 'transparent',
    elevation: 0,
  },
  pendingVerificationButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '900',
  },
  verificationNoticeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
});
