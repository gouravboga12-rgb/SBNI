import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Bell, X, Sparkles, Clock, CheckCircle, Trash2 } from 'lucide-react-native';
import { getMyNotificationsApi, clearMyNotificationsApi } from '../services/api';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotificationsApi();
      if (res?.data && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.log('Error fetching notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all your notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              const res = await clearMyNotificationsApi();
              if (res?.success) {
                setNotifications([]);
              }
            } catch (e) {
              console.log('Error clearing notifications:', e);
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Bell size={18} color="#003893" />
                </View>
                <Text style={styles.title}>Notifications</Text>
                {notifications.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{notifications.length}</Text>
                  </View>
                )}
              </View>

              <View style={styles.headerRightActions}>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClearAll}
                    style={styles.clearAllButton}
                    disabled={clearing}
                    activeOpacity={0.7}
                  >
                    {clearing ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Trash2 size={12} color="#dc2626" />
                        <Text style={styles.clearAllText}>Clear all</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.subTitle}>Real-time updates & local partner alerts</Text>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#003893" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerBox}>
              <Bell size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySub}>We will alert you when new commercial partners join in your area!</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemBadge}>
                      <Sparkles size={12} color="#003893" />
                      <Text style={styles.badgeText}>{item.type || 'ALERT'}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={11} color="#94a3b8" />
                      <Text style={styles.timeText}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMessage}>{item.message}</Text>
                </View>
              )}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#003893',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748b',
    paddingLeft: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeFooterBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeFooterText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
});
