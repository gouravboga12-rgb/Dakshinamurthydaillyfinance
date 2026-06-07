import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'loan' | 'payment' | 'status' | 'system' | 'alert';
  is_read: number; // 0 or 1
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/customer/notifications');
      setNotifications(response.data);
    } catch (err: any) {
      console.error('Fetch notifications error:', err);
      Alert.alert('Error', 'Failed to retrieve notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: number) => {
    if (isRead === 1) return; // Already read

    try {
      await api.patch(`/customer/notifications/${id}/read`);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: 1 } : notif))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => n.is_read === 0);
    if (unread.length === 0) return;

    try {
      setLoading(true);
      await Promise.all(unread.map((n) => api.patch(`/customer/notifications/${n.id}/read`)));
      fetchNotifications();
    } catch (err) {
      console.error('Mark all read error:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'loan':
        return { emoji: '📄', color: '#3B82F6', label: 'Loan' };
      case 'payment':
        return { emoji: '💰', color: '#10B981', label: 'Payment' };
      case 'status':
        return { emoji: '🔔', color: '#F59E0B', label: 'Status' };
      case 'alert':
        return { emoji: '🚨', color: '#EF4444', label: 'Alert' };
      case 'system':
      default:
        return { emoji: '⚙️', color: '#6B7280', label: 'System' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const iconData = getIcon(item.type);
    const isUnread = item.is_read === 0;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread ? styles.unreadCard : styles.readCard,
        ]}
        onPress={() => handleMarkAsRead(item.id, item.is_read)}
        activeOpacity={isUnread ? 0.7 : 1}
      >
        {/* Type indicator left border */}
        <View style={[styles.typeBorder, { backgroundColor: iconData.color }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{iconData.emoji}</Text>
              <Text style={[styles.typeLabel, { color: iconData.color }]}>
                {iconData.label}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
          </View>

          <Text style={[styles.titleText, isUnread ? styles.unreadTitle : styles.readTitle]}>
            {item.title}
          </Text>
          <Text style={[styles.messageText, isUnread ? styles.unreadMessage : styles.readMessage]}>
            {item.message}
          </Text>

          {isUnread && (
            <View style={styles.unreadDotContainer}>
              <View style={styles.unreadDot} />
              <Text style={styles.tapToReadText}>Tap to mark as read</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <View style={COMMON_STYLES.container}>
      {/* Top Header Control */}
      {unreadCount > 0 && (
        <View style={styles.actionsBar}>
          <Text style={styles.actionsText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.readAllButton}>
            <Text style={styles.readAllButtonText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No notifications to show. When you receive loan approvals, reminders, or updates, they'll appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  actionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  readAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  readAllButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: COLORS.white,
  },
  readCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    opacity: 0.75,
  },
  typeBorder: {
    width: 5,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeEmoji: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.muted,
  },
  titleText: {
    fontSize: 14,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  readTitle: {
    fontWeight: '600',
    color: COLORS.muted,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadMessage: {
    color: COLORS.body,
  },
  readMessage: {
    color: COLORS.placeholder,
  },
  unreadDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  tapToReadText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
