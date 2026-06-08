import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { RootState } from '../store';
import { logout, updateProfile } from '../store/authSlice';
import api, { getBaseUrl } from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';
import { fileUriToBase64 } from '../utils/file';

export default function ProfileScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [shopName, setShopName] = useState(user?.shop_name || '');
  const [address, setAddress] = useState(user?.address || '');

  const [avatarFile, setAvatarFile] = useState<any>(null);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<any>(null);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out of your account?');
      if (confirmed) {
        dispatch(logout());
        setTimeout(() => {
          window.location.href = '/';
          window.location.reload();
        }, 100);
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              dispatch(logout());
            },
          },
        ]
      );
    }
  };

  const startEditing = () => {
    setOccupation(user?.occupation || '');
    setShopName(user?.shop_name || '');
    setAddress(user?.address || '');
    setAvatarFile(null);
    setAvatarPreviewUri(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreviewUri(null);
  };

  const handleSelectAvatar = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          copyToCacheDirectory: true,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.size && asset.size > 2.5 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Avatar photo size exceeds the 2.5 MB limit. Please select a smaller photo.');
            return;
          }
          setAvatarFile({
            uri: asset.uri,
            name: asset.name || 'avatar.jpg',
            type: asset.mimeType || 'image/jpeg',
          });
          setAvatarPreviewUri(asset.uri);
        }
      } catch (err) {
        console.log('Error picking avatar image:', err);
        Alert.alert('Error', 'Failed to pick photo.');
      }
    }
  };

  const getAvatarSource = () => {
    if (avatarPreviewUri) {
      return { uri: avatarPreviewUri };
    }
    if (user?.avatar_url) {
      if (user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://')) {
        return { uri: user.avatar_url };
      }
      // Resolve relative path from Express backend
      const apiBaseUrl = getBaseUrl();
      const origin = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
      return { uri: `${origin}${user.avatar_url}` };
    }
    return { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80' };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let response;
      if (avatarFile) {
        const base64Data = await fileUriToBase64(avatarFile.uri);
        response = await api.put('/auth/profile', {
          occupation: occupation.trim(),
          shop_name: shopName.trim(),
          address: address.trim(),
          avatar_base64: base64Data,
        });
      } else {
        // Send as standard JSON if no file is selected (avoiding empty FormData formatting issues on native)
        response = await api.put('/auth/profile', {
          occupation: occupation.trim(),
          shop_name: shopName.trim(),
          address: address.trim(),
        });
      }

      const updatedUser = response.data.user;
      dispatch(updateProfile(updatedUser));

      if (Platform.OS === 'web') {
        alert('Profile updated successfully! 🎉');
      } else {
        Alert.alert('Success', 'Profile updated successfully! 🎉');
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.error || err.message || 'Failed to update profile. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Error: ${message}`);
      } else {
        Alert.alert('Update Failed', message);
      }
    } finally {
      setSaving(false);
    }
  };

  const personalFields = [
    { label: 'Full Name', value: user?.full_name || 'Customer', icon: '👤' },
    { label: 'Mobile Number', value: user?.mobile_number || '—', icon: '📱' },
    { label: 'Email Address', value: user?.email || 'Not Provided', icon: '✉️' },
    {
      label: 'Account Status',
      value: user?.status?.toUpperCase() || 'APPROVED',
      icon: '✅',
      isStatus: true,
    },
  ];

  const businessFields = [
    { label: 'Occupation', value: user?.occupation || 'Not Provided', icon: '💼' },
    { label: 'Shop / Company Name', value: user?.shop_name || 'Not Provided', icon: '🏢' },
    { label: 'Registered Address', value: user?.address || 'Not Provided', icon: '📍' },
  ];

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Premium Dark Profile Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.avatarWrapper, isEditing && styles.avatarWrapperEditing]}
          onPress={isEditing ? handleSelectAvatar : undefined}
          activeOpacity={isEditing ? 0.7 : 1}
        >
          <Image source={getAvatarSource()} style={styles.avatarImage} />
          {isEditing && (
            <View style={styles.avatarEditOverlay}>
              <Text style={styles.avatarEditOverlayText}>📷 CHANGE</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerName}>{user?.full_name || 'Customer'}</Text>
        <Text style={styles.headerMobile}>{user?.mobile_number || ''}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified Customer</Text>
        </View>
        {isEditing && (
          <Text style={styles.avatarHelperText}>Max avatar size: 2.5 MB (PNG, JPG)</Text>
        )}
      </View>

      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".png,.jpg,.jpeg"
          onChange={(e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 2.5 * 1024 * 1024) {
                alert('File size exceeds the 2.5 MB limit. Please select a smaller photo.');
                return;
              }
              setAvatarFile(file);
              setAvatarPreviewUri(URL.createObjectURL(file));
            }
          }}
        />
      )}

      {/* Personal Info Card */}
      <View style={[COMMON_STYLES.card, styles.infoCard, { marginTop: -16 }]}>
        <Text style={styles.sectionTitle}>👤 Personal Details</Text>

        {personalFields.map((field, idx) => (
          <View
            key={idx}
            style={[
              styles.fieldRow,
              idx < personalFields.length - 1 && styles.fieldBorder,
            ]}
          >
            <View style={styles.fieldLeft}>
              <View style={styles.fieldIconCircle}>
                <Text style={styles.fieldIcon}>{field.icon}</Text>
              </View>
              <View>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text
                  style={[
                    styles.fieldValue,
                    field.isStatus && { color: COLORS.accent, fontWeight: '900' },
                  ]}
                >
                  {field.value}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Business Info Card */}
      <View style={[COMMON_STYLES.card, styles.infoCard, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>🏢 Business & Address Details</Text>

        {isEditing ? (
          <View style={{ marginTop: 10 }}>
            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>💼 Occupation</Text>
              <TextInput
                style={styles.editTextInput}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="e.g. Merchant, Trader"
                placeholderTextColor={COLORS.placeholder}
              />
            </View>

            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>🏢 Shop / Company Name</Text>
              <TextInput
                style={styles.editTextInput}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Shop or company name"
                placeholderTextColor={COLORS.placeholder}
              />
            </View>

            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>📍 Registered Address</Text>
              <TextInput
                style={[styles.editTextInput, styles.editAddressInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                placeholderTextColor={COLORS.placeholder}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        ) : (
          businessFields.map((field, idx) => (
            <View
              key={idx}
              style={[
                styles.fieldRow,
                idx < businessFields.length - 1 && styles.fieldBorder,
              ]}
            >
              <View style={styles.fieldLeft}>
                <View style={styles.fieldIconCircle}>
                  <Text style={styles.fieldIcon}>{field.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue} numberOfLines={field.label === 'Registered Address' ? undefined : 1}>
                    {field.value}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Action Buttons (Save/Cancel or Edit Profile Details) */}
      {isEditing ? (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes ✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelEditing}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={startEditing}
          activeOpacity={0.85}
        >
          <Text style={styles.editButtonText}>✏️ Edit Profile Details</Text>
        </TouchableOpacity>
      )}

      {/* Premium Security Information */}
      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>🔒 Security & Access</Text>
        <Text style={styles.securityText}>
          Your account is secured with encrypted credentials and JWT sessions. Please contact your administrator if you need to modify your registration details.
        </Text>
      </View>

      {/* Modern styled Sign Out Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Sign Out of Account</Text>
      </TouchableOpacity>

      <Text style={styles.footerBrand}>Dakshinamurthy Daily Finance v1.4 (Multi-EMI & Size Enforced)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },

  header: {
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
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  avatarWrapperEditing: {
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  headerMobile: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 14, fontWeight: '500' },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
  },
  verifiedText: { color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  avatarHelperText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  infoCard: {
    marginHorizontal: 24,
    padding: 22,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  fieldIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldIcon: { fontSize: 16 },
  fieldLabel: {
    color: COLORS.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: { color: COLORS.heading, fontSize: 14, fontWeight: '800' },

  editInputGroup: {
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  editTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.heading,
  },
  editAddressInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  editButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { color: COLORS.secondary, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 20,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#64748B', fontWeight: '800', fontSize: 14 },

  securityCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 18,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      },
    }),
  },
  securityTitle: { color: '#1E40AF', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  securityText: { color: '#1E40AF', fontSize: 13, lineHeight: 18, fontWeight: '600', opacity: 0.8 },

  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 24,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  footerBrand: {
    textAlign: 'center',
    color: COLORS.placeholder,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 32,
  },
});
