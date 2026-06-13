import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Platform,
} from 'react-native';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function LenderDetailsScreen() {
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      // Fallback silently on web platform
    });
  };

  const contactOptions = [
    {
      label: 'Primary Support Line',
      value: '+91 76599 34261',
      icon: '📞',
      isPrimary: true,
      action: () => handleCall('+917659934261'),
    },
    {
      label: 'WhatsApp Business',
      value: '+91 76599 34261',
      icon: '💬',
      isWhatsapp: true,
      action: () =>
        Linking.openURL(
          'https://wa.me/917659934261?text=Hello%20Dakshinamurthy%20Finance,%20I%20need%20assistance.'
        ),
    },
    {
      label: 'Headquarters Office',
      value: 'Srikakulam, Andhra Pradesh',
      icon: '📍',
      isAddress: true,
      action: undefined,
    },
    {
      label: 'Official Email Support',
      value: 'support@dailyfinance.com',
      icon: '📧',
      action: () => Linking.openURL('mailto:support@dailyfinance.com'),
    },
  ];

  const timings = [
    { day: 'Monday – Saturday', hours: '9:00 AM – 6:00 PM', isOpen: true },
    { day: 'Sunday', hours: 'Closed', isOpen: false },
    { day: 'Holidays', hours: 'Emergency Contact Only', isEmergency: true },
  ];

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Brand Hero Card with Logo Emblem */}
      <View style={styles.hero}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.heroTitle}>Dakshinamurthy Daily Finance</Text>
        <Text style={styles.heroSubtitle}>Your trusted daily ledger tracker</Text>
      </View>

      {/* Upgraded Modern Contact Channels */}
      <View style={[COMMON_STYLES.card, { marginHorizontal: 24, padding: 22, marginTop: -16 }]}>
        <Text style={styles.sectionTitle}>Contact Directory</Text>

        {contactOptions.map((contact, idx) => {
          const isButton = !!contact.action;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.contactRow,
                contact.isWhatsapp && styles.whatsappRow,
                idx < contactOptions.length - 1 && !contact.isWhatsapp && styles.rowBorder,
              ]}
              onPress={contact.action}
              disabled={!isButton}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.contactIconCircle,
                  contact.isWhatsapp && { backgroundColor: 'rgba(255,255,255,0.2)' },
                  contact.isPrimary && { backgroundColor: '#EFF6FF' },
                ]}
              >
                <Text
                  style={[
                    styles.contactIcon,
                    contact.isWhatsapp && { color: '#FFFFFF' },
                  ]}
                >
                  {contact.icon}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text
                  style={[
                    styles.contactLabel,
                    contact.isWhatsapp && { color: 'rgba(255,255,255,0.7)' },
                  ]}
                >
                  {contact.label}
                </Text>
                <Text
                  style={[
                    styles.contactValue,
                    contact.isWhatsapp && { color: '#FFFFFF', fontWeight: '800' },
                    isButton && !contact.isWhatsapp && { color: COLORS.secondary },
                  ]}
                >
                  {contact.value}
                </Text>
              </View>
              {isButton && (
                <Text
                  style={[
                    styles.tapHint,
                    contact.isWhatsapp && { color: '#FFFFFF', opacity: 0.8 },
                  ]}
                >
                  Tap →
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Business timings card */}
      <View style={[COMMON_STYLES.card, { marginHorizontal: 24, padding: 22 }]}>
        <Text style={styles.sectionTitle}>Business Timings</Text>
        {timings.map((t, idx) => (
          <View
            key={idx}
            style={[
              styles.timingRow,
              idx < timings.length - 1 && styles.rowBorder,
            ]}
          >
            <Text style={styles.timingDay}>{t.day}</Text>
            <Text
              style={[
                styles.timingHours,
                !t.isOpen && { color: '#EF4444' },
                t.isEmergency && { color: '#F59E0B' },
              ]}
            >
              {t.hours}
            </Text>
          </View>
        ))}
      </View>

      {/* Repayment Guidelines Card */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>💰 Repayment Guidelines</Text>
        <View style={styles.instructionsList}>
          {[
            'Always hand over installments to the authorized collection agent.',
            'Ensure payments are completed before 5:00 PM every day.',
            'Collect your physical or digital receipt for verification.',
            'In case of any issue, call office support immediately.',
            'Late installments attract automated notifications.',
          ].map((step, idx) => (
            <View key={idx} style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Developer Credit Footer */}
      <TouchableOpacity 
        onPress={() => Linking.openURL('https://www.codtechitsolutions.com/')}
        activeOpacity={0.7}
        style={styles.developerFooter}
      >
        <Text style={styles.developerText}>
          Developed by <Text style={styles.developerLinkText}>CODTECH IT SOLUTIONS</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  hero: {
    backgroundColor: '#0F172A',
    paddingTop: 36,
    paddingBottom: 44,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  logoWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', fontWeight: '500' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  whatsappRow: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  contactIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: { fontSize: 16 },
  contactInfo: { flex: 1 },
  contactLabel: {
    color: COLORS.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contactValue: { color: COLORS.heading, fontSize: 14, fontWeight: '700' },
  tapHint: { color: COLORS.secondary, fontSize: 11, fontWeight: '800' },

  timingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  timingDay: { color: COLORS.heading, fontSize: 14, fontWeight: '700' },
  timingHours: { color: '#D97706', fontSize: 13, fontWeight: '800' },

  instructionsCard: {
    backgroundColor: '#FFFDF2',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 24,
    marginTop: 18,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #FFFDF2 0%, #FEF3C7 100%)',
      },
    }),
  },
  instructionsTitle: { color: '#78350F', fontSize: 14, fontWeight: '800', marginBottom: 18 },
  instructionsList: { gap: 12 },
  instructionStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: { color: COLORS.secondary, fontSize: 11, fontWeight: '800' },
  stepText: { color: '#78350F', fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '600', opacity: 0.8 },
  developerFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  developerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  developerLinkText: {
    color: '#3B82F6',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
