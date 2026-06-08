import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import COLORS from '../utils/theme';
import api from '../utils/api';

const WHATSAPP_NUMBER = '917659934261';

const upiApps = [
  { name: 'Google Pay', icon: '💚', color: '#4285F4' },
  { name: 'PhonePe', icon: '💜', color: '#5F259F' },
  { name: 'Paytm', icon: '🔵', color: '#00BAF2' },
  { name: 'BHIM UPI', icon: '🇮🇳', color: '#138808' },
];

export default function HowToRepayScreen({ navigation }: any) {
  const [upiId, setUpiId] = useState('dakshinamurthy@ybl');

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const response = await api.get('/customer/settings');
        const settings = response.data?.settings;
        if (settings?.official_upi_id && active) {
          setUpiId(settings.official_upi_id);
        }
      } catch (err) {
        console.error('Failed to fetch settings in HowToRepayScreen:', err);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  const steps = [
    {
      step: 1,
      title: 'Open any UPI app',
      desc: 'Launch Google Pay, PhonePe, Paytm or any BHIM UPI enabled app on your phone.',
      icon: 'phone-portrait-outline' as const,
    },
    {
      step: 2,
      title: 'Tap "Pay via UPI ID"',
      desc: 'Choose the "Send Money" or "Pay" option and select "UPI ID / VPA" as payment mode.',
      icon: 'wallet-outline' as const,
    },
    {
      step: 3,
      title: 'Enter the UPI ID',
      desc: `Type the UPI ID exactly:\n${upiId}\nVerify the name "Dakshinamurthy Finance" appears before proceeding.`,
      icon: 'create-outline' as const,
      highlight: upiId,
    },
    {
      step: 4,
      title: 'Enter installment amount',
      desc: 'Enter your daily installment amount (shown on your dashboard) and proceed to pay.',
      icon: 'cash-outline' as const,
    },
    {
      step: 5,
      title: 'Complete & note the UTR',
      desc: 'Confirm payment with your UPI PIN. Note the 12-digit UTR / Transaction Reference ID from the success screen.',
      icon: 'checkmark-circle-outline' as const,
    },
    {
      step: 6,
      title: 'Submit proof on the app',
      desc: 'On your Dashboard, tap "Pay Installment", enter the UTR number and upload the payment screenshot.',
      icon: 'cloud-upload-outline' as const,
    },
  ];

  const handleWhatsApp = () => {
    Linking.openURL(
      `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Dakshinamurthy%20Finance,%20I%20need%20help%20with%20my%20repayment.`
    ).catch(() => {});
  };

  const handleCopyUPI = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      try {
        await navigator.clipboard?.writeText(upiId);
        // No alert needed on web — clipboard copy is silent
      } catch {
        Alert.alert('Official UPI ID', upiId);
      }
    } else {
      // Use Share on Android/iOS — lets user copy/send the UPI ID directly
      try {
        await Share.share({ message: `Official UPI ID: ${upiId}` });
      } catch {
        Alert.alert('Official UPI ID', upiId);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Repay?</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Accepted Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Accepted Payment Method</Text>

        {/* UPI — Accepted */}
        <View style={styles.methodCard}>
          <View style={styles.methodAcceptRow}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <View style={styles.methodIconBox}>
              <FontAwesome5 name="university" size={14} color="#6366F1" />
            </View>
            <Text style={styles.methodName}>UPI Payment</Text>
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedText}>✓ Accepted</Text>
            </View>
          </View>
        </View>

        {/* Supported apps */}
        <View style={styles.appsRow}>
          {upiApps.map((app) => (
            <View key={app.name} style={styles.appPill}>
              <Text style={styles.appEmoji}>{app.icon}</Text>
              <Text style={styles.appName}>{app.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* UPI ID Card */}
      <View style={styles.upiIdCard}>
        <View style={styles.upiIdLeft}>
          <Text style={styles.upiIdLabel}>Official UPI ID</Text>
          <Text style={styles.upiIdValue}>{upiId}</Text>
          <Text style={styles.upiIdVerify}>
            ✓ Verify name: <Text style={styles.upiIdVerifyName}>Dakshinamurthy Finance</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyUPI} activeOpacity={0.8}>
          <MaterialIcons name="content-copy" size={16} color={COLORS.primary} />
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* Step-by-Step Guide */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Step-by-Step Guide</Text>

        {steps.map((item, idx) => (
          <View key={item.step} style={styles.stepRow}>
            {/* Step number & connector */}
            <View style={styles.stepLeft}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{item.step}</Text>
              </View>
              {idx < steps.length - 1 && <View style={styles.stepConnector} />}
            </View>

            {/* Step content */}
            <View style={styles.stepContent}>
              <View style={styles.stepTitleRow}>
                <Ionicons name={item.icon} size={16} color={COLORS.secondary} />
                <Text style={styles.stepTitle}>{item.title}</Text>
              </View>
              <Text style={styles.stepDesc}>{item.desc}</Text>
              {idx < steps.length - 1 && <View style={{ height: 20 }} />}
            </View>
          </View>
        ))}
      </View>

      {/* Fraud Warning */}
      <View style={styles.fraudWarning}>
        <View style={styles.fraudIconRow}>
          <Ionicons name="shield-checkmark" size={20} color="#B45309" />
          <Text style={styles.fraudTitle}>Fraud Alert</Text>
        </View>
        <Text style={styles.fraudText}>
          Beware of fraudsters asking you for money through unknown UPI IDs or bank transfers.
          Always pay ONLY to the official UPI ID above through authorised channels.
          Dakshinamurthy Finance will NEVER ask you to pay through an unknown link.
        </Text>
      </View>

      {/* WhatsApp Help Button */}
      <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
        <FontAwesome5 name="whatsapp" size={20} color="#FFFFFF" />
        <Text style={styles.whatsappBtnText}>Need Help? Chat on WhatsApp</Text>
        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: { paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } }),
  },
  methodAcceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  acceptedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },

  appsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  appPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  appEmoji: { fontSize: 13 },
  appName: { color: COLORS.heading, fontSize: 11, fontWeight: '700' },

  divider: {
    marginHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },

  upiIdCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({ web: { backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' } }),
  },
  upiIdLeft: { flex: 1 },
  upiIdLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  upiIdValue: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  upiIdVerify: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  upiIdVerifyName: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  copyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 32,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  stepNumber: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  stepConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  stepDesc: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  fraudWarning: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({ web: { backgroundImage: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' } }),
  },
  fraudIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  fraudTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
  },
  fraudText: {
    color: '#78350F',
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
    opacity: 0.85,
  },

  whatsappBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
});
