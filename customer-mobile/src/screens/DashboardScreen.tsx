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
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardSummary {
  hasActiveLoan: boolean;
  loan: {
    id: string;
    approved_amount: number;
    platform_charges: number;
    amount_disbursed: number;
    daily_installment: number;
    remaining_balance: number;
    total_repayment: number;
    duration_days: number;
    status: string;
    approval_date: string | null;
    interest_rate?: number;
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
  overdueCount?: number;
  overdueAmount?: number;
  pendingInstallmentIds?: string[];
  isTodayPaid?: boolean;
}

const getISTDateString = () => {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
};

let lastPaidSuccessNotifiedDate = '';
let lastDueNotifiedDate = '';

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);

  // Apply Modal State is removed to comply with Google Play Policy

  const scheduleRepaymentReminders = async (summary: any) => {
    if (Platform.OS === 'web' || !summary) return;

    const todayStr = getISTDateString();
    const loan = summary.loan;
    if (!loan) return;

    if (summary.isTodayPaid) {
      // 1. Paid today
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (err) {
        console.error('Failed to cancel scheduled notifications:', err);
      }

      try {
        await Notifications.dismissAllNotificationsAsync();
      } catch (err) {
        console.error('Failed to dismiss tray notifications:', err);
      }

      if (lastPaidSuccessNotifiedDate !== todayStr) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: Platform.OS === 'web' ? '✅ Daily Finance Payment Successful' : '✅ Daily Ledger Payment Successful',
              body: `Thank you! Your daily installment of ₹${loan.daily_installment} has been paid and recorded on ledger successfully. Keep it up!`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // immediate
          });
          lastPaidSuccessNotifiedDate = todayStr;
        } catch (err) {
          console.error('Failed to trigger payment success notification:', err);
        }
      }
    } else if (summary.dueTodayAmount > 0 || (summary.overdueCount || 0) > 0) {
      // 2. Unpaid today and has outstanding dues
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (err) {
        console.error('Failed to cancel scheduled notifications:', err);
      }

      // Schedule 2-hourly reminders after 5:00 PM today
      // Hours: 17:00, 19:00, 21:00, 23:00 (5 PM, 7 PM, 9 PM, 11 PM)
      const hours = [17, 19, 21, 23];
      for (const h of hours) {
        const triggerDate = new Date();
        triggerDate.setHours(h, 0, 0, 0);

        if (triggerDate.getTime() > Date.now()) {
          try {
            const isOverdue = (summary.overdueCount || 0) > 0;
            const title = isOverdue
              ? (Platform.OS === 'web' ? '🚨 Action Required: Late Payment Warning!' : '🚨 Action Required: Late Ledger Payment Warning!')
              : (Platform.OS === 'web' ? '📅 Daily Finance Payment Due Today' : '📅 Daily Ledger Payment Due Today');
            const body = isOverdue
              ? `You have missed ${summary.overdueCount} installment(s). Please clear dues immediately to protect your ledger profile!`
              : `Your daily installment of ₹${summary.dueTodayAmount || loan.daily_installment} is due. Settle today to keep your ledger score healthy!`;

            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                date: triggerDate,
              },
            });
          } catch (err) {
            console.error('Failed to schedule 2-hourly notification:', err);
          }
        }
      }

      // Trigger immediate tray alerts only once per day
      if (lastDueNotifiedDate !== todayStr) {
        const isOverdue = (summary.overdueCount || 0) > 0;
        if (isOverdue) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⚠️ Ledger Payment Overdue Warning!',
                body: `You have missed ${summary.overdueCount} installment(s). Your ledger profile score is at risk. Please clear dues immediately!`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null, // immediate
            });
            lastDueNotifiedDate = todayStr;
          } catch (err) {
            console.error('Failed to trigger overdue notification:', err);
          }

          // Trigger Alert dialog popup immediately when opening app (non-tray)
          Alert.alert(
            '⚠️ Ledger Payment Overdue Alert!',
            `You have missed ${summary.overdueCount} daily installment(s) (Total Overdue: ₹${summary.overdueAmount.toLocaleString('en-IN')}).\n\nCRITICAL: Your ledger profile score and future account eligibility will be negatively affected if you do not pay on time. Please clear your dues immediately!`,
            [
              {
                text: 'Pay Now',
                onPress: () => {
                  const oldestUnpaid = summary.unpaidInstallments?.find((i: any) => i.status === 'Unpaid');
                  if (oldestUnpaid) {
                    navigation.navigate('Payment', {
                      installmentId: oldestUnpaid.id,
                      amount: loan?.daily_installment || 0,
                    });
                  }
                },
              },
              { text: 'Dismiss', style: 'cancel' },
            ]
          );
        } else if (summary.dueTodayAmount > 0) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: Platform.OS === 'web' ? '📅 Daily Finance Payment Due Today' : '📅 Daily Ledger Payment Due Today',
                body: `Your daily installment of ₹${summary.dueTodayAmount} is due today. Settle today to keep your ledger score healthy!`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.DEFAULT,
              },
              trigger: null, // immediate
            });
            lastDueNotifiedDate = todayStr;
          } catch (err) {
            console.error('Failed to trigger daily due notification:', err);
          }
        }
      }
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/customer/dashboard');
      const dashboardSummary = response.data.summary;
      setSummary(dashboardSummary);

      await scheduleRepaymentReminders(dashboardSummary);

      // Fetch dynamic defaults from settings
      await api.get('/customer/settings');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Failed to get permissions for notifications!');
        }
      }
    }
    requestPermissions();
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

  // Application handling functions removed for policy compliance

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
      <View style={[
        styles.headerBar, 
        Platform.OS !== 'web' && { 
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: 12
        }
      ]}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImageHeader as any} 
            resizeMode="cover"
          />
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTextBrand}>DAKSHINAMURTHY</Text>
            <Text style={styles.logoTextSub}>{Platform.OS === 'web' ? 'DAILY FINANCE' : 'DAILY LEDGER'}</Text>
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

      {/* Zomato style urgent warning banner for overdue installments */}
      {summary?.hasActiveLoan && (summary as any).overdueCount > 0 && (
        <TouchableOpacity
          style={styles.overdueBanner}
          onPress={() => {
            if (summary.pendingInstallmentIds && summary.pendingInstallmentIds.length > 0) {
              navigation.navigate('Payment', {
                installmentIds: summary.pendingInstallmentIds,
                amount: summary.pendingInstallmentIds.length * (loan?.daily_installment || 0)
              });
            } else if ((summary as any).unpaidInstallments && (summary as any).unpaidInstallments.length > 0) {
              const oldestUnpaid = (summary as any).unpaidInstallments.find((i: any) => i.status === 'Unpaid');
              if (oldestUnpaid) {
                navigation.navigate('Payment', {
                  installmentId: oldestUnpaid.id,
                  amount: loan?.daily_installment || 0
                });
              } else {
                Alert.alert('Info', 'All missed installments are currently pending admin verification.');
              }
            }
          }}
          activeOpacity={0.95}
        >
          <View style={styles.overdueBannerLeft}>
            <Text style={styles.overdueBannerIcon}>🚨</Text>
            <View style={styles.overdueBannerTextContainer}>
              <Text style={styles.overdueBannerTitle}>⚠️ Repayment Overdue Alert!</Text>
              <Text style={styles.overdueBannerSubtitle}>
                Missed {(summary as any).overdueCount} installment{(summary as any).overdueCount > 1 ? 's' : ''}. Your lending profile score will be affected if you do not pay on time. Please clear today!
              </Text>
            </View>
          </View>
          <Text style={styles.overdueBannerBtnText}>Pay Now →</Text>
        </TouchableOpacity>
      )}

      {/* 2. Repayment Due Card (KreditBee Yellow Button style) */}
      {summary?.hasActiveLoan && loan && (
        <View style={styles.repaymentDueCard}>
          <Text style={styles.repaymentHeader}>Repayment Tracker</Text>
          
          {loan.status === 'Pending' ? (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingLabel}>Requested Account Balance</Text>
              <Text style={styles.pendingAmount}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingStatusText}>⏳  Account Verification — Pending Admin Review</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.balanceInfoContainer}>
                <Text style={styles.balanceLabel}>Current Amount to be Paid</Text>
                <Text style={styles.balanceAmount}>₹{loan.remaining_balance.toLocaleString('en-IN')}</Text>
                
                {/* Beautiful breakdown grid showing Principal, Interest Rate, and Total Repayable */}
                <View style={styles.loanDetailsGrid}>
                  <View style={styles.loanDetailsGridItem}>
                    <Text style={styles.loanDetailsGridLabel}>Taken Amount</Text>
                    <Text style={styles.loanDetailsGridValue}>₹{loan.approved_amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.loanDetailsGridItem, styles.loanDetailsGridItemBorder]}>
                    <Text style={styles.loanDetailsGridLabel}>Interest Rate</Text>
                    <Text style={styles.loanDetailsGridValue}>
                      {loan.interest_rate !== undefined && loan.interest_rate !== null && loan.interest_rate > 0
                        ? `${loan.interest_rate}%`
                        : (loan.approved_amount > 0 
                          ? `${Math.round(((loan.total_repayment + (loan.platform_charges || 0) - loan.approved_amount) / loan.approved_amount) * 100)}%`
                          : '0%')
                      }
                    </Text>
                  </View>
                  <View style={styles.loanDetailsGridItem}>
                    <Text style={styles.loanDetailsGridLabel}>Total Payable</Text>
                    <Text style={styles.loanDetailsGridValue}>₹{loan.total_repayment.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

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
                    if (summary.pendingInstallmentIds && summary.pendingInstallmentIds.length > 0) {
                      navigation.navigate('Payment', {
                        installmentIds: summary.pendingInstallmentIds,
                        amount: summary.pendingInstallmentIds.length * loan.daily_installment
                      });
                    } else if (summary.nextDueInstallmentId) {
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
                    <Text style={styles.payButtonText}>
                      {summary.pendingInstallmentIds && summary.pendingInstallmentIds.length > 0
                        ? `Pay Pending Installments: ₹${(summary.pendingInstallmentIds.length * loan.daily_installment).toLocaleString('en-IN')}`
                        : `Pay Installment: ₹${loan.daily_installment.toLocaleString('en-IN')}`
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              <View style={styles.repaymentFooter}>
                <Text style={styles.activeLoanCountText}>Active Ledgers: 1</Text>
                <View style={styles.footerCalendarRow}>
                  <Text style={styles.calendarEmoji}>📅</Text>
                  <Text style={styles.dueDateText}>on {summary.nextDue || 'today'}</Text>
                </View>
              </View>

              {/* Loan Details Quick Link */}
              <TouchableOpacity
                style={styles.loanDetailsQuickLink}
                onPress={() => navigation.navigate('LoanDetails', { loanId: loan.id })}
                activeOpacity={0.85}
              >
                <Text style={styles.loanDetailsQuickLinkText}>📋 View Ledger Details</Text>
                <Text style={styles.loanDetailsQuickLinkArrow}> →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* 2.5 Quick pay list of unpaid installments */}
      {summary?.hasActiveLoan && (summary as any).unpaidInstallments && (summary as any).unpaidInstallments.length > 0 && (
        <View style={styles.unpaidSection}>
          <Text style={styles.unpaidSectionHeader}>⚠️ Missed / Upcoming Dues</Text>
          <View style={styles.unpaidListContainer}>
            {(summary as any).unpaidInstallments.map((inst: any, idx: number) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isOverdue = inst.status === 'Unpaid' && inst.due_date < todayStr;
              
              return (
                <View key={inst.id} style={[styles.unpaidItemRow, isOverdue && styles.overdueItemRow]}>
                  <View style={styles.unpaidItemLeft}>
                    <View style={[styles.unpaidIndicator, isOverdue ? styles.overdueIndicator : styles.upcomingIndicator]}>
                      <Text style={styles.indicatorText}>{isOverdue ? '🚨' : '⏳'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.unpaidItemTitle, isOverdue && { color: '#EF4444' }]}>
                        {isOverdue ? 'Failed to Pay' : 'Upcoming Installment'}
                      </Text>
                      <Text style={styles.unpaidItemDate}>Due Date: {inst.due_date}</Text>
                      {inst.status === 'Pending' && (
                        <Text style={styles.pendingText}>Verification Pending...</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.unpaidItemRight}>
                    <Text style={styles.unpaidItemAmount}>₹{loan?.daily_installment || 0}</Text>
                    {inst.status === 'Pending' ? (
                      <View style={styles.pendingLabelBadge}>
                        <Text style={styles.pendingLabelBadgeText}>Pending</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.unpaidPayBtn}
                        onPress={() => {
                          navigation.navigate('Payment', {
                            installmentId: inst.id,
                            amount: loan?.daily_installment || 0
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.unpaidPayBtnText}>Pay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. Unified Daily Finance Loan Apply Card */}
      {!summary?.hasActiveLoan && (
        <View style={styles.loanApplySection}>
          <Text style={styles.sectionHeader}>Account Ledger</Text>

          <View style={styles.applyCard}>
            <View style={styles.cardTopBar}>
              <Text style={styles.applyCardTitle}>No Active Ledger Account</Text>
              <View style={[styles.applyCardTag, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.applyCardTagText, { color: '#6B7280' }]}>🔒 INACTIVE</Text>
              </View>
            </View>
            <View style={[styles.cardDetailsRow, { flexWrap: 'wrap', gap: 12 }]}>
              <View style={styles.loanIconCircle}>
                <Text style={styles.loanIconEmoji}>📝</Text>
              </View>
              <View style={[styles.loanLimitInfo, { flex: 1, minWidth: 200 }]}>
                <Text style={styles.limitLabel}>LEDGER STATUS</Text>
                <Text style={styles.limitAmount}>Inactive / Not Linked</Text>
                <Text style={[styles.limitTenure, { marginTop: 4, color: COLORS.muted }]}>
                  To track your transactions, outstanding balance, and daily payments, please contact your administrator offline to link your active daily ledger account.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}



      {/* Loan Proposal Application Modal is removed to comply with Google Play Policy */}
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 16,
  },
  pendingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pendingAmount: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -0.5 },
  pendingBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pendingStatusText: { color: '#F59E0B', fontSize: 12, fontWeight: '800', textAlign: 'center' },

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
  loanDetailsQuickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loanDetailsQuickLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  loanDetailsQuickLinkArrow: {
    color: '#FFC800',
    fontSize: 14,
    fontWeight: '900',
  },
  overdueBanner: {
    backgroundColor: '#EF4444',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)',
      },
    }),
  },
  overdueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  overdueBannerIcon: {
    fontSize: 20,
  },
  overdueBannerTextContainer: {
    flex: 1,
  },
  overdueBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  overdueBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 14,
  },
  overdueBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unpaidSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  unpaidSectionHeader: {
    color: COLORS.heading,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  unpaidListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)',
      },
    }),
  },
  unpaidItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  overdueItemRow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  unpaidItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  unpaidIndicator: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueIndicator: {
    backgroundColor: '#FEE2E2',
  },
  upcomingIndicator: {
    backgroundColor: '#EFF6FF',
  },
  indicatorText: {
    fontSize: 14,
  },
  unpaidItemTitle: {
    color: COLORS.heading,
    fontSize: 12,
    fontWeight: '800',
  },
  unpaidItemDate: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  pendingText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  unpaidItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  unpaidItemAmount: {
    color: COLORS.heading,
    fontSize: 13,
    fontWeight: '900',
  },
  pendingLabelBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  pendingLabelBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  unpaidPayBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  unpaidPayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  loanDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 18,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loanDetailsGridItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanDetailsGridItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  loanDetailsGridLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loanDetailsGridValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
});
