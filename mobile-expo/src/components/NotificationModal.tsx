import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Bell, X, Sparkles, Clock, CheckCircle } from 'lucide-react-native';
import { getMyNotificationsApi } from '../services/api';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotificationsApi();
      if (res?.data && res.data.length > 0) {
        setNotifications(res.data);
      } else {
        // Fallback demo notifications
        setNotifications([
          {
            id: 'n1',
            title: 'New Financer in Your Area! 💰',
            message: 'Apex Capital Microfinance has joined JustPaisa within 25 km of your location. Connect directly for quick working capital!',
            createdAt: new Date().toISOString(),
            type: 'LENDER_ALERT',
          },
          {
            id: 'n2',
            title: 'Welcome to JustPaisa! 🎉',
            message: 'Your account is verified. Connect with nearby lenders and track real-time loan offers.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            type: 'SYSTEM',
          },
        ]);
      }
    } catch (e) {
      console.log('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Bell size={20} color="#003893" />
              </View>
              <View>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subTitle}>Real-time updates & local financer alerts</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
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
              <Text style={styles.emptySub}>We will alert you when new financers join in your area!</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    padding: 6,
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
