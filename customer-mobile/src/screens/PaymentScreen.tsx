import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import api, { getBaseUrl } from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function PaymentScreen({ route, navigation }: any) {
  const { installmentId, amount } = route.params;

  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [utr, setUtr] = useState('');
  const [proofFile, setProofFile] = useState<any>(null);
  const [proofPreviewUri, setProofPreviewUri] = useState<string | null>(null);

  const fileInputRef = useRef<any>(null);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/customer/settings');
      setQrUrl(response.data.settings.upi_qr_url);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSelectProof = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('Upload Proof', 'Proof screenshot upload is supported on the web platform.');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!utr.trim()) {
      if (Platform.OS === 'web') {
        alert('UTR Required: Please enter the 12-digit UTR/UPI Transaction Reference ID.');
      } else {
        Alert.alert('UTR Required', 'Please enter the 12-digit UTR/UPI Transaction Reference ID.');
      }
      return;
    }
    if (utr.trim().length !== 12 || isNaN(Number(utr.trim()))) {
      if (Platform.OS === 'web') {
        alert('Invalid UTR: The UTR/Transaction ID must be exactly a 12-digit numeric reference.');
      } else {
        Alert.alert('Invalid UTR', 'The UTR/Transaction ID must be exactly a 12-digit numeric reference.');
      }
      return;
    }
    if (!proofFile) {
      if (Platform.OS === 'web') {
        alert('Screenshot Required: Please select and upload a payment confirmation screenshot as proof.');
      } else {
        Alert.alert('Screenshot Required', 'Please select and upload a payment confirmation screenshot as proof.');
      }
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('installmentId', installmentId);
      formData.append('transaction_id', utr.trim());
      
      if (Platform.OS === 'web') {
        formData.append('proof', proofFile);
      } else {
        formData.append('proof', {
          uri: proofPreviewUri,
          name: 'proof.jpg',
          type: 'image/jpeg',
        } as any);
      }

      await api.post('/customer/pay-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (Platform.OS === 'web') {
        alert('Repayment Submitted! 🎉\n\nYour repayment proof has been successfully submitted to the administrator for review.');
      } else {
        Alert.alert(
          'Repayment Submitted! 🎉',
          'Your repayment proof has been successfully submitted to the administrator for review.',
          [{ text: 'Great' }]
        );
      }
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.error || 'Failed to submit payment proof. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Error: ${message}`);
      } else {
        Alert.alert('Submission Failed', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getQrSource = () => {
    if (qrUrl) {
      if (qrUrl.startsWith('http://') || qrUrl.startsWith('https://')) {
        return { uri: qrUrl };
      }
      const apiBaseUrl = getBaseUrl();
      const origin = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
      return { uri: `${origin}${qrUrl}` };
    }
    return { uri: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=dakshinamurthy@ybl%26pn=Dakshinamurthy%20Daily%20Finance' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching payment credentials...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      <View style={styles.paymentCard}>
        <Text style={styles.amountLabel}>INSTALLMENT DUE AMOUNT</Text>
        <Text style={styles.amountText}>₹{amount.toLocaleString('en-IN')}</Text>
      </View>

      {/* QR Code Card */}
      <View style={[COMMON_STYLES.card, styles.qrCard]}>
        <Text style={styles.cardTitle}>📱 Scan & Pay via UPI</Text>
        
        <View style={styles.qrWrapper}>
          <Image source={getQrSource()} style={styles.qrImage} resizeMode="contain" />
        </View>

        <Text style={styles.qrInstructions}>
          Scan this QR code with Google Pay, PhonePe, Paytm, BHIM, or any UPI app to pay.
        </Text>
      </View>

      {/* Submission Form */}
      <View style={[COMMON_STYLES.card, styles.formCard]}>
        <Text style={styles.formTitle}>📝 Submit Payment Proof</Text>

        <View style={COMMON_STYLES.inputGroup}>
          <Text style={COMMON_STYLES.label}>UTR / UPI Reference Number (12 digits) *</Text>
          <TextInput
            style={COMMON_STYLES.input}
            value={utr}
            onChangeText={setUtr}
            placeholder="e.g. 123456789012"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                setProofFile(file);
                setProofPreviewUri(URL.createObjectURL(file));
              }
            }}
          />
        )}

        <View style={styles.uploadContainer}>
          <Text style={COMMON_STYLES.label}>Payment Screenshot Proof *</Text>
          <TouchableOpacity
            style={[styles.uploadButton, proofFile && styles.uploadButtonSuccess]}
            onPress={handleSelectProof}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonText}>
              {proofFile ? `✓ Proof Attached: ${proofFile.name.slice(0, 20)}...` : '📸 Choose screenshot'}
            </Text>
          </TouchableOpacity>
          
          {proofPreviewUri && (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: proofPreviewUri }} style={styles.previewImage} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.6 }]}
          onPress={handlePaymentSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Verify & Submit Repayment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.muted, fontSize: 13, marginTop: 8 },

  paymentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  amountLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountText: {
    color: '#FFC800',
    fontSize: 32,
    fontWeight: '900',
  },

  qrCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  qrWrapper: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrInstructions: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontWeight: '600',
  },

  formCard: {
    padding: 20,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  uploadContainer: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadButtonSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderStyle: 'solid',
  },
  uploadButtonText: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: '700',
  },
  previewImageContainer: {
    marginTop: 12,
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  submitButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
