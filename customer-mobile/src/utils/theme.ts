import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#111827',         // Charcoal Black (header / text)
  primaryLight: '#1F2937',    // Light Charcoal
  secondary: '#FFC800',       // KreditBee Yellow / Gold
  secondaryLight: '#FEF3C7',  // Soft gold cream background
  accent: '#10B981',          // Emerald Green
  background: '#F9FAFB',      // Premium canvas gray-white
  card: '#FFFFFF',            // Pure white cards
  heading: '#111827',         // Dark text
  body: '#4B5563',            // Gray body text
  border: '#E5E7EB',          // Light gray border
  error: '#EF4444',           // Red
  placeholder: '#9CA3AF',
  white: '#FFFFFF',
  muted: '#6B7280',
};

export const COMMON_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.heading,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});

export default COLORS;
